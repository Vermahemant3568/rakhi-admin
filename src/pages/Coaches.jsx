import { useEffect, useState } from 'react';
import {
  getCoaches, storeCoach, updateCoach,
  toggleCoach, toggleLaunch, deleteCoach
} from '../api/coaches';
import Modal from '../components/Modal';
import FormInput from '../components/FormInput';
import ConfirmDialog from '../components/ConfirmDialog';

const empty = {
  name: '', slug: '', description: '',
  speciality: '', is_launch_coach: 0, sort_order: 0
};

function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

const COLORS = [
  'bg-purple-600', 'bg-blue-600', 'bg-emerald-600',
  'bg-rose-600', 'bg-amber-600', 'bg-cyan-600',
];

function CoachCard({ coach, onEdit, onToggle, onToggleLaunch, onDelete, toggling, togglingLaunch }) {
  const color = COLORS[coach.id % COLORS.length];
  const isProtected = !!coach.is_protected;

  return (
    <div className={`bg-gray-900 border rounded-2xl px-5 py-3 flex items-center gap-4 transition ${
      isProtected ? 'border-gray-700' : 'border-gray-800 hover:border-purple-700'
    }`}>

      {/* Avatar */}
      <div className={`${color} w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 relative`}>
        {initials(coach.name)}
        {isProtected && (
          <span className="absolute -bottom-1 -right-1 bg-gray-800 border border-gray-600 rounded-full text-[10px] w-4 h-4 flex items-center justify-center">
            🔒
          </span>
        )}
      </div>

      {/* Name + Slug + Users */}
      <div className="w-48 shrink-0">
        <p className="text-white font-semibold text-sm leading-tight">{coach.name}</p>
        <p className="text-gray-500 text-xs mt-0.5">/{coach.slug}</p>
        <p className="text-gray-600 text-xs mt-0.5">Sort: {coach.sort_order ?? 0}</p>
      </div>

      {/* Speciality */}
      <div className="w-52 shrink-0">
        <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">Speciality</p>
        <p className="text-purple-400 text-xs font-medium">{coach.speciality || '—'}</p>
      </div>

      {/* Description */}
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">Description</p>
        <p className="text-gray-400 text-xs leading-relaxed line-clamp-2">{coach.description || '—'}</p>
      </div>

      {/* Users count */}
      <div className="shrink-0">
        <span className="bg-gray-800 text-gray-300 text-xs font-medium px-3 py-1 rounded-lg">
          {coach.user_coaches_count ?? 0} users
        </span>
      </div>

      {/* Badges */}
      <div className="flex items-center gap-2 shrink-0">
        <span className={`text-xs font-semibold px-3 py-1 rounded-lg ${
          coach.is_active ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'
        }`}>
          {coach.is_active ? 'Active' : 'Inactive'}
        </span>
        <button
          onClick={() => !isProtected && onToggleLaunch(coach)}
          disabled={togglingLaunch === coach.id}
          title={isProtected ? 'Protected — cannot change launch status' : 'Toggle launch visibility'}
          className={`text-xs font-semibold px-3 py-1 rounded-lg transition disabled:opacity-50 ${
            (coach.is_launch_coach === 1 || coach.is_launch_coach === true)
              ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/40'
              : 'bg-gray-800 text-gray-500 hover:bg-gray-700'
          } ${isProtected ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
        >
          {togglingLaunch === coach.id ? '...' : (coach.is_launch_coach ? 'Launch' : 'No Launch')}
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => !isProtected && onToggle(coach)}
          disabled={toggling === coach.id || isProtected}
          title={isProtected ? 'Protected coach — cannot deactivate' : ''}
          className={`text-xs px-4 py-2 rounded-lg font-medium transition disabled:opacity-40 disabled:cursor-not-allowed ${
            coach.is_active
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {toggling === coach.id ? '...' : coach.is_active ? 'Deactivate' : 'Activate'}
        </button>
        <button
          onClick={() => onEdit(coach)}
          className="text-xs px-4 py-2 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white transition"
        >
          Edit
        </button>
        <button
          onClick={() => !isProtected && onDelete(coach)}
          disabled={isProtected}
          title={isProtected ? 'Protected coach — cannot delete' : ''}
          className="text-xs px-4 py-2 rounded-lg font-medium bg-gray-700 hover:bg-red-600 text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export default function Coaches() {
  const [coaches, setCoaches]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [modal, setModal]             = useState(false);
  const [editing, setEditing]         = useState(null);
  const [form, setForm]               = useState(empty);
  const [saving, setSaving]           = useState(false);
  const [toggling, setToggling]       = useState(null);
  const [togglingLaunch, setTogglingLaunch] = useState(null);
  const [deleting, setDeleting]       = useState(false);
  const [confirmDel, setConfirmDel]   = useState(null);
  const [toast, setToast]             = useState(null);

  const showToast = (msg, error = false) => {
    setToast({ msg, error });
    setTimeout(() => setToast(null), 3500);
  };

  const load = () => {
    setLoading(true);
    return getCoaches().then(r => {
      // API now returns { success, total, coaches }
      const data = r.data?.coaches ?? (Array.isArray(r.data) ? r.data : (r.data?.data ?? []));
      setCoaches(data);
      setLoading(false);
    }).catch(() => {
      showToast('Failed to load coaches.', true);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm(empty); setModal(true); };
  const openEdit = (coach) => {
    setEditing(coach);
    setForm({
      name:            coach.name            ?? '',
      slug:            coach.slug            ?? '',
      description:     coach.description     ?? '',
      speciality:      coach.speciality      ?? '',
      is_launch_coach: coach.is_launch_coach ? 1 : 0,
      sort_order:      coach.sort_order      ?? 0,
    });
    setModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing) {
        const res = await updateCoach(editing.id, form);
        // API returns { success, message, coach }
        const updated = res.data?.coach ?? { ...editing, ...form };
        setCoaches(prev => prev.map(c => c.id === editing.id ? { ...c, ...updated } : c));
      } else {
        const res = await storeCoach(form);
        // API returns { success, message, coach } with 201
        const created = res.data?.coach;
        if (created) setCoaches(prev => [...prev, created]);
        else await load();
      }
      setModal(false);
      showToast('Coach saved successfully!');
    } catch (err) {
      showToast(err?.response?.data?.message ?? 'Save failed. Please try again.', true);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (coach) => {
    setToggling(coach.id);
    try {
      const res = await toggleCoach(coach.id);
      const updated = res.data?.coach;
      setCoaches(prev => prev.map(c =>
        c.id === coach.id
          ? { ...c, is_active: updated ? updated.is_active : (c.is_active ? 0 : 1) }
          : c
      ));
    } catch (err) {
      // 422 = protected or business rule — show backend message
      showToast(err?.response?.data?.message ?? 'Failed to update status.', true);
    } finally {
      setToggling(null);
    }
  };

  const handleToggleLaunch = async (coach) => {
    setTogglingLaunch(coach.id);
    try {
      const res = await toggleLaunch(coach.id);
      const updated = res.data?.coach;
      setCoaches(prev => prev.map(c =>
        c.id === coach.id
          ? { ...c, is_launch_coach: updated ? updated.is_launch_coach : (c.is_launch_coach ? 0 : 1) }
          : c
      ));
    } catch (err) {
      showToast(err?.response?.data?.message ?? 'Failed to update launch status.', true);
    } finally {
      setTogglingLaunch(null);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteCoach(confirmDel.id);
      setCoaches(prev => prev.filter(c => c.id !== confirmDel.id));
      showToast('Coach deleted.');
      setConfirmDel(null);
    } catch (err) {
      // 422 = protected — show backend message, keep coach in list
      showToast(err?.response?.data?.message ?? 'Delete failed.', true);
    } finally {
      setDeleting(false);
    }
  };

  const f = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const filtered = coaches.filter(c =>
    !search ||
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.speciality?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-sm font-medium shadow-lg transition
          ${toast.error ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Coaches</h1>
          <p className="text-gray-400 text-sm mt-1">
            {coaches.length} total &nbsp;·&nbsp;
            {coaches.filter(c => c.is_active).length} active &nbsp;·&nbsp;
            {coaches.filter(c => c.is_launch_coach).length} launch &nbsp;·&nbsp;
            {coaches.filter(c => c.is_protected).length} protected
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search coaches…"
            className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-purple-500 outline-none text-sm transition w-56"
          />
          <button
            onClick={openAdd}
            className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap"
          >
            + Add Coach
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          {search ? 'No coaches match your search.' : 'No coaches found.'}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(coach => (
            <CoachCard
              key={coach.id}
              coach={coach}
              onEdit={openEdit}
              onToggle={handleToggle}
              onToggleLaunch={handleToggleLaunch}
              onDelete={setConfirmDel}
              toggling={toggling}
              togglingLaunch={togglingLaunch}
            />
          ))}
        </div>
      )}

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Edit Coach' : 'Add Coach'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Coach Name" value={form.name}      onChange={f('name')}      placeholder="e.g. Diabetes Coach" />
            <FormInput label="Slug"       value={form.slug}      onChange={f('slug')}      placeholder="e.g. diabetes" />
          </div>
          <FormInput label="Speciality"   value={form.speciality} onChange={f('speciality')} placeholder="e.g. Blood sugar, diet alignment" />
          <div className="space-y-1">
            <label className="text-sm text-gray-400">Description</label>
            <textarea
              value={form.description}
              onChange={f('description')}
              rows={3}
              placeholder="Brief description of this coach…"
              className="w-full bg-gray-800 text-white px-4 py-2.5 rounded-lg outline-none border border-gray-700 focus:border-purple-500 transition text-sm resize-none"
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="launch_coach"
                checked={form.is_launch_coach == 1}
                onChange={e => setForm({ ...form, is_launch_coach: e.target.checked ? 1 : 0 })}
                className="w-4 h-4 accent-purple-500"
              />
              <label htmlFor="launch_coach" className="text-sm text-gray-400 cursor-pointer">Show at launch</label>
            </div>
            <div className="w-28">
              <FormInput label="Sort Order" type="number" value={form.sort_order} onChange={f('sort_order')} />
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white py-2.5 rounded-lg transition text-sm font-medium"
          >
            {saving ? 'Saving…' : 'Save Coach'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmDel}
        onClose={() => setConfirmDel(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Coach"
        message={`Are you sure you want to delete "${confirmDel?.name}"? This cannot be undone.`}
      />
    </div>
  );
}
