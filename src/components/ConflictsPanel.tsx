import { AlertTriangle, CheckCircle2, Calendar, Info } from 'lucide-react';
import type { ConflictInfo, TimetableEntry, CourseId } from '../types';
import { TIME_LABELS } from '../types';
import { SCHEDULE_RULES } from '../utils/conflicts';

interface Props {
  readonly conflicts: ConflictInfo[];
  readonly entries: TimetableEntry[];
  readonly facultyMap: Map<string, string>;
  readonly onSelectCourse: (id: CourseId) => void;
}

function timeLabel(conflict: ConflictInfo): string {
  return conflict.startTime ? ` at ${TIME_LABELS[conflict.startTime]}` : '';
}

function conflictTitle(conflict: ConflictInfo): string {
  if (conflict.type === 'room') return `${conflict.roomNumber ?? 'Room'} double-booked${timeLabel(conflict)}`;
  if (conflict.type === 'lab') return `Lab overbooked — ${conflict.facultyName ?? 'Faculty'}${timeLabel(conflict)}`;
  return `Schedule rule violation${timeLabel(conflict)}`;
}

function EntryRow({ entry, facultyMap, onSelectCourse }: {
  readonly entry: TimetableEntry;
  readonly facultyMap: Map<string, string>;
  readonly onSelectCourse: (id: CourseId) => void;
}) {
  const facultyNames = entry.facultyIds.map(id => facultyMap.get(id) ?? id).join(', ');
  return (
    <div className="flex items-center justify-between gap-2 bg-gray-50 rounded-lg px-3 py-2">
      <div>
        <span className="text-sm font-semibold text-gray-800">{entry.subjectCode}</span>
        <span className="text-gray-400 mx-1">·</span>
        <span className="text-sm text-gray-600">{entry.courseId}</span>
        {entry.batch && <span className="text-xs text-gray-400 ml-1">(Batch {entry.batch})</span>}
        <div className="text-xs text-gray-400 mt-0.5">Faculty: {facultyNames}</div>
      </div>
      <button
        onClick={() => onSelectCourse(entry.courseId)}
        className="text-xs text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap"
      >
        View →
      </button>
    </div>
  );
}

function ConflictCard({ conflict, entryMap, facultyMap, onSelectCourse }: {
  readonly conflict: ConflictInfo;
  readonly entryMap: Map<string, TimetableEntry>;
  readonly facultyMap: Map<string, string>;
  readonly onSelectCourse: (id: CourseId) => void;
}) {
  const isError = conflict.severity === 'error';
  const affectedEntries = conflict.affectedEntryIds
    .map(id => entryMap.get(id))
    .filter((e): e is TimetableEntry => e !== undefined);

  const headerBg = isError ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200';
  const iconColor = isError ? 'text-red-500' : 'text-amber-500';
  const titleColor = isError ? 'text-red-800' : 'text-amber-800';
  const msgColor = isError ? 'text-red-600' : 'text-amber-700';

  return (
    <div className={`bg-white border rounded-xl overflow-hidden shadow-sm ${isError ? 'border-red-200' : 'border-amber-200'}`}>
      <div className={`px-4 py-3 flex items-start gap-3 ${headerBg}`}>
        <AlertTriangle size={18} className={`${iconColor} flex-shrink-0 mt-0.5`} />
        <div>
          <p className={`font-semibold text-sm ${titleColor}`}>{conflictTitle(conflict)}</p>
          <p className={`text-xs mt-0.5 ${msgColor}`}>{conflict.message}</p>
        </div>
      </div>
      {affectedEntries.length > 0 && (
        <div className="px-4 py-3 space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Affected Entries</p>
          {affectedEntries.map(e => (
            <EntryRow key={e.id} entry={e} facultyMap={facultyMap} onSelectCourse={onSelectCourse} />
          ))}
        </div>
      )}
    </div>
  );
}

