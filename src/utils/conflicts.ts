import type { TimetableEntry, ConflictInfo, Course, Day, TimeSlot } from '../types';
import { SLOT_TO_HOUR, TIME_LABELS, DAYS } from '../types';

// ─── helpers ──────────────────────────────────────────────────────────────────

function overlaps(s1: TimeSlot, d1: number, s2: TimeSlot, d2: number): boolean {
  const h1 = SLOT_TO_HOUR[s1];
  const h2 = SLOT_TO_HOUR[s2];
  const e1 = h1 + d1;
  const e2 = h2 + d2;
  if (e1 <= 13 && h2 >= 14) return false;
  if (e2 <= 13 && h1 >= 14) return false;
  return h1 < e2 && h2 < e1;
}

function sortedKey(...parts: string[]): string {
  return [...parts].sort((a, b) => a.localeCompare(b)).join('|');
}

function roomLabel(id: string): string {
  return id.replace(/^R/, 'Room ');
}

function groupByDay(entries: TimetableEntry[]): Map<Day, TimetableEntry[]> {
  const map = new Map<Day, TimetableEntry[]>();
  for (const e of entries) {
    if (!map.has(e.day)) map.set(e.day, []);
    map.get(e.day)!.push(e);
  }
  return map;
}

// ─── HARD ERRORS ─────────────────────────────────────────────────────────────

/** Rule 1 & 2: Theory classroom double-booked (shared rooms & BP7 exclusive) */
function checkRoomConflict(
  e1: TimetableEntry,
  e2: TimetableEntry,
  courseRoomMap: Map<string, string>,
  day: Day,
  seen: Set<string>,
): ConflictInfo | null {
  if (e1.type !== 'theory' || e2.type !== 'theory') return null;
  const room1 = courseRoomMap.get(e1.courseId);
  const room2 = courseRoomMap.get(e2.courseId);
  if (!room1 || room1 !== room2) return null;

  const key = sortedKey(e1.id, e2.id, 'room', room1);
  if (seen.has(key)) return null;
  seen.add(key);
  return {
    id: key,
    type: 'room',
    severity: 'error',
    message: `${roomLabel(room1)} is double-booked: "${e1.subjectCode}" (${e1.courseId}) and "${e2.subjectCode}" (${e2.courseId}) overlap`,
    affectedEntryIds: [e1.id, e2.id],
    roomNumber: roomLabel(room1),
    day,
    startTime: e1.startTime,
  };
}

/** Rule 10: Same faculty in two practicals at the same time (lab overbooking) */
function checkLabConflicts(
  e1: TimetableEntry,
  e2: TimetableEntry,
  day: Day,
  facultyMap: Map<string, string>,
  seen: Set<string>,
): ConflictInfo[] {
  if (e1.type !== 'practical' || e2.type !== 'practical') return [];
  const shared = e1.facultyIds.filter(f => e2.facultyIds.includes(f));
  return shared.flatMap(fid => {
    const key = sortedKey(e1.id, e2.id, 'lab', fid);
    if (seen.has(key)) return [];
    seen.add(key);
    const name = facultyMap.get(fid) ?? fid;
    return [{
      id: key,
      type: 'lab' as const,
      severity: 'error' as const,
      message: `Lab overbooked — ${name} is supervising "${e1.subjectCode}" (${e1.courseId}) and "${e2.subjectCode}" (${e2.courseId}) simultaneously`,
      affectedEntryIds: [e1.id, e2.id],
      facultyName: name,
      day,
      startTime: e1.startTime,
    }];
  });
}

/** Rule 10: Faculty in theory class AND practical at the same time */
function checkMixedConflicts(
  e1: TimetableEntry,
  e2: TimetableEntry,
  day: Day,
  facultyMap: Map<string, string>,
  seen: Set<string>,
): ConflictInfo[] {
  if (e1.type === e2.type) return [];
  const theory = e1.type === 'theory' ? e1 : e2;
  const practical = e1.type === 'practical' ? e1 : e2;
  const shared = theory.facultyIds.filter(f => practical.facultyIds.includes(f));
  return shared.flatMap(fid => {
    const key = sortedKey(theory.id, practical.id, 'mixed', fid);
    if (seen.has(key)) return [];
    seen.add(key);
    const name = facultyMap.get(fid) ?? fid;
    return [{
      id: key,
      type: 'lab' as const,
      severity: 'error' as const,
      message: `${name} is in class (${theory.subjectCode}, ${theory.courseId}) and lab (${practical.subjectCode}, ${practical.courseId}) at the same time`,
      affectedEntryIds: [theory.id, practical.id],
      facultyName: name,
      day,
      startTime: theory.startTime,
    }];
  });
}

