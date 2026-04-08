import { useEffect, useState } from 'react';
import {
  getKnowledge, storeKnowledge, updateKnowledge,
  syncKnowledge, toggleKnowledge, deleteKnowledge
} from '../api/knowledge';
import { getCoaches } from '../api/coaches';
import DataTable  from '../components/DataTable';
import Modal      from '../components/Modal';
import Badge      from '../components/Badge';
import PageHeader from '../components/PageHeader';

const empty = { coach_id: '', title: '', content: '' };

export default function KnowledgeBase() {
  const [items,    setItems]   = useState([]);
  const [coaches,  setCoaches] = useState([]);
  const [loading,  setLoading] = useState(true);
  const [modal,    setModal]   = useState(false);
  const [form,     setForm]    = useState(empty);
  const [editId,   setEditId]  = useState(null);
  const [saving,   setSaving]  = useState(false);
  const [syncing,  setSyncing] = useState(null);
  const [toggling, setToggling] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [preview,  setPreview] = useState(null);

  const load = () => {
    setLoading(true);
    getCoaches()
      .then(c => setCoaches(Array.isArray(c.data) ? c.data : (c.data?.data ?? [])))
      .catch(() => {});
    getKnowledge()
      .then(k => { const d = k.data; setItems(Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditId(null); setForm(empty); setModal(true); };
  const openEdit = (r) => {
    setEditId(r.id);
    setForm({ coach_id: r.coach?.id ?? r.coach_id ?? '', title: r.title, content: r.content });
    setModal(true);
  };
  const closeModal = () => { setModal(false); setForm(empty); setEditId(null); };

  const handleSave = async () => {
    setSaving(true);
    try {
      editId ? await updateKnowledge(editId, form) : await storeKnowledge(form);
      closeModal();
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async (id) => {
    setSyncing(id);
    try { await syncKnowledge(id); load(); } finally { setSyncing(null); }
  };

  const handleToggle = async (id) => {
    setToggling(id);
    try { await toggleKnowledge(id); load(); } finally { setToggling(null); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this knowledge entry? This cannot be undone.')) return;
    setDeleting(id);
    try { await deleteKnowledge(id); load(); } finally { setDeleting(null); }
  };

  const f = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  return (
    <div className="p-6">
      <PageHeader
        title="Knowledge Base"
        subtitle="Manage coach knowledge — synced to Pinecone vector DB"
        action={
          <button
            onClick={openAdd}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm transition"
          >
            + Add Knowledge
          </button>
        }
      />

      {/* Stats bar */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-white">{items.length}</p>
          <p className="text-xs text-gray-400 mt-1">Total Entries</p>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{items.filter(i => i.is_synced).length}</p>
          <p className="text-xs text-gray-400 mt-1">Synced to Pinecone</p>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-yellow-400">{items.filter(i => !i.is_synced).length}</p>
          <p className="text-xs text-gray-400 mt-1">Pending Sync</p>
        </div>
      </div>

      <DataTable
        loading={loading}
        columns={[
          { key: 'title', label: 'Title',
            render: (r) => (
              <div>
                <p className="text-white font-medium">{r.title}</p>
                <p className="text-gray-500 text-xs mt-0.5 truncate max-w-xs">
                  {r.content?.slice(0, 80)}{r.content?.length > 80 ? '…' : ''}
                </p>
              </div>
            )
          },
          { key: 'coach', label: 'Coach',
            render: (r) => (
              <span className="bg-purple-900/40 text-purple-300 text-xs px-2 py-1 rounded-full">
                {r.coach?.name ?? '—'}
              </span>
            )
          },
          { key: 'is_synced', label: 'Pinecone',
            render: (r) => r.is_synced
              ? <span className="text-green-400 text-xs font-medium">✅ Synced</span>
              : <span className="text-yellow-400 text-xs font-medium">⏳ Pending</span>
          },
          { key: 'is_active', label: 'Status',
            render: (r) => <Badge active={r.is_active} />
          },
          { key: 'actions', label: 'Actions',
            render: (r) => (
              <div className="flex gap-2 items-center flex-wrap">
                <button
                  onClick={() => setPreview(r)}
                  className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded transition"
                >
                  👁 View
                </button>
                <button
                  onClick={() => openEdit(r)}
                  className="text-xs bg-yellow-600 hover:bg-yellow-500 text-white px-2 py-1 rounded transition"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => handleSync(r.id)}
                  disabled={syncing === r.id}
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded transition disabled:opacity-50"
                >
                  {syncing === r.id ? 'Syncing…' : '🔄 Sync'}
                </button>
                <button
                  onClick={() => handleToggle(r.id)}
                  disabled={toggling === r.id}
                  className={`text-xs px-2 py-1 rounded transition disabled:opacity-50 ${
                    r.is_active
                      ? 'bg-gray-600 hover:bg-gray-500 text-white'
                      : 'bg-green-700 hover:bg-green-600 text-white'
                  }`}
                >
                  {toggling === r.id ? '…' : r.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => handleDelete(r.id)}
                  disabled={deleting === r.id}
                  className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
                >
                  {deleting === r.id ? 'Deleting…' : '🗑 Delete'}
                </button>
              </div>
            )
          },
        ]}
        data={items}
      />

      {/* Add / Edit Modal */}
      <Modal isOpen={modal} onClose={closeModal} title={editId ? 'Edit Knowledge' : 'Add Knowledge'}>
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm text-gray-400">Coach</label>
            <select
              value={form.coach_id}
              onChange={f('coach_id')}
              className="w-full bg-gray-800 text-white px-4 py-2.5 rounded-lg border border-gray-700 text-sm"
            >
              <option value="">Select Coach</option>
              {coaches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm text-gray-400">Title</label>
            <input
              value={form.title}
              onChange={f('title')}
              placeholder="e.g. Hydration Guidelines"
              className="w-full bg-gray-800 text-white px-4 py-2.5 rounded-lg border border-gray-700 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-gray-400">Content</label>
            <textarea
              value={form.content}
              onChange={f('content')}
              rows={6}
              placeholder="Add health knowledge, guidelines, tips…"
              className="w-full bg-gray-800 text-white px-4 py-2.5 rounded-lg border border-gray-700 text-sm"
            />
            <p className="text-xs text-gray-600 text-right">{form.content.length} chars</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || !form.coach_id || !form.title || !form.content}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white py-2.5 rounded-lg transition text-sm"
          >
            {saving ? 'Saving…' : editId ? 'Update & Sync to Pinecone' : 'Save & Sync to Pinecone'}
          </button>
        </div>
      </Modal>

      {/* Preview Modal */}
      <Modal isOpen={!!preview} onClose={() => setPreview(null)} title={preview?.title ?? ''}>
        <div className="space-y-3">
          <div className="flex gap-3 items-center">
            <span className="bg-purple-900/40 text-purple-300 text-xs px-2 py-1 rounded-full">
              {preview?.coach?.name ?? '—'}
            </span>
            <Badge active={preview?.is_active} />
            {preview?.is_synced
              ? <span className="text-green-400 text-xs">✅ Synced</span>
              : <span className="text-yellow-400 text-xs">⏳ Pending</span>}
          </div>
          <p className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">{preview?.content}</p>
        </div>
      </Modal>
    </div>
  );
}
