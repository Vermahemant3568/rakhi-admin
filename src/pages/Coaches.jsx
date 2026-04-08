import { useEffect, useState } from 'react';
import {
  getCoaches, storeCoach,
  updateCoach, toggleCoach, deleteCoach
} from '../api/coaches';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import FormInput from '../components/FormInput';
import PageHeader from '../components/PageHeader';
import ToggleSwitch from '../components/ToggleSwitch';

const empty = {
  name: '', slug: '', description: '',
  speciality: '', is_launch_coach: 0, sort_order: 0
};

export default function Coaches() {
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm]       = useState(empty);
  const [saving, setSaving]   = useState(false);
  const [toast, setToast]     = useState('');

  const load = () => {
    setLoading(true);
    return getCoaches().then(r => {
      const data = Array.isArray(r.data) ? r.data : (r.data?.data ?? []);
      setCoaches([...data]);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(empty);
    setModal(true);
  };

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
        await updateCoach(editing.id, form);
        setCoaches(prev => prev.map(c =>
          c.id === editing.id ? { ...c, ...form } : c
        ));
      } else {
        await storeCoach(form);
        await load();
      }
      setModal(false);
      setToast('Coach saved successfully!');
      setTimeout(() => setToast(''), 3000);
    } catch (err) {
      setToast(err?.response?.data?.message ?? 'Save failed. Please try again.');
      setTimeout(() => setToast(''), 4000);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (coach) => {
    await toggleCoach(coach.id);
    load();
  };

  const f = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  return (
    <div className="p-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-sm font-medium shadow-lg transition
          ${ toast.includes('failed') || toast.includes('error')
            ? 'bg-red-600 text-white'
            : 'bg-green-600 text-white'
          }`}>
          {toast}
        </div>
      )}
      <PageHeader
        title="Coaches"
        subtitle="Manage all Rakhi AI coaches"
        action={
          <button
            onClick={openAdd}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm transition"
          >
            + Add Coach
          </button>
        }
      />

      <DataTable
        loading={loading}
        columns={[
          { key: 'id',             label: 'ID' },
          { key: 'name',           label: 'Coach Name' },
          { key: 'slug',           label: 'Slug' },
          { key: 'speciality',     label: 'Speciality' },
          { key: 'is_launch_coach', label: 'Launch',
            render: (r) => (r.is_launch_coach === true || r.is_launch_coach === 1) ? '✅' : '—' },
          { key: 'is_active',      label: 'Status',
            render: (r) => <Badge active={r.is_active} /> },
          { key: 'actions',        label: 'Actions',
            render: (r) => (
              <div className="flex gap-2 items-center">
                <ToggleSwitch enabled={!!r.is_active} onToggle={() => handleToggle(r)} />
                <button
                  onClick={() => openEdit(r)}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  Edit
                </button>
              </div>
            )
          },
        ]}
        data={coaches}
      />

      <Modal
        isOpen={modal}
        onClose={() => setModal(false)}
        title={editing ? 'Edit Coach' : 'Add Coach'}
      >
        <div className="space-y-4">
          <FormInput label="Coach Name"  value={form.name}        onChange={f('name')}        placeholder="e.g. Diabetes Coach" />
          <FormInput label="Slug"        value={form.slug}        onChange={f('slug')}        placeholder="e.g. diabetes" />
          <FormInput label="Speciality"  value={form.speciality}  onChange={f('speciality')}  placeholder="e.g. Blood sugar, diet alignment" />
          <div className="space-y-1">
            <label className="text-sm text-gray-400">Description</label>
            <textarea
              value={form.description}
              onChange={f('description')}
              rows={3}
              className="w-full bg-gray-800 text-white px-4 py-2.5 rounded-lg outline-none border border-gray-700 focus:border-purple-500 transition text-sm"
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={form.is_launch_coach == 1 || form.is_launch_coach === true}
              onChange={(e) => setForm({ ...form, is_launch_coach: e.target.checked ? 1 : 0 })}
              className="w-4 h-4 accent-purple-500"
            />
            <label className="text-sm text-gray-400">Show at launch</label>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-lg transition text-sm"
          >
            {saving ? 'Saving...' : 'Save Coach'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
