import { useReducer, useEffect, useMemo, useState, useCallback } from 'react';
import type { AppState, AppAction, CourseId, Page } from './types';
import { INITIAL_COURSES, INITIAL_SUBJECTS, INITIAL_ROOMS } from './data/initialData';
import { detectConflicts } from './utils/conflicts';
import * as db from './lib/db';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import TimetableView from './components/TimetableView';
import FacultyPage from './components/FacultyPage';
import ConflictsPanel from './components/ConflictsPanel';
import RoomsPage from './components/RoomsPage';

const initialState: AppState = {
  entries: [],
  faculty: [],
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
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [entries, faculty] = await Promise.all([db.getEntries(), db.getFaculty()]);
        dispatch({ type: 'LOAD_STATE', payload: { entries, faculty } });
      } catch (err) {
        setDbError('Could not connect to the database. Check your Supabase credentials.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  // Optimistic local update + fire-and-forget to Supabase
  const syncedDispatch = useCallback((action: AppAction): void => {
    dispatch(action);
    switch (action.type) {
      case 'ADD_ENTRY':    void db.addEntry(action.payload);    break;
      case 'UPDATE_ENTRY': void db.updateEntry(action.payload); break;
      case 'DELETE_ENTRY': void db.deleteEntry(action.payload); break;
      case 'ADD_FACULTY':    void db.addFaculty(action.payload);    break;
      case 'UPDATE_FACULTY': void db.updateFaculty(action.payload); break;
      case 'DELETE_FACULTY': void db.deleteFaculty(action.payload); break;
    }
  }, []);

  const facultyMap = useMemo(() => {
    const m = new Map<string, string>();
    state.faculty.forEach(f => m.set(f.id, f.name));
    return m;
  }, [state.faculty]);

  const conflicts = useMemo(
    () => detectConflicts(state.entries, state.courses, facultyMap),
    [state.entries, state.courses, facultyMap]
  );

  const nav = (page: Page) => dispatch({ type: 'SET_PAGE', payload: page });
  const selectCourse = (id: CourseId) => {
    dispatch({ type: 'SET_SELECTED_COURSE', payload: id });
    dispatch({ type: 'SET_PAGE', payload: 'timetable' });
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading timetable…</p>
        </div>
      </div>
    );
  }

  if (dbError) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center max-w-md px-6">
          <p className="text-red-600 font-semibold text-lg mb-2">Database connection failed</p>
          <p className="text-gray-500 text-sm">{dbError}</p>
          <p className="text-gray-400 text-xs mt-4">Make sure <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> are set in your <code>.env</code> file.</p>
        </div>
      </div>
    );
  }

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
            dispatch={syncedDispatch}
            conflicts={conflicts}
            facultyMap={facultyMap}
          />
        )}
        {state.currentPage === 'faculty' && (
          <FacultyPage
            faculty={state.faculty}
            dispatch={syncedDispatch}
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