function checkPair(
  e1: TimetableEntry,
  e2: TimetableEntry,
  day: Day,
  courseRoomMap: Map<string, string>,
  facultyMap: Map<string, string>,
  seen: Set<string>,
): ConflictInfo[] {
  if (!overlaps(e1.startTime, e1.duration, e2.startTime, e2.duration)) return [];
  const roomConflict = checkRoomConflict(e1, e2, courseRoomMap, day, seen);
  return [
    ...(roomConflict ? [roomConflict] : []),
    ...checkLabConflicts(e1, e2, day, facultyMap, seen),
    ...checkMixedConflicts(e1, e2, day, facultyMap, seen),
  ];
}

// ─── WARNINGS ────────────────────────────────────────────────────────────────

/**
 * Rule 3: BP3A, BP3B, BP7 have only 4 theory subjects.
 * Warn if theory is spread across more than 4 days (should leave 1–2 days free).
 */
function checkFreeDays(entries: TimetableEntry[]): ConflictInfo[] {
  const lightCourses = ['BP3A', 'BP3B', 'BP7'] as const;
  return lightCourses.flatMap(courseId => {
    const theoryEntries = entries.filter(e => e.courseId === courseId && e.type === 'theory');
    const usedDays = new Set(theoryEntries.map(e => e.day));
    if (usedDays.size <= 4) return [];
    return [{
      id: `free-days-${courseId}`,
      type: 'schedule' as const,
      severity: 'warning' as const,
      message: `${courseId}: theory is on ${usedDays.size} days — only 4 subjects, so at least 1–2 days should be free`,
      affectedEntryIds: theoryEntries.map(e => e.id),
    }];
  });
}

/**
 * Rule 4: Practical classes should be in continuous blocks.
 * Warn if a practical entry's duration crosses the 1–2 PM lunch break.
 */
function checkPracticalsCrossLunch(entries: TimetableEntry[]): ConflictInfo[] {
  return entries
    .filter(e => e.type === 'practical')
    .flatMap(e => {
      const h = SLOT_TO_HOUR[e.startTime];
      const end = h + e.duration;
      if (h <= 12 && end > 13) {
        return [{
          id: `lunch-cross-${e.id}`,
          type: 'schedule' as const,
          severity: 'warning' as const,
          message: `Practical "${e.subjectCode}" (${e.courseId}) on ${e.day} crosses the lunch break (${TIME_LABELS[e.startTime]}, ${e.duration}h duration)`,
          affectedEntryIds: [e.id],
          day: e.day,
          startTime: e.startTime,
        }];
      }
      return [];
    });
}

/**
 * Rule 5: Avoid placing theory classes continuously for the same faculty without breaks.
 * Warn if a faculty member has 3 or more consecutive theory hours on the same day.
 */
function scanConsecutiveRuns(
  sorted: TimetableEntry[],
  fid: string,
  day: string,
  name: string,
  limit: number,
): ConflictInfo[] {
  const conflicts: ConflictInfo[] = [];
  let run: TimetableEntry[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const prevEnd = SLOT_TO_HOUR[sorted[i - 1].startTime] + sorted[i - 1].duration;
    const currStart = SLOT_TO_HOUR[sorted[i].startTime];
    run = prevEnd === currStart ? [...run, sorted[i]] : [sorted[i]];

    if (run.length >= limit) {
      conflicts.push({
        id: `consecutive-${fid}-${day}-${i}`,
        type: 'schedule',
        severity: 'warning',
        message: `${name} has ${run.length} consecutive theory hours on ${day} with no break`,
        affectedEntryIds: run.map(e => e.id),
        facultyName: name,
        day: day as Day,
        startTime: run[0].startTime,
      });
      run = [sorted[i]];
    }
  }

  return conflicts;
}

function checkConsecutiveTheory(
  entries: TimetableEntry[],
  facultyMap: Map<string, string>,
): ConflictInfo[] {
  const LIMIT = 3;
  const byFacultyDay = new Map<string, TimetableEntry[]>();

  for (const e of entries.filter(e2 => e2.type === 'theory')) {
    for (const fid of e.facultyIds) {
      const key = `${fid}|${e.day}`;
      if (!byFacultyDay.has(key)) byFacultyDay.set(key, []);
      byFacultyDay.get(key)!.push(e);
    }
  }

  return [...byFacultyDay.entries()].flatMap(([key, dayEntries]) => {
    const [fid, day] = key.split('|');
    const sorted = [...dayEntries].sort(
      (a, b) => SLOT_TO_HOUR[a.startTime] - SLOT_TO_HOUR[b.startTime]
    );
    return scanConsecutiveRuns(sorted, fid, day, facultyMap.get(fid) ?? fid, LIMIT);
  });
}

/**
 * Rule 6: Balanced daily workload.
 * Warn if a course has 4 or more theory entries on a single day (overloaded day).
 */
