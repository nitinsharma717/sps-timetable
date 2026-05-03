import { AlertTriangle, Calendar, Users, CheckCircle2, BookOpen } from 'lucide-react';
import type { AppState, ConflictInfo, CourseId, Page } from '../types';

interface Props {
  state: AppState;
  conflicts: ConflictInfo[];
  facultyMap: Map<string, string>;
  onSelectCourse: (id: CourseId) => void;
  onNavigate: (page: Page) => void;
}

export default function Dashboard({ state, conflicts, onSelectCourse, onNavigate }: Props) {
  const totalEntries = state.entries.length;
  const theoryEntries = state.entries.filter(e => e.type === 'theory').length;
  const practicalEntries = state.entries.filter(e => e.type === 'practical').length;
  const affectedIds = new Set(conflicts.flatMap(c => c.affectedEntryIds));

  const courseProgress = state.courses.map(course => {
    const courseEntries = state.entries.filter(e => e.courseId === course.id);
    const hasConflict = courseEntries.some(e => affectedIds.has(e.id));
    return { course, count: courseEntries.length, hasConflict };
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Timetable Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Academic Session 2026–2027 · School of Pharmaceutical Sciences</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Calendar size={20} className="text-blue-500" />} label="Total Entries" value={totalEntries} />
        <StatCard icon={<BookOpen size={20} className="text-green-500" />} label="Theory Classes" value={theoryEntries} />
        <StatCard icon={<BookOpen size={20} className="text-purple-500" />} label="Practicals" value={practicalEntries} />
        <StatCard
          icon={<AlertTriangle size={20} className={conflicts.length > 0 ? 'text-red-500' : 'text-green-500'} />}
          label="Conflicts"
          value={conflicts.length}
          highlight={conflicts.length > 0}
          onClick={() => onNavigate('conflicts')}
        />
      </div>

      {/* Conflicts banner */}
      {conflicts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-800">
                {conflicts.length} faculty conflict{conflicts.length > 1 ? 's' : ''} detected
              </p>
              <ul className="mt-2 space-y-1">
                {conflicts.slice(0, 3).map(c => (
                  <li key={c.id} className="text-sm text-red-700">{c.message}</li>
                ))}
                {conflicts.length > 3 && (
                  <li className="text-sm text-red-600 font-medium cursor-pointer underline" onClick={() => onNavigate('conflicts')}>
                    +{conflicts.length - 3} more — view all
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Course cards */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">All Classes</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {courseProgress.map(({ course, count, hasConflict }) => (
            <button
              key={course.id}
              onClick={() => onSelectCourse(course.id)}
              className={`text-left p-4 rounded-xl border-2 transition-all hover:shadow-md ${course.bgClass} ${course.borderClass}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className={`font-bold text-sm ${course.colorClass}`}>{course.shortName}</p>
                  <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{course.name}</p>
                </div>
                {hasConflict ? (
                  <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                ) : count > 0 ? (
                  <CheckCircle2 size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
                ) : null}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-gray-500">{count} entries scheduled</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${course.bgClass} ${course.colorClass} border ${course.borderClass}`}>
                  {course.theorySlot === 'morning' ? '10–1 Theory' : '2–5 Theory'}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Faculty load summary */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Users size={18} /> Faculty Teaching This Week
        </h2>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2 font-semibold text-gray-700">Faculty</th>
                <th className="text-left px-4 py-2 font-semibold text-gray-700">Department</th>
                <th className="text-center px-4 py-2 font-semibold text-gray-700">Sessions</th>
                <th className="text-center px-4 py-2 font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {state.faculty.map(f => {
                const sessions = state.entries.filter(e => e.facultyIds.includes(f.id)).length;
                const hasConflict = conflicts.some(c => c.facultyName === f.name);
                return (
                  <tr key={f.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-900">{f.name}</td>
                    <td className="px-4 py-2 text-gray-500">{f.department}</td>
                    <td className="px-4 py-2 text-center text-gray-700">{sessions}</td>
                    <td className="px-4 py-2 text-center">
                      {hasConflict ? (
                        <span className="inline-flex items-center gap-1 text-red-600 text-xs font-medium">
                          <AlertTriangle size={12} /> Conflict
                        </span>
                      ) : sessions > 0 ? (
                        <span className="text-green-600 text-xs font-medium">OK</span>
                      ) : (
                        <span className="text-gray-400 text-xs">Not scheduled</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, highlight, onClick }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  highlight?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border p-4 flex items-center gap-4 ${highlight ? 'border-red-300 cursor-pointer hover:bg-red-50' : 'border-gray-200'}`}
    >
      <div className="p-2 bg-gray-50 rounded-lg">{icon}</div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}
