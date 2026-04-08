import { useEffect, useState } from 'react';
import {
  getPrompts, storePrompt,
  updatePrompt, togglePrompt, deletePrompt, getPromptTypes
} from '../api/prompts';
import { getCoaches }   from '../api/coaches';
import { getLanguages } from '../api/languages';
import DataTable    from '../components/DataTable';
import Modal        from '../components/Modal';
import Badge        from '../components/Badge';
import PageHeader   from '../components/PageHeader';
import ToggleSwitch from '../components/ToggleSwitch';

const empty = {
  coach_id: '', language_id: '', template_type: '',
  title: '', content: '', variables: ''
};

export default function Prompts() {
  const [prompts,   setPrompts]   = useState([]);
  const [coaches,   setCoaches]   = useState([]);
  const [languages, setLanguages] = useState([]);
  const [types,     setTypes]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(false);
  const [editing,   setEditing]   = useState(null);
  const [form,      setForm]      = useState(empty);
  const [saving,    setSaving]    = useState(false);
  const [filter,    setFilter]    = useState({});
  const [error,     setError]     = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    Promise.all([
      getPrompts(filter),
      getCoaches(),
      getLanguages(),
      getPromptTypes().catch(() => ({ data: [] })),
    ]).then(([p, c, l, t]) => {
      setPrompts(Array.isArray(p.data) ? p.data : (p.data?.data ?? []));
      setCoaches(Array.isArray(c.data) ? c.data : (c.data?.data ?? []));
      setLanguages(Array.isArray(l.data) ? l.data : (l.data?.data ?? []));
      setTypes(Array.isArray(t.data) ? t.data : []);
    }).catch(err => {
      setError(err?.response?.data?.message ?? 'Failed to load prompts. Please try again.');
    }).finally(() => {
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, [filter]);

  const openAdd = () => { setEditing(null); setForm(empty); setModal(true); };
  const openEdit = (p) => { setEditing(p); setForm(p); setModal(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      editing
        ? await updatePrompt(editing.id, form)
        : await storePrompt(form);
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
        title="Prompt Templates"
        subtitle="Manage Rakhi AI prompts per coach and language"
        action={
          <button
            onClick={openAdd}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm transition"
          >
            + Add Prompt
          </button>
        }
      />

      {error && (
        <div className="mb-6 px-4 py-3 bg-red-900/40 border border-red-700 rounded-lg text-red-400 text-sm flex justify-between items-center">
          <span>⚠️ {error}</span>
          <button onClick={load} className="text-red-300 hover:text-white underline text-xs">Retry</button>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <select
          onChange={(e) => setFilter({ ...filter, coach_id: e.target.value })}
          className="bg-gray-800 text-gray-300 px-3 py-2 rounded-lg text-sm border border-gray-700"
        >
          <option value="">All Coaches</option>
          {coaches.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          onChange={(e) => setFilter({ ...filter, template_type: e.target.value })}
          className="bg-gray-800 text-gray-300 px-3 py-2 rounded-lg text-sm border border-gray-700"
        >
          <option value="">All Types</option>
          {types.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <DataTable
        loading={loading}
        columns={[
          { key: 'title',         label: 'Title' },
          { key: 'coach',         label: 'Coach',
            render: (r) => r.coach?.name ?? '—' },
          { key: 'language',      label: 'Language',
            render: (r) => r.language?.name ?? '—' },
          { key: 'template_type', label: 'Type' },
          { key: 'version',       label: 'Version',
            render: (r) => `v${r.version}` },
          { key: 'is_active',     label: 'Status',
            render: (r) => <Badge active={r.is_active} /> },
          { key: 'actions',       label: 'Actions',
            render: (r) => (
              <div className="flex gap-2 items-center">
                <ToggleSwitch
                  enabled={!!r.is_active}
                  onToggle={async () => { await togglePrompt(r.id); load(); }}
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
        data={prompts}
      />

      <Modal
        isOpen={modal}
        onClose={() => setModal(false)}
        title={editing ? 'Edit Prompt' : 'Add Prompt'}
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="space-y-1">
            <label className="text-sm text-gray-400">Coach</label>
            <select
              value={form.coach_id}
              onChange={f('coach_id')}
              className="w-full bg-gray-800 text-white px-4 py-2.5 rounded-lg border border-gray-700 text-sm"
            >
              <option value="">Select Coach</option>
              {coaches.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm text-gray-400">Language</label>
            <select
              value={form.language_id}
              onChange={f('language_id')}
              className="w-full bg-gray-800 text-white px-4 py-2.5 rounded-lg border border-gray-700 text-sm"
            >
              <option value="">Select Language</option>
              {languages.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm text-gray-400">Template Type</label>
            <select
              value={form.template_type}
              onChange={f('template_type')}
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
            <label className="text-sm text-gray-400">
              Prompt Content
              <span className="text-purple-400 ml-2 font-normal">
                Use: {`{{user_name}}`} {`{{goals}}`} {`{{rules}}`}
              </span>
            </label>
            <textarea
              value={form.content}
              onChange={f('content')}
              rows={8}
              className="w-full bg-gray-800 text-white px-4 py-2.5 rounded-lg border border-gray-700 text-sm font-mono"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-lg transition text-sm"
          >
            {saving ? 'Saving...' : 'Save Prompt'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
