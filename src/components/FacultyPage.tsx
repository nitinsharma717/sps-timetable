import { useState } from 'react';
import { Plus, Pencil, Trash2, X, Save, Users } from 'lucide-react';
import type { Faculty, AppAction } from '../types';

interface Props {
  faculty: Faculty[];
  dispatch: React.Dispatch<AppAction>;
}

const DEPARTMENTS = [
  'Pharmaceutics',
  'Pharmaceutical Chemistry',
  'Pharmacology',
  'Pharmacognosy',
  'Pharmacy Practice',
  'Other',
];

const empty: Omit<Faculty, 'id'> = { name: '', shortCode: '', department: 'Pharmaceutics', email: '', phone: '' };

function makeId() {
  return `F-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
}

export default function FacultyPage({ faculty, dispatch }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<Omit<Faculty, 'id'>>(empty);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');

  const filtered = faculty.filter(f => {
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.shortCode.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === 'All' || f.department === deptFilter;
    return matchSearch && matchDept;
  });

  const startEdit = (f: Faculty) => {
    setEditingId(f.id);
    setForm({ name: f.name, shortCode: f.shortCode, department: f.department, email: f.email ?? '', phone: f.phone ?? '' });
    setAdding(false);
  };

  const cancelEdit = () => { setEditingId(null); setAdding(false); setForm(empty); };

  const save = () => {
    if (!form.name.trim() || !form.shortCode.trim()) return;
    if (adding) {
      dispatch({ type: 'ADD_FACULTY', payload: { ...form, id: makeId() } });
    } else if (editingId) {
      dispatch({ type: 'UPDATE_FACULTY', payload: { ...form, id: editingId } });
    }
    cancelEdit();
  };

  const depts = ['All', ...DEPARTMENTS];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users size={24} className="text-blue-600" /> Faculty Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">{faculty.length} faculty members · Click a row to edit</p>
        </div>
        <button
          onClick={() => { setAdding(true); setEditingId(null); setForm(empty); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Plus size={16} /> Add Faculty
        </button>
      </div>

      {/* Add form */}
      {(adding || editingId) && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <h3 className="font-semibold text-blue-900 mb-4">{adding ? 'Add New Faculty' : 'Edit Faculty'}</h3>
          <div className="grid grid-cols-2 gap-4">
            <label className="block col-span-2 sm:col-span-1">
              <span className="text-sm font-medium text-gray-700">Full Name *</span>
              <input
                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="Dr. Full Name"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Short Code *</span>
              <input
                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. NS"
                value={form.shortCode}
                onChange={e => setForm(f => ({ ...f, shortCode: e.target.value.toUpperCase() }))}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Department *</span>
              <select
                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                value={form.department}
                onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
              >
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Email</span>
              <input
                type="email"
                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="email@example.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Phone</span>
              <input
                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="+91 XXXXX XXXXX"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              />
            </label>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={save} disabled={!form.name.trim() || !form.shortCode.trim()} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              <Save size={14} /> {adding ? 'Add Faculty' : 'Save Changes'}
            </button>
            <button onClick={cancelEdit} className="flex items-center gap-2 text-gray-600 border border-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
              <X size={14} /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64 focus:ring-2 focus:ring-blue-500"
          placeholder="Search by name or code…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="flex gap-1 flex-wrap">
          {depts.map(d => (
            <button
              key={d}
              onClick={() => setDeptFilter(d)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                deptFilter === d ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-700">Name</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-700">Code</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-700">Department</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-700">Email</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-700">Phone</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">No faculty found.</td>
              </tr>
            )}
            {filtered.map(f => (
              <tr
                key={f.id}
                className={`hover:bg-gray-50 cursor-pointer ${editingId === f.id ? 'bg-blue-50' : ''}`}
                onClick={() => startEdit(f)}
              >
                <td className="px-4 py-3 font-medium text-gray-900">{f.name}</td>
                <td className="px-4 py-3">
                  <span className="bg-gray-100 text-gray-700 text-xs font-mono px-2 py-0.5 rounded">{f.shortCode}</span>
                </td>
                <td className="px-4 py-3 text-gray-600">{f.department}</td>
                <td className="px-4 py-3 text-gray-500">{f.email || '—'}</td>
                <td className="px-4 py-3 text-gray-500">{f.phone || '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={e => { e.stopPropagation(); startEdit(f); }}
                      className="text-gray-400 hover:text-blue-500 p-1 rounded"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        if (confirm(`Remove ${f.name}?`)) dispatch({ type: 'DELETE_FACULTY', payload: f.id });
                      }}
                      className="text-gray-400 hover:text-red-500 p-1 rounded"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
