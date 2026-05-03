import { AlertTriangle, CheckCircle2, Calendar } from 'lucide-react';
import type { ConflictInfo, TimetableEntry, CourseId } from '../types';
import { TIME_LABELS } from '../types';

interface Props {
  conflicts: ConflictInfo[];
  entries: TimetableEntry[];
  facultyMap: Map<string, string>;
  onSelectCourse: (id: CourseId) => void;
}

export default function ConflictsPanel({ conflicts, entries, facultyMap, onSelectCourse }: Props) {
  const entryMap = new Map(entries.map(e => [e.id, e]));

  const grouped = conflicts.reduce<Record<string, ConflictInfo[]>>((acc, c) => {
    const key = c.day;
    if (!acc[key]) acc[key] = [];
    acc[key].push(c);
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <AlertTriangle size={24} className={conflicts.length > 0 ? 'text-red-500' : 'text-green-500'} />
          Faculty Conflict Checker
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Real-time detection of double-booked faculty across all courses.
        </p>
      </div>

      {conflicts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <CheckCircle2 size={56} className="text-green-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-800">No Conflicts Detected</h2>
          <p className="text-gray-400 mt-2 max-w-sm">
            All faculty members have conflict-free schedules. Keep adding entries and this panel will auto-update.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4">
            <p className="font-semibold text-red-800 text-lg">{conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''} found</p>
            <p className="text-red-600 text-sm mt-1">Each conflict means a faculty member is scheduled in two places at the same time.</p>
          </div>

          {Object.entries(grouped).map(([day, dayConflicts]) => (
            <div key={day}>
              <h2 className="flex items-center gap-2 font-semibold text-gray-800 mb-3">
                <Calendar size={16} className="text-red-500" /> {day}
              </h2>
              <div className="space-y-3">
                {dayConflicts.map(conflict => {
                  const affectedEntries = conflict.affectedEntryIds.map(id => entryMap.get(id)).filter(Boolean) as TimetableEntry[];
                  return (
                    <div key={conflict.id} className="bg-white border border-red-200 rounded-xl overflow-hidden shadow-sm">
                      <div className="bg-red-50 px-4 py-3 flex items-start gap-3">
                        <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-red-800 text-sm">
                            {conflict.facultyName} — double-booked at {TIME_LABELS[conflict.startTime]}
                          </p>
                          <p className="text-red-600 text-xs mt-0.5">{conflict.message}</p>
                        </div>
                      </div>
                      {affectedEntries.length > 0 && (
                        <div className="px-4 py-3 space-y-2">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Conflicting Entries</p>
                          {affectedEntries.map(e => (
                            <div key={e.id} className="flex items-center justify-between gap-2 bg-gray-50 rounded-lg px-3 py-2">
                              <div>
                                <span className="text-sm font-semibold text-gray-800">{e.subjectCode}</span>
                                <span className="text-gray-400 mx-1">·</span>
                                <span className="text-sm text-gray-600">{e.courseId}</span>
                                {e.batch && <span className="text-xs text-gray-400 ml-1">(Batch {e.batch})</span>}
                                <div className="text-xs text-gray-400 mt-0.5">
                                  Faculty: {e.facultyIds.map(id => facultyMap.get(id) ?? id).join(', ')}
                                </div>
                              </div>
                              <button
                                onClick={() => onSelectCourse(e.courseId)}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap"
                              >
                                View →
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
