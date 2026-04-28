import { useEffect, useState } from 'react';
import api from '../api/axios';
import ToggleSwitch from '../components/ToggleSwitch';
import PageHeader from '../components/PageHeader';

const SERVICE_ICONS = {
  otp_mode:       '⚙️',
  twilio:         '📱',
  msg91:          '💬',
  fast2sms:       '📲',
  firebase:       '🔥',
  sendgrid:       '📧',
  razorpay:       '💳',
  stripe:         '💳',
  pinecone:       '🌲',
  openai:         '🤖',
  gemini:         '🔮',
  aws:            '☁️',
  google_stt:     '🎙️',
  google_tts:     '🔊',
  elevenlabs_tts: '🎵',
  voice_provider: '🔊',
  groq_stt:       '⚡',
  stt_provider:   '🎙️',
  pusher:         '📡',
};

// Defines which config keys are known per service (used as fallback when backend doesn't send field_labels)
const SERVICE_FIELDS = {
  fast2sms:       ['api_key'],
  msg91:          ['api_key', 'template_id'],
  google_stt:     ['api_key'],
  google_tts:     ['api_key'],
  elevenlabs_tts: ['api_key'],
  voice_provider: ['provider'],
  groq_stt:       ['api_key', 'model_name'],
  stt_provider:   ['provider'],
  openai:         ['api_key'],
  gemini:         ['api_key'],
  sendgrid:       ['api_key'],
  stripe:         ['api_key', 'webhook_secret'],
  aws:            ['access_key', 'secret_key', 'region'],
  twilio:         ['account_sid', 'auth_token', 'from_number'],
  pinecone:       ['api_key', 'host', 'index'],
  razorpay:       ['key_id', 'key_secret'],
  firebase:       ['server_key', 'project_id'],
  pusher:         ['app_id', 'app_key', 'app_secret', 'cluster'],
};

// Secret fields — rendered as password inputs with show/hide
const SECRET_FIELDS = new Set([
  'api_key', 'key_secret', 'server_key', 'app_secret',
  'auth_token', 'secret_key', 'webhook_secret',
]);

// Fields that render as <select> dropdowns
// Note: 'provider' is intentionally NOT here — it's service-specific and
// resolved via backend field_options (see ServiceCard render logic below).
const DROPDOWN_FIELDS = {
  mode: {
    label: 'OTP Mode',
    options: [
      { value: 'LIVE', label: '🟢 LIVE' },
      { value: 'TEST', label: '🟡 TEST' },
    ],
  },
};

// Per-service provider dropdowns — used when backend doesn't send field_options
const PROVIDER_OPTIONS = {
  voice_provider: {
    label: 'TTS Provider',
    options: [
      { value: 'google',     label: '🔊 Google TTS' },
      { value: 'elevenlabs', label: '🎵 ElevenLabs'  },
    ],
  },
  stt_provider: {
    label: 'STT Provider',
    options: [
      { value: 'google', label: '🎙️ Google STT' },
      { value: 'groq',   label: '⚡ Groq (Whisper)' },
    ],
  },
};

const FIELD_LABELS = {
  api_key:        'API Key',
  template_id:    'OTP Template ID',
  host:           'Host URL',
  index:          'Index Name',
  key_id:         'Key ID',
  key_secret:     'Key Secret',
  server_key:     'Server Key',
  project_id:     'Project ID',
  app_id:         'App ID',
  app_key:        'App Key',
  app_secret:     'App Secret',
  cluster:        'Cluster',
  access_key:     'Access Key ID',
  secret_key:     'Secret Access Key',
  region:         'Region',
  account_sid:    'Account SID',
  auth_token:     'Auth Token',
  from_number:    'From Number',
  webhook_secret: 'Webhook Secret',
  provider:       'TTS Provider',
  mode:           'OTP Mode',
};

const OTP_SERVICES = ['msg91', 'fast2sms'];
const OTP_MODE_KEY = 'otp_mode';

const icon = (name) => SERVICE_ICONS[name?.toLowerCase()] ?? '🔌';