function checkDailyWorkload(entries: TimetableEntry[]): ConflictInfo[] {
  const LIMIT = 3;
  const conflicts: ConflictInfo[] = [];

  const byCourseDay = new Map<string, TimetableEntry[]>();
  for (const e of entries.filter(e2 => e2.type === 'theory')) {
    const key = `${e.courseId}|${e.day}`;
    if (!byCourseDay.has(key)) byCourseDay.set(key, []);
    byCourseDay.get(key)!.push(e);
  }

  for (const [key, dayEntries] of byCourseDay) {
    if (dayEntries.length <= LIMIT) continue;
    const [courseId, day] = key.split('|');
    conflicts.push({
      id: `workload-${courseId}-${day}`,
      type: 'schedule',
      severity: 'warning',
      message: `${courseId} has ${dayEntries.length} theory classes on ${day} — consider spreading the load`,
      affectedEntryIds: dayEntries.map(e => e.id),
      day: day as Day,
      startTime: dayEntries[0].startTime,
    });
  }

  return conflicts;
}

/**
 * Rule 7: Do not schedule theory classes at very late hours (4–5 PM) unnecessarily.
 */
function checkLateTheory(entries: TimetableEntry[]): ConflictInfo[] {
  return entries
    .filter(e => e.type === 'theory' && e.startTime === '16:00')
    .map(e => ({
      id: `late-theory-${e.id}`,
      type: 'schedule' as const,
      severity: 'warning' as const,
      message: `"${e.subjectCode}" (${e.courseId}) on ${e.day} is at the last slot (4–5 PM) — avoid late theory if possible`,
      affectedEntryIds: [e.id],
      day: e.day,
      startTime: e.startTime,
    }));
}


// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────

export function detectConflicts(
  entries: TimetableEntry[],
  courses: Course[],
  facultyMap: Map<string, string>,
): ConflictInfo[] {
  const seen = new Set<string>();
  const courseRoomMap = new Map(courses.map(c => [c.id, c.roomId]));
  const byDay = groupByDay(entries);

  // Hard errors — room & lab overbooking
  const errors: ConflictInfo[] = [];
  for (const [day, dayEntries] of byDay) {
    for (let i = 0; i < dayEntries.length; i++) {
      for (let j = i + 1; j < dayEntries.length; j++) {
        errors.push(...checkPair(dayEntries[i], dayEntries[j], day, courseRoomMap, facultyMap, seen));
      }
    }
  }

  // Warnings — schedule rule violations
  const warnings: ConflictInfo[] = [
    ...checkFreeDays(entries),
    ...checkPracticalsCrossLunch(entries),
    ...checkConsecutiveTheory(entries, facultyMap),
    ...checkDailyWorkload(entries),
    ...checkLateTheory(entries),
  ];

  return [...errors, ...warnings];
}

export function getConflictEntryIds(conflicts: ConflictInfo[]): Set<string> {
  const ids = new Set<string>();
  for (const c of conflicts) c.affectedEntryIds.forEach(id => ids.add(id));
  return ids;
}

export function getErrorEntryIds(conflicts: ConflictInfo[]): Set<string> {
  return getConflictEntryIds(conflicts.filter(c => c.severity === 'error'));
}

// ─── RULE SUMMARY (for display in UI) ────────────────────────────────────────

export const SCHEDULE_RULES = [
  { num: 1,  text: 'Shared rooms must not have overlapping schedules', type: 'error' },
  { num: 2,  text: 'B.Pharm 7th Sem has exclusive use of Room 212', type: 'error' },
  { num: 3,  text: 'BP3 & BP7: only 4 theory subjects — keep 1–2 days free', type: 'warning' },
  { num: 4,  text: 'Practical classes in continuous blocks (no lunch-break crossings)', type: 'warning' },
  { num: 5,  text: 'Avoid 3+ consecutive theory hours for the same faculty', type: 'warning' },
  { num: 6,  text: 'Balanced daily workload — max 3 theory classes per course per day', type: 'warning' },
  { num: 7,  text: 'Do not schedule theory at 4–5 PM unnecessarily', type: 'warning' },
  { num: 8,  text: 'B.Pharm 1st Sem: no specific timing restriction (rule removed)', type: 'info' },
  { num: 9,  text: 'Include faculty names, subject codes, room, and timings', type: 'info' },
  { num: 10, text: 'No faculty member allotted two classes at the same time', type: 'error' },
] as const;

/** Returns a per-day summary of free vs busy days for a given courseId */
export function getFreeDaySummary(
  entries: TimetableEntry[],
  courseId: string,
): { day: Day; hasTheory: boolean; hasPractical: boolean }[] {
  return DAYS.map(day => ({
    day,
    hasTheory: entries.some(e => e.courseId === courseId && e.day === day && e.type === 'theory'),
    hasPractical: entries.some(e => e.courseId === courseId && e.day === day && e.type === 'practical'),
  }));
}