function headerIconColor(errorCount: number, warningCount: number): string {
  if (errorCount > 0) return 'text-red-500';
  if (warningCount > 0) return 'text-amber-500';
  return 'text-green-500';
}

function ruleNumberStyle(type: string): string {
  if (type === 'error') return 'bg-red-100 text-red-700';
  if (type === 'warning') return 'bg-amber-100 text-amber-700';
  return 'bg-blue-100 text-blue-700';
}

export default function ConflictsPanel({ conflicts, entries, facultyMap, onSelectCourse }: Props) {
  const entryMap = new Map(entries.map(e => [e.id, e]));

  const errors = conflicts.filter(c => c.severity === 'error');
  const warnings = conflicts.filter(c => c.severity === 'warning');

  const grouped = conflicts.reduce<Record<string, ConflictInfo[]>>((acc, c) => {
    const key = c.day ?? 'General';
    if (!acc[key]) acc[key] = [];
    acc[key].push(c);
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <AlertTriangle size={24} className={headerIconColor(errors.length, warnings.length)} />
          Conflict &amp; Rule Checker
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Hard errors (room/lab overbooking) and schedule rule warnings — all 10 rules enforced.
        </p>
      </div>

      {/* Rules reference */}
      <details className="bg-gray-50 border border-gray-200 rounded-xl">
        <summary className="px-4 py-3 cursor-pointer text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Info size={15} className="text-blue-500" /> View all 10 scheduling rules
        </summary>
        <ul className="px-4 pb-4 pt-1 space-y-1.5">
          {SCHEDULE_RULES.map(r => (
            <li key={r.num} className="flex items-start gap-2 text-sm">
              <span className={`mt-0.5 w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${ruleNumberStyle(r.type)}`}>
                {r.num}
              </span>
              <span className="text-gray-700">{r.text}</span>
            </li>
          ))}
        </ul>
      </details>

      {/* All-clear */}
      {conflicts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <CheckCircle2 size={56} className="text-green-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-800">All Rules Satisfied</h2>
          <p className="text-gray-400 mt-2 max-w-sm">
            No hard conflicts or schedule warnings. This panel updates in real time as you add entries.
          </p>
        </div>
      )}

      {/* Summary bar */}
      {conflicts.length > 0 && (
        <div className="flex flex-wrap gap-4">
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3">
              <AlertTriangle size={18} className="text-red-500" />
              <div>
                <p className="font-semibold text-red-800">{errors.length} hard error{errors.length === 1 ? '' : 's'}</p>
                <p className="text-red-600 text-xs">Must be fixed — room or lab double-booked</p>
              </div>
            </div>
          )}
          {warnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
              <AlertTriangle size={18} className="text-amber-500" />
              <div>
                <p className="font-semibold text-amber-800">{warnings.length} warning{warnings.length === 1 ? '' : 's'}</p>
                <p className="text-amber-700 text-xs">Should be resolved — schedule rule violations</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Grouped by day */}
      {conflicts.length > 0 && Object.entries(grouped).map(([day, dayConflicts]) => (
        <div key={day}>
          <h2 className="flex items-center gap-2 font-semibold text-gray-800 mb-3">
            <Calendar size={16} className="text-gray-500" />
            {day}
            <span className="text-xs font-normal text-gray-400 ml-1">
              ({dayConflicts.filter(c => c.severity === 'error').length} error
              {dayConflicts.filter(c => c.severity === 'error').length === 1 ? '' : 's'},&nbsp;
              {dayConflicts.filter(c => c.severity === 'warning').length} warning
              {dayConflicts.filter(c => c.severity === 'warning').length === 1 ? '' : 's'})
            </span>
          </h2>
          <div className="space-y-3">
            {dayConflicts.map(conflict => (
              <ConflictCard
                key={conflict.id}
                conflict={conflict}
                entryMap={entryMap}
                facultyMap={facultyMap}
                onSelectCourse={onSelectCourse}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
