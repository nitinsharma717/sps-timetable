import { Building2 } from 'lucide-react';
import type { Room, Course, TimetableEntry } from '../types';
import { DAYS, TIME_SLOTS, TIME_LABELS } from '../types';

interface Props {
  rooms: Room[];
  courses: Course[];
  entries: TimetableEntry[];
}

export default function RoomsPage({ rooms, courses, entries }: Props) {
  const courseMap = new Map(courses.map(c => [c.id, c]));

  // For each classroom room, compute which slots are occupied
  const classrooms = rooms.filter(r => r.type === 'classroom');

  // Get theory entries for each course — these occupy theory classrooms
  const theoryEntries = entries.filter(e => e.type === 'theory');

  function getRoomEntries(room: Room, day: string, slot: string) {
    const roomCourses = courses.filter(c => c.roomId === room.id);
    const courseIds = new Set(roomCourses.map(c => c.id));
    return theoryEntries.filter(
      e => courseIds.has(e.courseId) && e.day === day && e.startTime === slot
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Building2 size={24} className="text-blue-600" /> Room Utilization Chart
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Theory classroom occupancy — Mon to Sat, 10 AM to 5 PM. Labs are separate and not shown here.
        </p>
      </div>

      {/* Room info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map(room => {
          const assignedCourses = courses.filter(c => c.roomId === room.id);
          const totalSlots = classrooms.includes(room) ? DAYS.length * TIME_SLOTS.length : 0;
          const usedSlots = DAYS.reduce((sum, day) =>
            sum + TIME_SLOTS.reduce((s, slot) => s + (getRoomEntries(room, day, slot).length > 0 ? 1 : 0), 0), 0);
          const pct = totalSlots ? Math.round((usedSlots / totalSlots) * 100) : 0;

          return (
            <div key={room.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-gray-900">{room.number}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{room.type === 'laboratory' ? 'Laboratory' : `Capacity: ${room.capacity}`}</p>
                </div>
                {room.type === 'classroom' && (
                  <span className={`text-sm font-bold ${pct > 75 ? 'text-red-600' : pct > 40 ? 'text-amber-600' : 'text-green-600'}`}>
                    {pct}%
                  </span>
                )}
              </div>
              {room.notes && <p className="text-xs text-gray-500 mt-2">{room.notes}</p>}
              {assignedCourses.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {assignedCourses.map(c => (
                    <span key={c.id} className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.bgClass} ${c.colorClass}`}>
                      {c.shortName}
                    </span>
                  ))}
                </div>
              )}
              {room.type === 'classroom' && totalSlots > 0 && (
                <div className="mt-3 bg-gray-100 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${pct > 75 ? 'bg-red-500' : pct > 40 ? 'bg-amber-500' : 'bg-green-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Utilization grids per room */}
      {classrooms.map(room => {
        const assignedCourses = courses.filter(c => c.roomId === room.id);
        if (!assignedCourses.length) return null;

        return (
          <div key={room.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">{room.number}</h3>
              <div className="flex gap-2">
                {assignedCourses.map(c => (
                  <span key={c.id} className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.bgClass} ${c.colorClass}`}>
                    {c.shortName}
                  </span>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="bg-gray-50 px-3 py-2 text-left text-gray-600 font-semibold border-b border-r border-gray-200 w-24">Time</th>
                    {DAYS.map(d => (
                      <th key={d} className="bg-gray-50 px-3 py-2 text-center text-gray-600 font-semibold border-b border-r border-gray-200">
                        {d.slice(0, 3)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TIME_SLOTS.slice(0, 3).map(slot => (
                    <tr key={slot}>
                      <td className="px-3 py-2 text-gray-500 border-b border-r border-gray-200 whitespace-nowrap font-medium">{TIME_LABELS[slot]}</td>
                      {DAYS.map(day => {
                        const slotEntries = getRoomEntries(room, day, slot);
                        return (
                          <td key={day} className={`px-2 py-2 border-b border-r border-gray-200 ${slotEntries.length > 0 ? '' : 'bg-gray-50'}`}>
                            {slotEntries.map(e => {
                              const c = courseMap.get(e.courseId);
                              return (
                                <span key={e.id} className={`block px-1.5 py-0.5 rounded text-xs font-medium mb-0.5 ${c?.bgClass ?? 'bg-gray-100'} ${c?.colorClass ?? 'text-gray-700'}`}>
                                  {e.subjectCode} · {c?.shortName}
                                </span>
                              );
                            })}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  <tr>
                    <td className="px-3 py-1.5 text-yellow-700 font-semibold bg-yellow-50 border-b border-r border-gray-200">Lunch</td>
                    <td colSpan={6} className="bg-yellow-50 border-b border-gray-200 text-center text-yellow-600 font-medium">Break</td>
                  </tr>
                  {TIME_SLOTS.slice(3).map(slot => (
                    <tr key={slot}>
                      <td className="px-3 py-2 text-gray-500 border-b border-r border-gray-200 whitespace-nowrap font-medium">{TIME_LABELS[slot]}</td>
                      {DAYS.map(day => {
                        const slotEntries = getRoomEntries(room, day, slot);
                        return (
                          <td key={day} className={`px-2 py-2 border-b border-r border-gray-200 ${slotEntries.length > 0 ? '' : 'bg-gray-50'}`}>
                            {slotEntries.map(e => {
                              const c = courseMap.get(e.courseId);
                              return (
                                <span key={e.id} className={`block px-1.5 py-0.5 rounded text-xs font-medium mb-0.5 ${c?.bgClass ?? 'bg-gray-100'} ${c?.colorClass ?? 'text-gray-700'}`}>
                                  {e.subjectCode} · {c?.shortName}
                                </span>
                              );
                            })}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
