import { useEffect, useState } from 'react';
import { getPlans, storePlan,
         updatePlan, togglePlan } from '../api/plans';
import DataTable    from '../components/DataTable';
import Modal        from '../components/Modal';
import Badge        from '../components/Badge';
import PageHeader   from '../components/PageHeader';
import FormInput    from '../components/FormInput';
import ToggleSwitch from '../components/ToggleSwitch';

const empty = {
  name: '', duration_days: 30,
  price: '', trial_days: 7, sort_order: 0
};

export default function Plans() {
  const [plans,   setPlans]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [editing, setEditing] = useState(null);
  const [form,    setForm]    = useState(empty);
  const [saving,  setSaving]  = useState(false);

  const load = () => {
    setLoading(true);
    getPlans().then(r => { setPlans(r.data); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const openAdd  = () => { setEditing(null); setForm(empty); setModal(true); };
  const openEdit = (p) => { setEditing(p);   setForm(p);    setModal(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      editing
        ? await updatePlan(editing.id, form)
        : await storePlan(form);
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
        title="Subscription Plans"
        subtitle="Manage pricing and trial settings"
        action={
          <button onClick={openAdd}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm transition">
            + Add Plan
          </button>
        }
      />
      <DataTable
        loading={loading}
        columns={[
          { key: 'name',          label: 'Plan Name' },
          { key: 'price',         label: 'Price',
            render: (r) => `₹${r.price}` },
          { key: 'duration_days', label: 'Duration',
            render: (r) => `${r.duration_days} days` },
          { key: 'trial_days',    label: 'Trial',
            render: (r) => `${r.trial_days} days` },
          { key: 'is_active',     label: 'Status',
            render: (r) => <Badge active={r.is_active} /> },
          { key: 'actions',       label: 'Actions',
            render: (r) => (
              <div className="flex gap-2 items-center">
                <ToggleSwitch
                  enabled={!!r.is_active}
                  onToggle={async () => { await togglePlan(r.id); load(); }}
                />
                <button onClick={() => openEdit(r)}
                  className="text-xs text-blue-400 hover:text-blue-300">
                  Edit
                </button>
              </div>
            )
          },
        ]}
        data={plans}
      />
      <Modal isOpen={modal} onClose={() => setModal(false)}
        title={editing ? 'Edit Plan' : 'Add Plan'}>
        <div className="space-y-4">
          <FormInput label="Plan Name"       value={form.name}          onChange={f('name')}          placeholder="e.g. Monthly Premium" />
          <FormInput label="Price (₹)"       value={form.price}         onChange={f('price')}         type="number" placeholder="e.g. 499" />
          <FormInput label="Duration (days)" value={form.duration_days} onChange={f('duration_days')} type="number" />
          <FormInput label="Trial Days"      value={form.trial_days}    onChange={f('trial_days')}    type="number" />
          <FormInput label="Sort Order"      value={form.sort_order}    onChange={f('sort_order')}    type="number" />
          <button onClick={handleSave} disabled={saving}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-lg transition text-sm">
            {saving ? 'Saving...' : 'Save Plan'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
