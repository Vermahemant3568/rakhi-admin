import { useEffect, useState } from 'react';
import { getLanguages, storeLanguage,
         updateLanguage, toggleLanguage, deleteLanguage } from '../api/languages';
import ConfirmDialog from '../components/ConfirmDialog';
import DataTable    from '../components/DataTable';
import Modal        from '../components/Modal';
import Badge        from '../components/Badge';
import PageHeader   from '../components/PageHeader';
import FormInput    from '../components/FormInput';
import ToggleSwitch from '../components/ToggleSwitch';

const empty = {
  name: '', code: '', native_name: '',
  tts_code: '', stt_code: '', sort_order: 0
};

export default function Languages() {
  const [langs,   setLangs]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [editing, setEditing] = useState(null);
  const [form,    setForm]    = useState(empty);
  const [saving,   setSaving]   = useState(false);
  const [deleting,  setDeleting]  = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const load = () => {
    setLoading(true);
    getLanguages().then(r => { setLangs(r.data); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const openAdd  = () => { setEditing(null); setForm(empty); setModal(true); };
  const openEdit = (l) => { setEditing(l);   setForm(l);    setModal(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      editing
        ? await updateLanguage(editing.id, form)
        : await storeLanguage(form);
      setModal(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteLanguage(confirmOpen.id);
      setConfirmOpen(false);
      load();
    } finally {
      setDeleting(false);
    }
  };

  const f = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  return (
    <div className="p-6">
      <PageHeader
        title="Languages"
        subtitle="Manage supported languages for Rakhi"
        action={
          <button onClick={openAdd}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm transition">
            + Add Language
          </button>
        }
      />
      <DataTable
        loading={loading}
        columns={[
          { key: 'name',        label: 'Language' },
          { key: 'native_name', label: 'Native' },
          { key: 'code',        label: 'Code' },
          { key: 'tts_code',    label: 'TTS Code' },
          { key: 'stt_code',    label: 'STT Code' },
          { key: 'is_active',   label: 'Status',
            render: (r) => <Badge active={r.is_active} /> },
          { key: 'actions',     label: 'Actions',
            render: (r) => (
              <div className="flex gap-2 items-center">
                <ToggleSwitch
                  enabled={!!r.is_active}
                  onToggle={async () => { await toggleLanguage(r.id); load(); }}
                />
                <button onClick={() => openEdit(r)}
                  className="text-xs text-blue-400 hover:text-blue-300">
                  Edit
                </button>
                <button onClick={() => setConfirmOpen(r)}
                  className="text-xs text-red-400 hover:text-red-300">
                  Delete
                </button>
              </div>
            )
          },
        ]}
        data={langs}
      />
      <Modal isOpen={modal} onClose={() => setModal(false)}
        title={editing ? 'Edit Language' : 'Add Language'}>
        <div className="space-y-4">
          <FormInput label="Language Name" value={form.name}        onChange={f('name')}        placeholder="e.g. Hindi" />
          <FormInput label="Code"          value={form.code}        onChange={f('code')}        placeholder="e.g. hi" />
          <FormInput label="Native Name"   value={form.native_name} onChange={f('native_name')} placeholder="e.g. हिन्दी" />
          <FormInput label="TTS Code"      value={form.tts_code}    onChange={f('tts_code')}    placeholder="e.g. hi-IN" />
          <FormInput label="STT Code"      value={form.stt_code}    onChange={f('stt_code')}    placeholder="e.g. hi-IN" />
          <button onClick={handleSave} disabled={saving}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-lg transition text-sm">
            {saving ? 'Saving...' : 'Save Language'}
          </button>
        </div>
      </Modal>
      <ConfirmDialog
        isOpen={!!confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        loading={!!deleting}
        title="Delete Language"
        message={`Are you sure you want to delete "${confirmOpen?.name}"? This cannot be undone.`}
      />
    </div>
  );
}
