import { LayoutDashboard, Calendar, Users, AlertTriangle, Building2, ChevronLeft, ChevronRight, GraduationCap } from 'lucide-react';
import type { Course, CourseId, Page } from '../types';

interface Props {
  open: boolean;
  currentPage: Page;
  courses: Course[];
  selectedCourseId: CourseId;
  conflictCount: number;
  onNavigate: (page: Page) => void;
  onSelectCourse: (id: CourseId) => void;
  onToggle: () => void;
}

const COURSE_GROUPS = [
  { label: 'B.Pharm', ids: ['BP1A','BP1B','BP3A','BP3B','BP5A','BP5B','BP7'] },
  { label: 'M.Pharm', ids: ['MPH','MPC','MPL','MPG'] },
  { label: 'D.Pharm', ids: ['DP1','DP2'] },
] as const;

export default function Sidebar({ open, currentPage, courses, selectedCourseId, conflictCount, onNavigate, onSelectCourse, onToggle }: Props) {
  const courseMap = new Map(courses.map(c => [c.id, c]));

  const navItem = (page: Page, label: string, Icon: React.ElementType, badge?: number) => (
    <button
      onClick={() => onNavigate(page)}
      className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        currentPage === page ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
      }`}
    >
      <Icon size={18} />
      {open && <span className="flex-1 text-left">{label}</span>}
      {open && badge != null && badge > 0 && (
        <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">{badge}</span>
      )}
    </button>
  );

  return (
    <aside className={`flex flex-col bg-gray-900 transition-all duration-200 ${open ? 'w-64' : 'w-14'} min-h-screen flex-shrink-0`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        {open && (
          <div className="flex items-center gap-2">
            <GraduationCap size={22} className="text-blue-400" />
            <div>
              <p className="text-white font-bold text-sm leading-tight">SPS Timetable</p>
              <p className="text-gray-400 text-xs">2026–2027</p>
            </div>
          </div>
        )}
        <button onClick={onToggle} className="text-gray-400 hover:text-white p-1 rounded">
          {open ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      {/* Main Nav */}
      <nav className="p-2 space-y-1">
        {navItem('dashboard', 'Dashboard', LayoutDashboard)}
        {navItem('faculty', 'Faculty', Users)}
        {navItem('conflicts', 'Conflicts', AlertTriangle, conflictCount)}
        {navItem('rooms', 'Room Chart', Building2)}
      </nav>

      {/* Course List */}
      <div className="flex-1 overflow-y-auto p-2">
        {open && <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-2">Timetables</p>}
        {COURSE_GROUPS.map(group => {
          const groupCourses = group.ids.map(id => courseMap.get(id as CourseId)).filter(Boolean) as Course[];
          if (!groupCourses.length) return null;
          return (
            <div key={group.label} className="mb-3">
              {open && <p className="text-xs text-gray-500 px-2 mb-1">{group.label}</p>}
              {groupCourses.map(course => (
                <button
                  key={course.id}
                  onClick={() => onSelectCourse(course.id)}
                  className={`flex items-center gap-2 w-full px-2 py-1.5 rounded text-xs transition-colors mb-0.5 ${
                    selectedCourseId === course.id && currentPage === 'timetable'
                      ? 'bg-blue-700 text-white'
                      : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                  }`}
                  title={course.name}
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${course.bgClass.replace('bg-', 'bg-').replace('100', '400')}`} />
                  {open && <span className="truncate">{course.shortName}</span>}
                </button>
              ))}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      {open && (
        <div className="p-3 border-t border-gray-700 text-xs text-gray-500 text-center">
          School of Pharmaceutical Sciences
        </div>
      )}
    </aside>
  );
}
