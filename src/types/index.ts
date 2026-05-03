export type Day = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
export type TimeSlot = '10:00' | '11:00' | '12:00' | '14:00' | '15:00' | '16:00';
export type BatchLabel = 'A' | 'B' | 'C' | 'All';

export const DAYS: Day[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const TIME_SLOTS: TimeSlot[] = ['10:00', '11:00', '12:00', '14:00', '15:00', '16:00'];
export const TIME_LABELS: Record<TimeSlot, string> = {
  '10:00': '10:00–11:00',
  '11:00': '11:00–12:00',
  '12:00': '12:00–1:00',
  '14:00': '2:00–3:00',
  '15:00': '3:00–4:00',
  '16:00': '4:00–5:00',
};

export const SLOT_TO_HOUR: Record<TimeSlot, number> = {
  '10:00': 10,
  '11:00': 11,
  '12:00': 12,
  '14:00': 14,
  '15:00': 15,
  '16:00': 16,
};

export const HOUR_TO_SLOT: Record<number, TimeSlot> = {
  10: '10:00',
  11: '11:00',
  12: '12:00',
  14: '14:00',
  15: '15:00',
  16: '16:00',
};

export interface Faculty {
  id: string;
  name: string;
  shortCode: string;
  department: string;
  email?: string;
  phone?: string;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  type: 'theory' | 'practical';
  duration: 1 | 2 | 3;
  courseId: string;
}

export type CourseId =
  | 'BP1A' | 'BP1B'
  | 'BP3A' | 'BP3B'
  | 'BP5A' | 'BP5B'
  | 'BP7'
  | 'MPH' | 'MPC' | 'MPL' | 'MPG'
  | 'DP1' | 'DP2';

export interface Course {
  id: CourseId;
  name: string;
  shortName: string;
  roomId: string;
  theorySlot: 'morning' | 'afternoon';
  colorClass: string;
  bgClass: string;
  borderClass: string;
}

export interface Room {
  id: string;
  number: string;
  capacity: number;
  type: 'classroom' | 'laboratory';
  notes?: string;
}

export interface TimetableEntry {
  id: string;
  courseId: CourseId;
  subjectCode: string;
  subjectName: string;
  facultyIds: string[];
  day: Day;
  startTime: TimeSlot;
  duration: 1 | 2 | 3;
  type: 'theory' | 'practical';
  batch?: BatchLabel;
  notes?: string;
}

export interface ConflictInfo {
  id: string;
  type: 'faculty' | 'room';
  severity: 'error';
  message: string;
  affectedEntryIds: string[];
  facultyName?: string;
  day: Day;
  startTime: TimeSlot;
}

export type Page = 'dashboard' | 'timetable' | 'faculty' | 'conflicts' | 'rooms';

export interface AppState {
  entries: TimetableEntry[];
  faculty: Faculty[];
  subjects: Subject[];
  courses: Course[];
  rooms: Room[];
  selectedCourseId: CourseId;
  currentPage: Page;
}

export type AppAction =
  | { type: 'ADD_ENTRY'; payload: TimetableEntry }
  | { type: 'UPDATE_ENTRY'; payload: TimetableEntry }
  | { type: 'DELETE_ENTRY'; payload: string }
  | { type: 'ADD_FACULTY'; payload: Faculty }
  | { type: 'UPDATE_FACULTY'; payload: Faculty }
  | { type: 'DELETE_FACULTY'; payload: string }
  | { type: 'SET_SELECTED_COURSE'; payload: CourseId }
  | { type: 'SET_PAGE'; payload: Page }
  | { type: 'LOAD_STATE'; payload: Partial<AppState> };
