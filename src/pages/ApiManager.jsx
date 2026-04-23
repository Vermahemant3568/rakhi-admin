import { useEffect, useState } from 'react';
import api from '../api/axios';
import ToggleSwitch from '../components/ToggleSwitch';
import PageHeader from '../components/PageHeader';

const SERVICE_ICONS = {
  otp_mode:  '⚙️',
  twilio:     '📱',
  msg91:      '💬',
  fast2sms:   '📲',
  firebase:   '🔥',
  sendgrid:   '📧',
  razorpay:   '💳',
  stripe:     '💳',
  pinecone:   '🌲',
  openai:     '🤖',
  gemini:     '🔮',
  aws:        '☁️',
  google_stt: '🎙️',
  google_tts: '🔊',
  pusher:     '📡',
};

const SERVICE_FIELDS = {
  fast2sms:   ['api_key'],
  msg91:      ['api_key', 'template_id'],
  google_stt: ['api_key'],
  google_tts: ['api_key'],
  pinecone:   ['api_key', 'host', 'index'],
  razorpay:   ['key_id', 'key_secret'],
  firebase:   ['server_key', 'project_id'],
  pusher:     ['app_id', 'app_key', 'app_secret', 'cluster'],
};

const FIELD_META = {
  api_key:     { label: 'API Key',       secret: true  },
  template_id: { label: 'OTP Template ID', secret: false },
  host:        { label: 'Host',          secret: false },
  index:       { label: 'Index Name',    secret: false },
  key_id:      { label: 'Key ID',        secret: false },
  key_secret:  { label: 'Key Secret',    secret: true  },
  server_key:  { label: 'Server Key',    secret: true  },
  project_id:  { label: 'Project ID',    secret: false },
  app_id:      { label: 'App ID',        secret: false },
  app_key:     { label: 'App Key',       secret: false },
  app_secret:  { label: 'App Secret',    secret: true  },
  cluster:     { label: 'Cluster',       secret: false },
};

const OTP_SERVICES  = ['msg91', 'fast2sms'];
const OTP_MODE_KEY  = 'otp_mode';

const icon = (name) => SERVICE_ICONS[name?.toLowerCase()] ?? '🔌';

function ConfigField({ fieldKey, label, value, onChange }) {
  const meta = FIELD_META[fieldKey] ?? { secret: false };
  const displayLabel = label ?? meta.label ?? fieldKey.replace(/_/g, ' ');
  const [show, setShow] = useState(false);

  return (
    <div className="space-y-1">
      <label className="text-xs text-gray-400 capitalize">{displayLabel}</label>
      <div className="relative">
        <input
          type={meta.secret && !show ? 'password' : 'text'}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-gray-900 text-white px-3 py-2 rounded-lg border border-gray-700 text-sm outline-none focus:border-purple-500 pr-16"
        />
        {meta.secret && (
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

function ServiceCard({ service, editingId, editConfig, setEditConfig, setEditingId, saving, testing, toggling, handleToggle, handleTest, handleEditOpen, handleEditSave, otpBadge }) {
  const configured  = Object.values(service.config ?? {}).some(v => v && !String(v).startsWith('your_') && String(v).length > 5);
  const isEditing   = editingId === service.id;
  const isOtpMode   = service.service_name?.toLowerCase() === OTP_MODE_KEY;
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
            onClick={() => handleTest(service.id)}
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
            {Object.keys(editConfig).map(key => (
              isOtpMode && key === 'mode' ? (
                <div key={key} className="space-y-1">
                  <label className="text-xs text-gray-400">
                    {service.field_labels?.[key] ?? 'OTP Mode (LIVE / TEST)'}
                  </label>
                  <select
                    value={editConfig[key] ?? 'TEST'}
                    onChange={(e) => setEditConfig(prev => ({ ...prev, [key]: e.target.value }))}
                    className="w-full bg-gray-900 text-white px-3 py-2 rounded-lg border border-gray-700 text-sm outline-none focus:border-purple-500"
                  >
                    <option value="LIVE">LIVE</option>
                    <option value="TEST">TEST</option>
                  </select>
                </div>
              ) : (
                <ConfigField
                  key={key}
                  fieldKey={key}
                  label={service.field_labels?.[key]}
                  value={editConfig[key]}
                  onChange={(val) => setEditConfig(prev => ({ ...prev, [key]: val }))}
                />
              )
            ))}
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

  const notify = (msg, type = 'success') => {
    type === 'success' ? setSuccess(msg) : setError(msg);
    if (type === 'success') setTimeout(() => setSuccess(''), 3000);
  };

  const handleToggle = async (id, value) => {
    setToggling(id);
    setServices(prev => prev.map(s => s.id === id ? { ...s, is_active: value } : s));
    try {
      await api.put(`/api-manager/${id}/toggle`);
      notify(value ? 'Service activated.' : 'Service deactivated.');
    } catch {
      setServices(prev => prev.map(s => s.id === id ? { ...s, is_active: !value } : s));
      notify('Failed to toggle service.', 'error');
    } finally {
      setToggling(null);
    }
  };

  const handleTest = async (id) => {
    setTesting(id);
    setError('');
    try {
      const res = await api.post(`/api-manager/${id}/test`);
      notify(res.data?.message ?? 'Connection test passed!');
      fetchServices();
    } catch (e) {
      notify(e.response?.data?.message ?? e.response?.data?.error ?? 'Test failed. Check your API credentials.', 'error');
    } finally {
      setTesting(null);
    }
  };

  const handleEditOpen = (service) => {
    setEditingId(service.id);
    const name     = service.service_name?.toLowerCase();
    const fallback = (SERVICE_FIELDS[name] ?? Object.keys(service.field_labels ?? {})).reduce((acc, k) => ({ ...acc, [k]: '' }), {});
    setEditConfig({ ...fallback, ...(service.config ?? {}) });
    setError('');
  };

  const handleEditSave = async (id) => {
    setSaving(true);
    try {
      await api.put(`/api-manager/${id}`, { config: editConfig });
      setEditingId(null);
      notify('Config saved successfully!');
      fetchServices();
    } catch (e) {
      notify(e.response?.data?.message ?? e.response?.data?.error ?? 'Failed to save. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const isConfigured = (config) =>
    Object.values(config ?? {}).some(v => v && !String(v).startsWith('your_') && String(v).length > 5);

  const otpModeService = services.find(s => s.service_name?.toLowerCase() === OTP_MODE_KEY);
  const otpServices    = services.filter(s => OTP_SERVICES.includes(s.service_name?.toLowerCase()));
  const otherServices  = services.filter(s => !OTP_SERVICES.includes(s.service_name?.toLowerCase()) && s.service_name?.toLowerCase() !== OTP_MODE_KEY);
  const msg91Active   = otpServices.find(s => s.service_name?.toLowerCase() === 'msg91')?.is_active;

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
