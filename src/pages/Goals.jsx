import { useEffect, useState } from 'react';
import { getGoals, storeGoal, updateGoal, toggleGoal, deleteGoal } from '../api/goals';
import Modal from '../components/Modal';
import FormInput from '../components/FormInput';
import ConfirmDialog from '../components/ConfirmDialog';

const empty = { name: '', slug: '', description: '', sort_order: 0 };

const COLORS = [
  'bg-purple-600', 'bg-blue-600', 'bg-emerald-600',
  'bg-rose-600', 'bg-amber-600', 'bg-cyan-600',
];

function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function GoalRow({ goal, onEdit, onToggle, onDelete, toggling }) {
  const color = COLORS[goal.id % COLORS.length];
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl px-5 py-3 flex items-center gap-4 hover:border-purple-700 transition">

      {/* Avatar */}
      <div className={`${color} w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0`}>
        {initials(goal.name)}
      </div>

      {/* Name + Slug */}
      <div className="w-52 shrink-0">
        <p className="text-white font-semibold text-sm leading-tight">{goal.name}</p>
        <p className="text-gray-500 text-xs mt-0.5">/{goal.slug}</p>
      </div>

      {/* Description */}
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">Description</p>
        <p className="text-gray-400 text-xs leading-relaxed line-clamp-1">{goal.description || '—'}</p>
      </div>

      {/* Sort order */}
      <div className="w-24 shrink-0 text-center">
        <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">Order</p>
        <p className="text-gray-300 text-sm font-medium">{goal.sort_order ?? 0}</p>
      </div>

      {/* Users count */}
      <div className="shrink-0">
        <span className="bg-gray-800 text-gray-300 text-xs font-medium px-3 py-1 rounded-lg">
          {goal.user_goals_count ?? goal.users_count ?? 0} users
        </span>
      </div>

      {/* Status badge */}
      <div className="shrink-0">
        <span className={`text-xs font-semibold px-3 py-1 rounded-lg ${
          goal.is_active ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'
        }`}>
          {goal.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => onToggle(goal)}
          disabled={toggling === goal.id}
          className={`text-xs px-4 py-2 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${
            goal.is_active
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {toggling === goal.id ? '...' : goal.is_active ? 'Deactivate' : 'Activate'}
        </button>
        <button
          onClick={() => onEdit(goal)}
          className="text-xs px-4 py-2 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white transition"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(goal)}
          className="text-xs px-4 py-2 rounded-lg font-medium bg-gray-700 hover:bg-red-600 text-white transition"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export default function Goals() {
  const [goals, setGoals]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [modal, setModal]           = useState(false);
  const [editing, setEditing]       = useState(null);
  const [form, setForm]             = useState(empty);
  const [saving, setSaving]         = useState(false);
  const [toggling, setToggling]     = useState(null);
  const [deleting, setDeleting]     = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);
  const [toast, setToast]           = useState(null);

  const showToast = (msg, error = false) => {
    setToast({ msg, error });
    setTimeout(() => setToast(null), 3500);
  };

  const load = () => {
    setLoading(true);
    return getGoals().then(r => {
      const data = r.data?.goals ?? (Array.isArray(r.data) ? r.data : (r.data?.data ?? []));
      setGoals(data);
      setLoading(false);
    }).catch(() => {
      showToast('Failed to load goals.', true);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm(empty); setModal(true); };
  const openEdit = (goal) => {
    setEditing(goal);
    setForm({
      name:        goal.name        ?? '',
      slug:        goal.slug        ?? '',
      description: goal.description ?? '',
      sort_order:  goal.sort_order  ?? 0,
    });
    setModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing) {
        const res = await updateGoal(editing.id, form);
        const updated = res.data?.goal ?? { ...editing, ...form };
        setGoals(prev => prev.map(g => g.id === editing.id ? { ...g, ...updated } : g));
      } else {
        const res = await storeGoal(form);
        const created = res.data?.goal;
        if (created) setGoals(prev => [...prev, created]);
        else await load();
      }
      setModal(false);
      showToast('Goal saved successfully!');
    } catch (err) {
      showToast(err?.response?.data?.message ?? 'Save failed. Please try again.', true);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (goal) => {
    setToggling(goal.id);
    try {
      const res = await toggleGoal(goal.id);
      const updated = res.data?.goal;
      setGoals(prev => prev.map(g =>
        g.id === goal.id
          ? { ...g, is_active: updated ? updated.is_active : (g.is_active ? 0 : 1) }
          : g
      ));
    } catch (err) {
      showToast(err?.response?.data?.message ?? 'Failed to update status.', true);
    } finally {
      setToggling(null);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteGoal(confirmDel.id);
      setGoals(prev => prev.filter(g => g.id !== confirmDel.id));
      showToast('Goal deleted.');
      setConfirmDel(null);
    } catch (err) {
      showToast(err?.response?.data?.message ?? 'Delete failed.', true);
    } finally {
      setDeleting(false);
    }
  };

  const f = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const filtered = goals.filter(g =>
    !search || g.name?.toLowerCase().includes(search.toLowerCase())
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
          <h1 className="text-2xl font-bold text-white">Goals</h1>
          <p className="text-gray-400 text-sm mt-1">
            {goals.length} total &nbsp;·&nbsp;
            {goals.filter(g => g.is_active).length} active &nbsp;·&nbsp;
            {goals.reduce((sum, g) => sum + (g.user_goals_count ?? g.users_count ?? 0), 0)} users assigned
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search goals…"
            className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-purple-500 outline-none text-sm transition w-56"
          />
          <button
            onClick={openAdd}
            className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap"
          >
            + Add Goal
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          {search ? 'No goals match your search.' : 'No goals found.'}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(goal => (
            <GoalRow
              key={goal.id}
              goal={goal}
              onEdit={openEdit}
              onToggle={handleToggle}
              onDelete={setConfirmDel}
              toggling={toggling}
            />
          ))}
        </div>
      )}

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Edit Goal' : 'Add Goal'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Goal Name"  value={form.name}      onChange={f('name')}      placeholder="e.g. Manage Diabetes" />
            <FormInput label="Slug"       value={form.slug}      onChange={f('slug')}      placeholder="e.g. diabetes" />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-gray-400">Description</label>
            <textarea
              value={form.description}
              onChange={f('description')}
              rows={3}
              placeholder="Brief description of this goal…"
              className="w-full bg-gray-800 text-white px-4 py-2.5 rounded-lg outline-none border border-gray-700 focus:border-purple-500 transition text-sm resize-none"
            />
          </div>
          <div className="w-28">
            <FormInput label="Sort Order" type="number" value={form.sort_order} onChange={f('sort_order')} />
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white py-2.5 rounded-lg transition text-sm font-medium"
          >
            {saving ? 'Saving…' : 'Save Goal'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmDel}
        onClose={() => setConfirmDel(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Goal"
        message={`Are you sure you want to delete "${confirmDel?.name}"? This cannot be undone.`}
      />
    </div>
  );
}
