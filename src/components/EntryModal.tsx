import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { TimetableEntry, Course, Subject, Faculty, CourseId, Day, TimeSlot, BatchLabel } from '../types';
import { DAYS, TIME_SLOTS, TIME_LABELS } from '../types';

interface Props {
  entry: TimetableEntry | null;
  courseId: CourseId;
  courses: Course[];
  subjects: Subject[];
  faculty: Faculty[];
  prefillDay: Day | null;
  prefillTime: TimeSlot | null;
  onSave: (entry: TimetableEntry) => void;
  onClose: () => void;
}

const BATCH_OPTIONS: BatchLabel[] = ['A', 'B', 'C', 'All'];

function makeId() {
  return `entry-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export default function EntryModal({ entry, courseId, courses, subjects, faculty, prefillDay, prefillTime, onSave, onClose }: Props) {
  const [form, setForm] = useState<{
    courseId: CourseId;
    subjectCode: string;
    subjectName: string;
    facultyIds: string[];
    day: Day;
    startTime: TimeSlot;
    duration: 1 | 2 | 3;
    type: 'theory' | 'practical';
    batch: BatchLabel;
    notes: string;
  }>({
    courseId: entry?.courseId ?? courseId,
    subjectCode: entry?.subjectCode ?? '',
    subjectName: entry?.subjectName ?? '',
    facultyIds: entry?.facultyIds ?? [],
    day: entry?.day ?? prefillDay ?? 'Monday',
    startTime: entry?.startTime ?? prefillTime ?? '10:00',
    duration: entry?.duration ?? 1,
    type: entry?.type ?? 'theory',
    batch: entry?.batch ?? 'All',
    notes: entry?.notes ?? '',
  });

  const courseSubjects = subjects.filter(s => s.courseId === form.courseId);

  useEffect(() => {
    const sub = subjects.find(s => s.code === form.subjectCode && s.courseId === form.courseId);
    if (sub) {
      setForm(f => ({ ...f, subjectName: sub.name, type: sub.type, duration: sub.duration as 1 | 2 | 3 }));
    }
  }, [form.subjectCode, form.courseId, subjects]);

  const toggleFaculty = (id: string) => {
    setForm(f => ({
      ...f,
      facultyIds: f.facultyIds.includes(id) ? f.facultyIds.filter(x => x !== id) : [...f.facultyIds, id],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subjectCode || !form.facultyIds.length) return;
    const saved: TimetableEntry = {
      id: entry?.id ?? makeId(),
      courseId: form.courseId,
      subjectCode: form.subjectCode,
      subjectName: form.subjectName,
      facultyIds: form.facultyIds,
      day: form.day,
      startTime: form.startTime,
      duration: form.duration,
      type: form.type,
      batch: form.batch === 'All' ? undefined : form.batch,
      notes: form.notes || undefined,
    };
    onSave(saved);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold text-gray-900">
            {entry ? 'Edit Timetable Entry' : 'Add Timetable Entry'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Course */}
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Course / Section</span>
              <select
                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={form.courseId}
                onChange={e => setForm(f => ({ ...f, courseId: e.target.value as CourseId, subjectCode: '', subjectName: '' }))}
              >
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Subject</span>
              <select
                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={form.subjectCode}
                onChange={e => setForm(f => ({ ...f, subjectCode: e.target.value }))}
                required
              >
                <option value="">— Select subject —</option>
                {courseSubjects.map(s => (
                  <option key={s.id} value={s.code}>{s.code} · {s.name}</option>
                ))}
                <option value="OTHER">Other (custom)</option>
              </select>
            </label>
          </div>

          {form.subjectCode === 'OTHER' && (
            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Subject Code</span>
                <input
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. BP-101T"
                  value={form.subjectCode === 'OTHER' ? '' : form.subjectCode}
                  onChange={e => setForm(f => ({ ...f, subjectCode: e.target.value }))}
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Subject Name</span>
                <input
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="Subject name"
                  value={form.subjectName}
                  onChange={e => setForm(f => ({ ...f, subjectName: e.target.value }))}
                />
              </label>
            </div>
          )}

          {/* Day / Time / Duration */}
          <div className="grid grid-cols-3 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Day</span>
              <select
                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                value={form.day}
                onChange={e => setForm(f => ({ ...f, day: e.target.value as Day }))}
              >
                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Start Time</span>
              <select
                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                value={form.startTime}
                onChange={e => setForm(f => ({ ...f, startTime: e.target.value as TimeSlot }))}
              >
                {TIME_SLOTS.map(s => <option key={s} value={s}>{TIME_LABELS[s]}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Duration (hrs)</span>
              <select
                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                value={form.duration}
                onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) as 1 | 2 | 3 }))}
              >
                <option value={1}>1 hour</option>
                <option value={2}>2 hours</option>
                <option value={3}>3 hours</option>
              </select>
            </label>
          </div>

          {/* Type / Batch */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium text-gray-700">Type</span>
              <div className="mt-1 flex gap-3">
                {(['theory', 'practical'] as const).map(t => (
                  <label key={t} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="type"
                      value={t}
                      checked={form.type === t}
                      onChange={() => setForm(f => ({ ...f, type: t }))}
                      className="accent-blue-600"
                    />
                    <span className="text-sm text-gray-700 capitalize">{t}</span>
                  </label>
                ))}
              </div>
            </div>
            {form.type === 'practical' && (
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Batch</span>
                <select
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  value={form.batch}
                  onChange={e => setForm(f => ({ ...f, batch: e.target.value as BatchLabel }))}
                >
                  {BATCH_OPTIONS.map(b => <option key={b} value={b}>{b === 'All' ? 'All Batches (Combined)' : `Batch ${b}`}</option>)}
                </select>
              </label>
            )}
          </div>

          {/* Faculty */}
          <div>
            <span className="text-sm font-medium text-gray-700">Faculty (select one or more)</span>
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2">
              {faculty.map(f => (
                <label key={f.id} className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-xs transition-colors ${form.facultyIds.includes(f.id) ? 'bg-blue-100 text-blue-800 font-medium' : 'hover:bg-gray-50 text-gray-700'}`}>
                  <input
                    type="checkbox"
                    checked={form.facultyIds.includes(f.id)}
                    onChange={() => toggleFaculty(f.id)}
                    className="accent-blue-600 flex-shrink-0"
                  />
                  <span className="truncate" title={f.name}>{f.name}</span>
                </label>
              ))}
            </div>
            {!form.facultyIds.length && (
              <p className="text-xs text-red-500 mt-1">Please select at least one faculty member.</p>
            )}
          </div>

          {/* Notes */}
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Notes (optional)</span>
            <input
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Combined section A+B+C"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            />
          </label>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!form.subjectCode || !form.facultyIds.length}
              className="px-6 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {entry ? 'Save Changes' : 'Add Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
