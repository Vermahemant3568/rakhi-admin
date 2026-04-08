import { useEffect, useState } from 'react';
import { getLLMs, activateLLM, storeLLM, updateLLM } from '../api/apiManager';
import Modal      from '../components/Modal';
import PageHeader from '../components/PageHeader';
import FormInput  from '../components/FormInput';

const empty = {
  provider: 'gemini', api_key: '',
  model_name: '', max_tokens: 1000,
  temperature: 0.7, top_p: 0.95
};

const PROVIDER_INFO = {
  gemini:  { icon: '🔮', label: 'Gemini' },
  chatgpt: { icon: '🤖', label: 'ChatGPT' },
};

export default function LLMConfig() {
  const [llms,    setLlms]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [editing, setEditing] = useState(null);
  const [form,    setForm]    = useState(empty);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [toast,   setToast]   = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    getLLMs()
      .then(r => setLlms(Array.isArray(r.data) ? r.data : (r.data?.data ?? [])))
      .catch(err => setError(err?.response?.data?.message ?? 'Failed to load LLM configs.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(empty);
    setModal(true);
  };

  const openEdit = (llm) => {
    setEditing(llm);
    setForm({
      provider:    llm.provider    ?? 'gemini',
      api_key:     llm.api_key     ?? '',
      model_name:  llm.model_name  ?? '',
      max_tokens:  llm.max_tokens  ?? 1000,
      temperature: llm.temperature ?? 0.7,
      top_p:       llm.top_p       ?? 0.95,
    });
    setModal(true);
  };

  const handleActivate = async (id, e) => {
    e.stopPropagation();
    await activateLLM(id);
    load();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form };
      if (editing && !payload.api_key?.trim()) delete payload.api_key;
      editing
        ? await updateLLM(editing.id, payload)
        : await storeLLM(payload);
      setModal(false);
      setToast('LLM config saved successfully!');
      setTimeout(() => setToast(''), 3000);
      load();
    } catch (err) {
      setToast(err?.response?.data?.message ?? 'Save failed.');
      setTimeout(() => setToast(''), 4000);
    } finally {
      setSaving(false);
    }
  };

  const f = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="p-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-sm font-medium shadow-lg
          ${toast.includes('failed') ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
          {toast}
        </div>
      )}

      <PageHeader
        title="LLM Configuration"
        subtitle="Manage and switch between AI providers"
        action={
          <button onClick={openAdd}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm transition">
            + Add LLM
          </button>
        }
      />

      {error && (
        <div className="mb-6 px-4 py-3 bg-red-900/40 border border-red-700 rounded-lg text-red-400 text-sm flex justify-between items-center">
          <span>⚠️ {error}</span>
          <button onClick={load} className="text-red-300 hover:text-white underline text-xs">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {llms.length === 0 && (
            <div className="col-span-2 text-center py-16 text-gray-500">
              <p className="text-4xl mb-3">🤖</p>
              <p className="text-sm">No LLM configs yet. Click <span className="text-purple-400">+ Add LLM</span> to get started.</p>
            </div>
          )}
          {llms.map(llm => {
            const info = PROVIDER_INFO[llm.provider] ?? { icon: '💡', label: llm.provider };
            const hasApiKey = llm.has_api_key === true;
            return (
              <div key={llm.id} className={`rounded-2xl p-6 border-2 transition-all duration-200
                ${llm.is_active ? 'border-purple-500 bg-purple-900/20' : 'border-gray-700 bg-gray-900'}`}>

                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{info.icon}</span>
                    <div>
                      <h3 className="text-white font-bold text-lg">{info.label}</h3>
                      <p className="text-gray-400 text-sm">{llm.model_name}</p>
                    </div>
                  </div>
                  {llm.is_active
                    ? <span className="bg-purple-600 text-white text-xs px-3 py-1 rounded-full">✅ Active</span>
                    : <span className="bg-gray-700 text-gray-400 text-xs px-3 py-1 rounded-full">Inactive</span>
                  }
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 text-xs mb-4">
                  {[
                    ['Max Tokens',  llm.max_tokens],
                    ['Temperature', llm.temperature],
                    ['Top P',       llm.top_p],
                  ].map(([label, val]) => (
                    <div key={label} className="bg-gray-800 rounded-lg p-2 text-center">
                      <p className="text-gray-500">{label}</p>
                      <p className="text-white font-medium">{val}</p>
                    </div>
                  ))}
                </div>

                {/* API Key + Date */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    hasApiKey ? 'bg-blue-900/40 text-blue-400' : 'bg-yellow-900/40 text-yellow-400'
                  }`}>
                    {hasApiKey ? '🔑 API Key Set' : '⚠️ Needs API Key'}
                  </span>
                  <span className="text-gray-600 text-xs">
                    Added: {new Date(llm.created_at).toLocaleDateString()}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={(e) => handleActivate(llm.id, e)}
                    disabled={llm.is_active}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition
                      ${llm.is_active
                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                        : 'bg-purple-600 hover:bg-purple-700 text-white cursor-pointer'
                      }`}
                  >
                    {llm.is_active ? '✅ Currently Active' : 'Set as Active'}
                  </button>
                  <button
                    onClick={() => openEdit(llm)}
                    className="px-4 py-2 rounded-lg text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 transition"
                  >
                    ✏️ Edit
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={modal}
        onClose={() => setModal(false)}
        title={editing ? `Edit ${PROVIDER_INFO[editing?.provider]?.label ?? editing?.provider}` : 'Add LLM Config'}
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm text-gray-400">Provider</label>
            <select value={form.provider} onChange={f('provider')}
              className="w-full bg-gray-800 text-white px-4 py-2.5 rounded-lg border border-gray-700 text-sm">
              <option value="gemini">🔮 Gemini</option>
              <option value="chatgpt">🤖 ChatGPT</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm text-gray-400">API Key</label>
            <input
              type="text"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              value={form.api_key}
              onChange={f('api_key')}
              placeholder={editing ? '(leave blank to keep existing)' : form.provider === 'gemini' ? 'AIza...' : 'sk-...'}
              className="w-full bg-gray-800 text-white px-4 py-2.5 rounded-lg outline-none border border-gray-700 focus:border-purple-500 transition text-sm font-mono"
            />
          </div>
          {editing && (
            <p className="text-xs text-gray-500 bg-gray-800 px-3 py-2 rounded-lg">
              🔒 Leave API Key blank to keep the existing key unchanged.
            </p>
          )}
          <FormInput label="Model Name" value={form.model_name} onChange={f('model_name')}
            placeholder={form.provider === 'gemini' ? 'gemini-1.5-flash' : 'gpt-4o'} />
          <div className="grid grid-cols-3 gap-3">
            <FormInput label="Max Tokens"  type="number" value={form.max_tokens}  onChange={f('max_tokens')} />
            <FormInput label="Temperature" type="number" value={form.temperature} onChange={f('temperature')} />
            <FormInput label="Top P"       type="number" value={form.top_p}       onChange={f('top_p')} />
          </div>
          <button onClick={handleSave} disabled={saving}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-lg transition text-sm">
            {saving ? 'Saving...' : editing ? 'Update LLM Config' : 'Save LLM Config'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
