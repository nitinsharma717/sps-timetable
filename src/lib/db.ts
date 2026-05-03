import { supabase } from './supabase';
import type { TimetableEntry, Faculty } from '../types';

// ── TimetableEntry row conversion ─────────────────────────────────────────────

type EntryRow = {
  id: string;
  course_id: string;
  subject_code: string;
  subject_name: string;
  faculty_ids: string[];
  day: string;
  start_time: string;
  duration: number;
  type: string;
  batch: string | null;
  notes: string | null;
};

function toEntry(row: EntryRow): TimetableEntry {
  return {
    id: row.id,
    courseId: row.course_id as TimetableEntry['courseId'],
    subjectCode: row.subject_code,
    subjectName: row.subject_name,
    facultyIds: row.faculty_ids,
    day: row.day as TimetableEntry['day'],
    startTime: row.start_time as TimetableEntry['startTime'],
    duration: row.duration as TimetableEntry['duration'],
    type: row.type as TimetableEntry['type'],
    batch: (row.batch ?? undefined) as TimetableEntry['batch'],
    notes: row.notes ?? undefined,
  };
}

function fromEntry(e: TimetableEntry): Omit<EntryRow, never> {
  return {
    id: e.id,
    course_id: e.courseId,
    subject_code: e.subjectCode,
    subject_name: e.subjectName,
    faculty_ids: e.facultyIds,
    day: e.day,
    start_time: e.startTime,
    duration: e.duration,
    type: e.type,
    batch: e.batch ?? null,
    notes: e.notes ?? null,
  };
}

// ── Faculty row conversion ────────────────────────────────────────────────────

type FacultyRow = {
  id: string;
  name: string;
  short_code: string;
  department: string;
  email: string | null;
  phone: string | null;
};

function toFaculty(row: FacultyRow): Faculty {
  return {
    id: row.id,
    name: row.name,
    shortCode: row.short_code,
    department: row.department,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
  };
}

function fromFaculty(f: Faculty): FacultyRow {
  return {
    id: f.id,
    name: f.name,
    short_code: f.shortCode,
    department: f.department,
    email: f.email ?? null,
    phone: f.phone ?? null,
  };
}

// ── Entries ───────────────────────────────────────────────────────────────────

export async function getEntries(): Promise<TimetableEntry[]> {
  const { data, error } = await supabase
    .from('timetable_entries')
    .select('*')
    .order('day')
    .order('start_time');
  if (error) throw error;
  return (data as EntryRow[]).map(toEntry);
}

export async function addEntry(entry: TimetableEntry): Promise<void> {
  const { error } = await supabase.from('timetable_entries').insert(fromEntry(entry));
  if (error) throw error;
}

export async function updateEntry(entry: TimetableEntry): Promise<void> {
  const { error } = await supabase
    .from('timetable_entries')
    .update(fromEntry(entry))
    .eq('id', entry.id);
  if (error) throw error;
}

export async function deleteEntry(id: string): Promise<void> {
  const { error } = await supabase.from('timetable_entries').delete().eq('id', id);
  if (error) throw error;
}

// ── Faculty ───────────────────────────────────────────────────────────────────

export async function getFaculty(): Promise<Faculty[]> {
  const { data, error } = await supabase
    .from('faculty')
    .select('*')
    .order('name');
  if (error) throw error;
  return (data as FacultyRow[]).map(toFaculty);
}

export async function addFaculty(f: Faculty): Promise<void> {
  const { error } = await supabase.from('faculty').insert(fromFaculty(f));
  if (error) throw error;
}

export async function updateFaculty(f: Faculty): Promise<void> {
  const { error } = await supabase
    .from('faculty')
    .update(fromFaculty(f))
    .eq('id', f.id);
  if (error) throw error;
}

export async function deleteFaculty(id: string): Promise<void> {
  const { error } = await supabase.from('faculty').delete().eq('id', id);
  if (error) throw error;
}