// ── Test Result Popup ─────────────────────────────────────────────────────────
function TestResultPopup({ result, onClose }) {
  if (!result) return null;
  const isSuccess = result.success;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className={`relative w-full max-w-sm mx-4 rounded-2xl border p-6 shadow-2xl ${
          isSuccess
            ? 'bg-green-950/90 border-green-700'
            : 'bg-red-950/90 border-red-700'
        }`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center gap-3">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center text-3xl ${
            isSuccess ? 'bg-green-900/60' : 'bg-red-900/60'
          }`}>
            {isSuccess ? '✅' : '❌'}
          </div>
          <p className={`font-semibold text-base ${isSuccess ? 'text-green-300' : 'text-red-300'}`}>
            {isSuccess ? 'Test Passed' : 'Test Failed'}
          </p>
          <p className="text-sm text-gray-300 leading-relaxed">{result.message}</p>
          {result.service && (
            <p className="text-xs text-gray-500">{result.service}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className={`mt-5 w-full py-2 rounded-xl text-sm font-medium transition ${
            isSuccess
              ? 'bg-green-700 hover:bg-green-600 text-white'
              : 'bg-red-700 hover:bg-red-600 text-white'
          }`}
        >
          Close
        </button>
      </div>
    </div>
  );
}

// ── Config Field ──────────────────────────────────────────────────────────────
function ConfigField({ fieldKey, label, value, onChange }) {
  const isSecret     = SECRET_FIELDS.has(fieldKey);
  const displayLabel = label ?? FIELD_LABELS[fieldKey] ?? fieldKey.replace(/_/g, ' ');
  const [show, setShow] = useState(false);

  return (
    <div className="space-y-1">
      <label className="text-xs text-gray-400 capitalize">{displayLabel}</label>
      <div className="relative">
        <input
          type={isSecret && !show ? 'password' : 'text'}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-gray-900 text-white px-3 py-2 rounded-lg border border-gray-700 text-sm outline-none focus:border-purple-500 pr-16"
        />
        {isSecret && (
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-300"
          >
            {show ? 'Hide' : 'Show'}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Service Card ──────────────────────────────────────────────────────────────
function ServiceCard({ service, editingId, editConfig, setEditConfig, setEditingId, saving, testing, toggling, handleToggle, handleTest, handleEditOpen, handleEditSave, otpBadge }) {
  const configured = Object.entries(service.config ?? {}).some(([k, v]) => {
    if (!v || String(v).startsWith('your_')) return false;
    // Short but valid values (provider names, cluster codes, etc.)
    const shortOk = ['provider', 'mode', 'cluster', 'region', 'model', 'model_name'].includes(k);
    return shortOk ? String(v).length > 0 : String(v).length > 5;
  });
  const isEditing  = editingId === service.id;
  const isOtpMode  = service.service_name?.toLowerCase() === OTP_MODE_KEY;
  const currentMode = service.config?.mode ?? 'TEST';

  const modeBadge = isOtpMode
    ? currentMode === 'LIVE'
      ? { label: '🟢 LIVE', cls: 'bg-green-900/40 text-green-400 border border-green-700' }
      : { label: '🟡 TEST', cls: 'bg-yellow-900/40 text-yellow-400 border border-yellow-700' }
    : null;

  return (
    <div className={`rounded-2xl border transition ${isEditing ? 'bg-gray-800 border-purple-700' : 'bg-gray-900 border-gray-800'}`}>
      <div className="flex items-center justify-between p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center text-xl">
            {icon(service.service_name)}
          </div>
          <div className="flex items-center gap-2">
            <div>
              <p className="text-white font-semibold">{service.display_name}</p>
              <p className="text-gray-500 text-xs">
                {isOtpMode ? 'Auto-activates when MSG91 & Fast2SMS are OFF' : service.service_name}
              </p>
            </div>
            {modeBadge && (
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${modeBadge.cls}`}>
                {modeBadge.label}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap justify-end">
          {otpBadge && (
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${otpBadge.cls}`}>
              {otpBadge.label}
            </span>
          )}
          {!isOtpMode && (
            <span className={`text-xs px-2 py-1 rounded-full ${configured ? 'bg-blue-900/40 text-blue-400' : 'bg-yellow-900/40 text-yellow-400'}`}>
              {configured ? '🔑 Configured' : '⚠️ Not Configured'}
            </span>
          )}
          {service.last_tested_at && (
            <span className="text-xs text-gray-600 hidden sm:block">
              Tested {new Date(service.last_tested_at).toLocaleDateString()}
            </span>
          )}
          {!isOtpMode && (
            <ToggleSwitch
              enabled={!!service.is_active}
              disabled={toggling === service.id}
              onChange={(val) => handleToggle(service.id, val)}
            />
          )}
          <button
            onClick={() => handleTest(service.id, service.display_name)}
            disabled={testing === service.id}
            className="text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg transition"
          >
            {testing === service.id ? 'Testing…' : '🧪 Test'}
          </button>
          <button
            onClick={() => isEditing ? setEditingId(null) : handleEditOpen(service)}
            className={`text-xs px-3 py-1.5 rounded-lg transition ${isEditing ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}
          >
            {isEditing ? 'Cancel' : '✏️ Edit Config'}
          </button>
        </div>
      </div>

      {isOtpMode && currentMode === 'LIVE' && (
        <div className="mx-5 mb-3 mt-0 bg-yellow-900/20 border border-yellow-700/50 text-yellow-400 text-xs px-4 py-2.5 rounded-xl">
          ⚠️ LIVE mode only works if MSG91 or Fast2SMS is active and configured. Otherwise backend auto-falls back to TEST.
        </div>
      )}

      {isEditing && (
        <div className="px-5 pb-5 border-t border-gray-700 pt-4">
          <p className="text-xs text-gray-500 mb-3">
            Update the credentials for <span className="text-white">{service.display_name}</span>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.keys(editConfig).map(key => {
              // Priority: 1) backend field_options  2) per-service PROVIDER_OPTIONS  3) shared DROPDOWN_FIELDS
              const backendOptions = service.field_options?.[key];
              const providerDef    = key === 'provider' ? PROVIDER_OPTIONS[service.service_name] ?? null : null;
              const dropdownDef    = backendOptions
                ? { label: service.field_labels?.[key] ?? FIELD_LABELS[key] ?? key, options: backendOptions }
                : providerDef ?? DROPDOWN_FIELDS[key] ?? null;

              if (dropdownDef) {
                return (
                  <div key={key} className="space-y-1">
                    <label className="text-xs text-gray-400">{dropdownDef.label}</label>
                    <select
                      value={editConfig[key] ?? dropdownDef.options[0]?.value ?? ''}
                      onChange={(e) => setEditConfig(prev => ({ ...prev, [key]: e.target.value }))}
                      className="w-full bg-gray-900 text-white px-3 py-2 rounded-lg border border-gray-700 text-sm outline-none focus:border-purple-500"
                    >
                      {dropdownDef.options.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                );
              }

              return (
                <ConfigField
                  key={key}
                  fieldKey={key}
                  label={service.field_labels?.[key]}
                  value={editConfig[key]}
                  onChange={(val) => setEditConfig(prev => ({ ...prev, [key]: val }))}
                />
              );
            })}
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => handleEditSave(service.id)}
              disabled={saving}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm px-5 py-2 rounded-lg transition"
            >
              {saving ? 'Saving…' : '💾 Save Config'}
            </button>
            <button
              onClick={() => setEditingId(null)}
              className="bg-gray-700 hover:bg-gray-600 text-white text-sm px-4 py-2 rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ApiManager() {
  const [services,   setServices]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [testing,    setTesting]    = useState(null);
  const [toggling,   setToggling]   = useState(null);
  const [editingId,  setEditingId]  = useState(null);
  const [editConfig, setEditConfig] = useState({});
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState('');
  const [success,    setSuccess]    = useState('');
  const [testResult, setTestResult] = useState(null); // { success, message, service }

  useEffect(() => { fetchServices(); }, []);

  const fetchServices = async () => {
    try {
      const res  = await api.get('/api-manager');
      const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
      setServices(data);
    } catch {
      setError('Failed to load API services.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id, value) => {
    setToggling(id);
    setServices(prev => prev.map(s => s.id === id ? { ...s, is_active: value } : s));
    try {
      const res = await api.put(`/api-manager/${id}/toggle`);
      // Sync all services from response (MSG91 toggle can disable Fast2SMS)
      const updated = res.data?.data;
      if (updated) {
        setServices(prev => prev.map(s => s.id === updated.id ? updated : s));
      }
      setSuccess(value ? 'Service activated.' : 'Service deactivated.');
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setServices(prev => prev.map(s => s.id === id ? { ...s, is_active: !value } : s));
      setError('Failed to toggle service.');
    } finally {
      setToggling(null);
    }
  };

  const handleTest = async (id, displayName) => {
    setTesting(id);
    try {
      const res = await api.post(`/api-manager/${id}/test`);
      setTestResult({
        success: res.data?.success !== false,
        message: res.data?.message ?? 'Connection test passed!',
        service: displayName,
      });
      fetchServices();
    } catch (e) {
      setTestResult({
        success: false,
        message: e.response?.data?.message ?? e.response?.data?.error ?? 'Test failed. Check your API credentials.',
        service: displayName,
      });
    } finally {
      setTesting(null);
    }
  };

  const handleEditOpen = (service) => {
    setEditingId(service.id);
    const name       = service.service_name?.toLowerCase();
    const knownKeys  = SERVICE_FIELDS[name] ?? Object.keys(service.field_labels ?? {});
    const configKeys = Object.keys(service.config ?? {});
    const allKeys    = knownKeys.length > 0 ? knownKeys : configKeys;
    const fallback   = allKeys.reduce((acc, k) => ({ ...acc, [k]: '' }), {});
    setEditConfig({ ...fallback, ...(service.config ?? {}) });
    setError('');
  };

  const handleEditSave = async (id) => {
    setSaving(true);
    try {
      await api.put(`/api-manager/${id}`, { config: editConfig });
      setEditingId(null);
      setSuccess('Config saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
      fetchServices();
    } catch (e) {
      setError(e.response?.data?.message ?? e.response?.data?.error ?? 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const isConfigured = (config) =>
    Object.entries(config ?? {}).some(([k, v]) => {
      if (!v || String(v).startsWith('your_')) return false;
      const shortOk = ['provider', 'mode', 'cluster', 'region', 'model', 'model_name'].includes(k);
      return shortOk ? String(v).length > 0 : String(v).length > 5;
    });

  const otpModeService = services.find(s => s.service_name?.toLowerCase() === OTP_MODE_KEY);
  const otpServices    = services.filter(s => OTP_SERVICES.includes(s.service_name?.toLowerCase()));
  const otherServices  = services.filter(s => !OTP_SERVICES.includes(s.service_name?.toLowerCase()) && s.service_name?.toLowerCase() !== OTP_MODE_KEY);
  const msg91Active    = otpServices.find(s => s.service_name?.toLowerCase() === 'msg91')?.is_active;

  const getOtpBadge = (service) => {
    const name = service.service_name?.toLowerCase();
    if (name === 'msg91' && service.is_active)
      return { label: '⭐ Primary OTP', cls: 'bg-purple-900/50 text-purple-300 border border-purple-700' };
    if (name === 'fast2sms' && service.is_active && !msg91Active)
      return { label: '⭐ Primary OTP', cls: 'bg-purple-900/50 text-purple-300 border border-purple-700' };
    if (name === 'fast2sms' && msg91Active)
      return { label: '⏸ Overridden by MSG91', cls: 'bg-gray-800 text-gray-500 border border-gray-700' };
    return null;
  };

  const cardProps = { editingId, editConfig, setEditConfig, setEditingId, saving, testing, toggling, handleToggle, handleTest, handleEditOpen, handleEditSave };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6">
      <TestResultPopup result={testResult} onClose={() => setTestResult(null)} />

      <PageHeader
        title="API Services"
        subtitle="Manage third-party API integrations and credentials"
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-white">{services.length}</p>
          <p className="text-xs text-gray-400 mt-1">Total Services</p>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{services.filter(s => s.is_active).length}</p>
          <p className="text-xs text-gray-400 mt-1">Active</p>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-yellow-400">{services.filter(s => !isConfigured(s.config)).length}</p>
          <p className="text-xs text-gray-400 mt-1">Needs Config</p>
        </div>
      </div>

      {success && (
        <div className="bg-green-900/30 border border-green-800 text-green-400 px-4 py-3 rounded-xl mb-4 text-sm">
          ✅ {success}
        </div>
      )}
      {error && (
        <div className="bg-red-900/30 border border-red-800 text-red-400 px-4 py-3 rounded-xl mb-4 text-sm flex justify-between items-center">
          <span>⚠️ {error}</span>
          <button onClick={() => setError('')} className="text-red-300 hover:text-white ml-4 text-lg leading-none">✕</button>
        </div>
      )}

      <div className="space-y-4">
        {services.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <p className="text-4xl mb-3">🔌</p>
            <p className="text-sm">No API services found.</p>
          </div>
        )}

        {/* OTP Providers Group */}
        {otpServices.length > 0 && (
          <div className="rounded-2xl border border-purple-900/40 bg-purple-950/10 overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-purple-900/30 bg-purple-950/20">
              <span className="text-sm font-semibold text-purple-300">📲 OTP Providers</span>
              <span className="text-xs text-gray-500">— MSG91 takes priority when active; falls back to Fast2SMS</span>
            </div>
            <div className="divide-y divide-gray-800/50 px-2 py-2 space-y-2">
              {otpServices.map(service => (
                <ServiceCard key={service.id} service={service} {...cardProps} otpBadge={getOtpBadge(service)} />
              ))}
            </div>
          </div>
        )}

        {/* OTP Mode Card */}
        {otpModeService && (
          <ServiceCard key={otpModeService.id} service={otpModeService} {...cardProps} otpBadge={null} />
        )}

        {/* All other services */}
        {otherServices.map(service => (
          <ServiceCard key={service.id} service={service} {...cardProps} otpBadge={null} />
        ))}
      </div>
    </div>
  );
}
