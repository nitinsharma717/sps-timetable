import type { TimetableEntry, ConflictInfo, Day, TimeSlot } from '../types';
import { SLOT_TO_HOUR } from '../types';

function overlaps(
  s1: TimeSlot, d1: number,
  s2: TimeSlot, d2: number
): boolean {
  const h1 = SLOT_TO_HOUR[s1];
  const h2 = SLOT_TO_HOUR[s2];
  // effective end — skip the 1–2 lunch gap
  const end1 = h1 + d1 <= 13 ? h1 + d1 : Math.max(h1 + d1, h1 + d1 + 1);
  const end2 = h2 + d2 <= 13 ? h2 + d2 : Math.max(h2 + d2, h2 + d2 + 1);
  // no overlap if one ends at/before 13 and other starts at 14+
  const e1 = h1 + d1; // raw end in hours
  const e2 = h2 + d2;
  if (e1 <= 13 && h2 >= 14) return false;
  if (e2 <= 13 && h1 >= 14) return false;
  return h1 < e2 && h2 < e1;
}

export function detectConflicts(
  entries: TimetableEntry[],
  facultyMap: Map<string, string>
): ConflictInfo[] {
  const conflicts: ConflictInfo[] = [];
  const seen = new Set<string>();

  const byDay = new Map<Day, TimetableEntry[]>();
  for (const e of entries) {
    if (!byDay.has(e.day)) byDay.set(e.day, []);
    byDay.get(e.day)!.push(e);
  }

  for (const [day, dayEntries] of byDay) {
    for (let i = 0; i < dayEntries.length; i++) {
      for (let j = i + 1; j < dayEntries.length; j++) {
        const e1 = dayEntries[i];
        const e2 = dayEntries[j];

        if (!overlaps(e1.startTime, e1.duration, e2.startTime, e2.duration)) continue;

        // Faculty clash
        const shared = e1.facultyIds.filter(f => e2.facultyIds.includes(f));
        for (const fid of shared) {
          const key = [e1.id, e2.id, fid].sort().join('|');
          if (!seen.has(key)) {
            seen.add(key);
            conflicts.push({
              id: key,
              type: 'faculty',
              severity: 'error',
              message: `${facultyMap.get(fid) ?? fid} is double-booked: "${e1.subjectCode}" (${e1.courseId}) and "${e2.subjectCode}" (${e2.courseId})`,
              affectedEntryIds: [e1.id, e2.id],
              facultyName: facultyMap.get(fid) ?? fid,
              day,
              startTime: e1.startTime as TimeSlot,
            });
          }
        }
      }
    }
  }

  return conflicts;
}

export function getConflictEntryIds(conflicts: ConflictInfo[]): Set<string> {
  const ids = new Set<string>();
  for (const c of conflicts) c.affectedEntryIds.forEach(id => ids.add(id));
  return ids;
}
