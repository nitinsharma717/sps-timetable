import { useState, useMemo } from 'react';
import type { AppState, AppAction, ConflictInfo, CourseId } from '../types';
import { DAYS, TIME_SLOTS, TIME_LABELS } from '../types';
import { getConflictEntryIds } from '../utils/conflicts';
import EntryModal from './EntryModal';
import type { TimetableEntry, Day, TimeSlot } from '../types';
import { AlertTriangle, Plus, Trash2, Pencil, ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  conflicts: ConflictInfo[];
  facultyMap: Map<string, string>;
}

export default function TimetableView({ state, dispatch, conflicts, facultyMap }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);
  const [prefillDay, setPrefillDay] = useState<Day | null>(null);
  const [prefillTime, setPrefillTime] = useState<TimeSlot | null>(null);

  const courseIdx = state.courses.findIndex(c => c.id === state.selectedCourseId);
  const course = state.courses[courseIdx];

  const conflictIds = useMemo(() => getConflictEntryIds(conflicts), [conflicts]);

  const courseEntries = useMemo(
    () => state.entries.filter(e => e.courseId === state.selectedCourseId),
    [state.entries, state.selectedCourseId]
  );

  // Build grid: day → timeSlot → entries[]
  const grid = useMemo(() => {
    const g: Record<string, Record<string, TimetableEntry[]>> = {};
    for (const day of DAYS) {
      g[day] = {};
      for (const slot of TIME_SLOTS) g[day][slot] = [];
    }
    for (const entry of courseEntries) {
      g[entry.day]?.[entry.startTime]?.push(entry);
    }
    return g;
  }, [courseEntries]);

  const navigate = (dir: 1 | -1) => {
    const nextIdx = (courseIdx + dir + state.courses.length) % state.courses.length;
    dispatch({ type: 'SET_SELECTED_COURSE', payload: state.courses[nextIdx].id as CourseId });
  };

  const openAdd = (day: Day, slot: TimeSlot) => {
    setEditingEntry(null);
    setPrefillDay(day);
    setPrefillTime(slot);
    setModalOpen(true);
  };

  const openEdit = (entry: TimetableEntry) => {
    setEditingEntry(entry);
    setPrefillDay(null);
    setPrefillTime(null);
    setModalOpen(true);
  };

  const handleSave = (entry: TimetableEntry) => {
    if (editingEntry) {
      dispatch({ type: 'UPDATE_ENTRY', payload: entry });
    } else {
      dispatch({ type: 'ADD_ENTRY', payload: entry });
    }
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    dispatch({ type: 'DELETE_ENTRY', payload: id });
  };

  if (!course) return <div className="p-8 text-gray-500">Select a course from the sidebar.</div>;

  const courseConflicts = conflicts.filter(c =>
    c.affectedEntryIds.some(id => courseEntries.find(e => e.id === id))
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={`${course.bgClass} border-b ${course.borderClass} px-6 py-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-white/50 text-gray-600">
              <ChevronLeft size={18} />
            </button>
            <div>
              <h1 className={`text-xl font-bold ${course.colorClass}`}>{course.name}</h1>
              <p className="text-sm text-gray-500">
                Room {state.rooms.find(r => r.id === course.roomId)?.number?.replace('Room ', '') ?? '—'} ·{' '}
                Theory {course.theorySlot === 'morning' ? '10:00 AM – 1:00 PM' : '2:00 PM – 5:00 PM'} ·{' '}
                Practicals in Labs
              </p>
            </div>
            <button onClick={() => navigate(1)} className="p-1.5 rounded-lg hover:bg-white/50 text-gray-600">
              <ChevronRight size={18} />
            </button>
          </div>
          <div className="flex items-center gap-3">
            {courseConflicts.length > 0 && (
              <span className="flex items-center gap-1.5 text-sm text-red-600 bg-red-100 px-3 py-1.5 rounded-lg font-medium">
                <AlertTriangle size={14} /> {courseConflicts.length} conflict{courseConflicts.length > 1 ? 's' : ''}
              </span>
            )}
            <button
              onClick={() => { setEditingEntry(null); setPrefillDay(null); setPrefillTime(null); setModalOpen(true); }}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} /> Add Entry
            </button>
          </div>
        </div>
      </div>

      {/* Conflict warnings */}
      {courseConflicts.length > 0 && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-3 space-y-1">
          {courseConflicts.map(c => (
            <p key={c.id} className="text-sm text-red-700 flex items-center gap-2">
              <AlertTriangle size={13} className="flex-shrink-0" /> {c.message}
            </p>
          ))}
        </div>
      )}

      {/* Grid */}
      <div className="flex-1 overflow-auto p-4">
        <div className="min-w-[900px]">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="w-28 bg-gray-50 border border-gray-200 px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Time
                </th>
                {DAYS.map(day => (
                  <th key={day} className="bg-gray-50 border border-gray-200 px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    {day.slice(0, 3)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Morning slots */}
              {TIME_SLOTS.slice(0, 3).map(slot => (
                <tr key={slot}>
                  <td className="border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-500 whitespace-nowrap">
                    {TIME_LABELS[slot]}
                  </td>
                  {DAYS.map(day => (
                    <GridCell
                      key={day}
                      entries={grid[day][slot]}
                      conflictIds={conflictIds}
                      facultyMap={facultyMap}
                      onAdd={() => openAdd(day as Day, slot as TimeSlot)}
                      onEdit={openEdit}
                      onDelete={handleDelete}
                      courseColorClass={course.colorClass}
                      courseBgClass={course.bgClass}
                    />
                  ))}
                </tr>
              ))}

              {/* Lunch */}
              <tr>
                <td className="border border-gray-200 bg-yellow-50 px-3 py-2 text-xs font-medium text-yellow-700">
                  1:00 – 2:00
                </td>
                <td colSpan={6} className="border border-gray-200 bg-yellow-50 text-center text-xs font-semibold text-yellow-700 py-2">
                  🍽 LUNCH BREAK
                </td>
              </tr>

              {/* Afternoon slots */}
              {TIME_SLOTS.slice(3).map(slot => (
                <tr key={slot}>
                  <td className="border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-500 whitespace-nowrap">
                    {TIME_LABELS[slot]}
                  </td>
                  {DAYS.map(day => (
                    <GridCell
                      key={day}
                      entries={grid[day][slot]}
                      conflictIds={conflictIds}
                      facultyMap={facultyMap}
                      onAdd={() => openAdd(day as Day, slot as TimeSlot)}
                      onEdit={openEdit}
                      onDelete={handleDelete}
                      courseColorClass={course.colorClass}
                      courseBgClass={course.bgClass}
                    />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-200 border border-blue-400" /> Theory</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-200 border border-green-400" /> Practical</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-200 border border-red-400" /> Conflict</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gray-100 border border-gray-300" /> Click + to add</span>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <EntryModal
          entry={editingEntry}
          courseId={state.selectedCourseId}
          courses={state.courses}
          subjects={state.subjects}
          faculty={state.faculty}
          prefillDay={prefillDay}
          prefillTime={prefillTime}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}

function GridCell({
  entries,
  conflictIds,
  facultyMap,
  onAdd,
  onEdit,
  onDelete,
  courseColorClass,
  courseBgClass,
}: {
  entries: TimetableEntry[];
  conflictIds: Set<string>;
  facultyMap: Map<string, string>;
  onAdd: () => void;
  onEdit: (e: TimetableEntry) => void;
  onDelete: (id: string) => void;
  courseColorClass: string;
  courseBgClass: string;
}) {
  return (
    <td className="border border-gray-200 p-1 align-top min-w-[120px] h-20">
      <div className="space-y-1 h-full">
        {entries.map(entry => {
          const isConflict = conflictIds.has(entry.id);
          const isPractical = entry.type === 'practical';
          const bg = isConflict
            ? 'bg-red-100 border-red-400'
            : isPractical
            ? 'bg-green-100 border-green-400'
            : `${courseBgClass} border-blue-300`;
          return (
            <div
              key={entry.id}
              className={`group relative rounded p-1.5 border text-xs ${bg} cursor-pointer hover:shadow-sm transition-shadow`}
              onClick={() => onEdit(entry)}
            >
              <div className="font-semibold text-gray-800 truncate">{entry.subjectCode}</div>
              {entry.batch && entry.batch !== 'All' && (
                <div className="text-gray-500">Batch {entry.batch}</div>
              )}
              <div className="text-gray-500 truncate">
                {entry.facultyIds.map(id => facultyMap.get(id) ?? id).join(', ').slice(0, 30)}
              </div>
              {isConflict && <AlertTriangle size={10} className="text-red-600 mt-0.5" />}
              <button
                onClick={e => { e.stopPropagation(); onDelete(entry.id); }}
                className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
              >
                <Trash2 size={10} />
              </button>
              <button
                onClick={e => { e.stopPropagation(); onEdit(entry); }}
                className="absolute top-0.5 right-4 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-500 transition-opacity"
              >
                <Pencil size={10} />
              </button>
            </div>
          );
        })}
        <button
          onClick={onAdd}
          className="w-full flex items-center justify-center text-gray-300 hover:text-blue-400 hover:bg-blue-50 rounded transition-colors py-1"
        >
          <Plus size={14} />
        </button>
      </div>
    </td>
  );
}
