import { useReducer, useEffect, useMemo, useState } from 'react';
import type { AppState, AppAction, CourseId, Page } from './types';
import { INITIAL_FACULTY, INITIAL_COURSES, INITIAL_SUBJECTS, INITIAL_ROOMS } from './data/initialData';
import { detectConflicts } from './utils/conflicts';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import TimetableView from './components/TimetableView';
import FacultyPage from './components/FacultyPage';
import ConflictsPanel from './components/ConflictsPanel';
import RoomsPage from './components/RoomsPage';

const STORAGE_KEY = 'sps-timetable-v1';

const initialState: AppState = {
  entries: [],
  faculty: INITIAL_FACULTY,
  subjects: INITIAL_SUBJECTS,
  courses: INITIAL_COURSES,
  rooms: INITIAL_ROOMS,
  selectedCourseId: 'BP1A',
  currentPage: 'dashboard',
};

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_ENTRY':
      return { ...state, entries: [...state.entries, action.payload] };
    case 'UPDATE_ENTRY':
      return { ...state, entries: state.entries.map(e => e.id === action.payload.id ? action.payload : e) };
    case 'DELETE_ENTRY':
      return { ...state, entries: state.entries.filter(e => e.id !== action.payload) };
    case 'ADD_FACULTY':
      return { ...state, faculty: [...state.faculty, action.payload] };
    case 'UPDATE_FACULTY':
      return { ...state, faculty: state.faculty.map(f => f.id === action.payload.id ? action.payload : f) };
    case 'DELETE_FACULTY':
      return { ...state, faculty: state.faculty.filter(f => f.id !== action.payload) };
    case 'SET_SELECTED_COURSE':
      return { ...state, selectedCourseId: action.payload };
    case 'SET_PAGE':
      return { ...state, currentPage: action.payload };
    case 'LOAD_STATE':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        dispatch({ type: 'LOAD_STATE', payload: parsed });
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    const toSave = {
      entries: state.entries,
      faculty: state.faculty,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  }, [state.entries, state.faculty]);

  const facultyMap = useMemo(() => {
    const m = new Map<string, string>();
    state.faculty.forEach(f => m.set(f.id, f.name));
    return m;
  }, [state.faculty]);

  const conflicts = useMemo(
    () => detectConflicts(state.entries, facultyMap),
    [state.entries, facultyMap]
  );

  const nav = (page: Page) => dispatch({ type: 'SET_PAGE', payload: page });
  const selectCourse = (id: CourseId) => {
    dispatch({ type: 'SET_SELECTED_COURSE', payload: id });
    dispatch({ type: 'SET_PAGE', payload: 'timetable' });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar
        open={sidebarOpen}
        currentPage={state.currentPage}
        courses={state.courses}
        selectedCourseId={state.selectedCourseId}
        conflictCount={conflicts.length}
        onNavigate={nav}
        onSelectCourse={selectCourse}
        onToggle={() => setSidebarOpen(o => !o)}
      />

      <main className="flex-1 overflow-auto">
        {state.currentPage === 'dashboard' && (
          <Dashboard
            state={state}
            conflicts={conflicts}
            facultyMap={facultyMap}
            onSelectCourse={selectCourse}
            onNavigate={nav}
          />
        )}
        {state.currentPage === 'timetable' && (
          <TimetableView
            state={state}
            dispatch={dispatch}
            conflicts={conflicts}
            facultyMap={facultyMap}
          />
        )}
        {state.currentPage === 'faculty' && (
          <FacultyPage
            faculty={state.faculty}
            dispatch={dispatch}
          />
        )}
        {state.currentPage === 'conflicts' && (
          <ConflictsPanel
            conflicts={conflicts}
            entries={state.entries}
            facultyMap={facultyMap}
            onSelectCourse={selectCourse}
          />
        )}
        {state.currentPage === 'rooms' && (
          <RoomsPage
            rooms={state.rooms}
            courses={state.courses}
            entries={state.entries}
          />
        )}
      </main>
    </div>
  );
}
