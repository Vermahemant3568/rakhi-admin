import { useEffect, useState } from 'react';
import {
  getGoals, storeGoal,
  updateGoal, toggleGoal
} from '../api/goals';
import DataTable    from '../components/DataTable';
import Modal        from '../components/Modal';
import Badge        from '../components/Badge';
import PageHeader   from '../components/PageHeader';
import ToggleSwitch from '../components/ToggleSwitch';
import FormInput    from '../components/FormInput';

const empty = { name: '', slug: '', description: '', sort_order: 0 };

export default function Goals() {
  const [goals,   setGoals]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [editing, setEditing] = useState(null);
  const [form,    setForm]    = useState(empty);
  const [saving,  setSaving]  = useState(false);

  const load = () => {
    setLoading(true);
    getGoals().then(r => { setGoals(r.data); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const openAdd  = () => { setEditing(null); setForm(empty); setModal(true); };
  const openEdit = (g) => { setEditing(g);   setForm(g);    setModal(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      editing
        ? await updateGoal(editing.id, form)
        : await storeGoal(form);
      setModal(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  const f = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  return (
    <div className="p-6">
      <PageHeader
        title="Goals"
        subtitle="Manage user health goals"
        action={
          <button
            onClick={openAdd}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm transition"
          >
            + Add Goal
          </button>
        }
      />
      <DataTable
        loading={loading}
        columns={[
          { key: 'name',       label: 'Goal Name' },
          { key: 'slug',       label: 'Slug' },
          { key: 'sort_order', label: 'Display Order' },
          { key: 'is_active',  label: 'Status',
            render: (r) => <Badge active={r.is_active} /> },
          { key: 'actions',    label: 'Actions',
            render: (r) => (
              <div className="flex gap-2 items-center">
                <ToggleSwitch
                  enabled={!!r.is_active}
                  onToggle={async () => { await toggleGoal(r.id); load(); }}
                />
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
        data={goals}
      />
      <Modal
        isOpen={modal}
        onClose={() => setModal(false)}
        title={editing ? 'Edit Goal' : 'Add Goal'}
      >
        <div className="space-y-4">
          <FormInput label="Goal Name"  value={form.name}       onChange={f('name')}       placeholder="e.g. Manage Diabetes" />
          <FormInput label="Slug"       value={form.slug}       onChange={f('slug')}       placeholder="e.g. diabetes" />
          <FormInput label="Sort Order" value={form.sort_order} onChange={f('sort_order')} type="number" />
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-lg transition text-sm"
          >
            {saving ? 'Saving...' : 'Save Goal'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
