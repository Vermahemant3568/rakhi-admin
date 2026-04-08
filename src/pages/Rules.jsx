import { useEffect, useState } from 'react';
import {
  getRules, storeRule,
  updateRule, toggleRule, deleteRule, getRuleTypes
} from '../api/rules';
import DataTable    from '../components/DataTable';
import Modal        from '../components/Modal';
import Badge        from '../components/Badge';
import PageHeader   from '../components/PageHeader';
import ToggleSwitch from '../components/ToggleSwitch';

const empty = {
  rule_type: '', title: '',
  rule_content: '', priority: 0
};

const TYPE_COLORS = {
  safety:     'bg-red-900/30 text-red-400',
  escalation: 'bg-orange-900/30 text-orange-400',
  boundary:   'bg-yellow-900/30 text-yellow-400',
  behaviour:  'bg-blue-900/30 text-blue-400',
  nlp:        'bg-purple-900/30 text-purple-400',
};

export default function Rules() {
  const [rules,   setRules]   = useState([]);
  const [types,   setTypes]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [editing, setEditing] = useState(null);
  const [form,    setForm]    = useState(empty);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    Promise.all([
      getRules(),
      getRuleTypes().catch(() => ({ data: [] })),
    ]).then(([r, t]) => {
      setRules(Array.isArray(r.data) ? r.data : (r.data?.data ?? []));
      setTypes(Array.isArray(t.data) ? t.data : []);
    }).catch(err => {
      setError(err?.response?.data?.message ?? 'Failed to load rules.');
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAdd  = () => { setEditing(null); setForm(empty); setModal(true); };
  const openEdit = (r) => { setEditing(r);   setForm(r);    setModal(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      editing
        ? await updateRule(editing.id, form)
        : await storeRule(form);
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
        title="Rakhi Rules"
        subtitle="Define safety, boundary and behaviour rules for Rakhi"
        action={
          <button
            onClick={openAdd}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm transition"
          >
            + Add Rule
          </button>
        }
      />

      {error && (
        <div className="mb-6 px-4 py-3 bg-red-900/40 border border-red-700 rounded-lg text-red-400 text-sm flex justify-between items-center">
          <span>⚠️ {error}</span>
          <button onClick={load} className="text-red-300 hover:text-white underline text-xs">Retry</button>
        </div>
      )}

      <DataTable
        loading={loading}
        columns={[
          { key: 'title',     label: 'Rule Title' },
          { key: 'rule_type', label: 'Type',
            render: (r) => (
              <span className={`px-2 py-1 rounded-full text-xs ${TYPE_COLORS[r.rule_type] ?? 'bg-gray-800 text-gray-400'}`}>
                {r.rule_type}
              </span>
            )
          },
          { key: 'priority',  label: 'Priority' },
          { key: 'is_active', label: 'Status',
            render: (r) => <Badge active={r.is_active} /> },
          { key: 'actions',   label: 'Actions',
            render: (r) => (
              <div className="flex gap-2 items-center">
                <ToggleSwitch
                  enabled={!!r.is_active}
                  onToggle={async () => { await toggleRule(r.id); load(); }}
                />
                <button onClick={() => openEdit(r)} className="text-xs text-blue-400 hover:text-blue-300">Edit</button>
                <button onClick={async () => { await deleteRule(r.id); load(); }} className="text-xs text-red-400 hover:text-red-300">Delete</button>
              </div>
            )
          },
        ]}
        data={rules}
      />

      <Modal
        isOpen={modal}
        onClose={() => setModal(false)}
        title={editing ? 'Edit Rule' : 'Add Rule'}
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm text-gray-400">Rule Type</label>
            <select
              value={form.rule_type}
              onChange={f('rule_type')}
              className="w-full bg-gray-800 text-white px-4 py-2.5 rounded-lg border border-gray-700 text-sm"
            >
              <option value="">Select Type</option>
              {types.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm text-gray-400">Title</label>
            <input
              value={form.title}
              onChange={f('title')}
              className="w-full bg-gray-800 text-white px-4 py-2.5 rounded-lg border border-gray-700 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-gray-400">Rule Content</label>
            <textarea
              value={form.rule_content}
              onChange={f('rule_content')}
              rows={4}
              className="w-full bg-gray-800 text-white px-4 py-2.5 rounded-lg border border-gray-700 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-gray-400">Priority (higher = runs first)</label>
            <input
              type="number"
              value={form.priority}
              onChange={f('priority')}
              className="w-full bg-gray-800 text-white px-4 py-2.5 rounded-lg border border-gray-700 text-sm"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-lg transition text-sm"
          >
            {saving ? 'Saving...' : 'Save Rule'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
