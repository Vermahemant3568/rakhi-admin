import { useEffect, useState } from 'react';
import api from '../api/axios';
import ToggleSwitch from '../components/ToggleSwitch';

export default function ApiManager() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editConfig, setEditConfig] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await api.get('/api-manager');
      const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
      setServices(data);
    } catch {
      setError('Failed to load API services.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id, value) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, is_active: value } : s))
    );
    await api.put(`/api-manager/${id}/toggle`);
  };

  const handleTest = async (id) => {
    setTesting(id);
    try {
      const res = await api.post(`/api-manager/test/${id}`);
      alert(res.data.message);
      fetchServices();
    } catch {
      alert('Test failed.');
    } finally {
      setTesting(null);
    }
  };

  const handleEditOpen = (service) => {
    setEditingId(service.id);
    setEditConfig(JSON.stringify(service.config, null, 2));
  };

  const handleEditSave = async (id) => {
    let config;
    try {
      config = JSON.parse(editConfig);
    } catch {
      setError('Invalid JSON — please check the config format.');
      return;
    }
    try {
      await api.put(`/api-manager/${id}/update`, { config });
      setEditingId(null);
      setError('');
      fetchServices();
    } catch (e) {
      setError(e.response?.data?.message ?? e.response?.data?.error ?? 'Save failed. Please try again.');
    }
  };

  if (loading) return <div className="text-gray-400 p-6">Loading...</div>;

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-white mb-6">API Services</h2>

      {error && (
        <div className="bg-red-900/30 text-red-400 p-3 rounded-lg mb-4 text-sm">{error}</div>
      )}

      <div className="space-y-4">
        {services.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <p className="text-4xl mb-3">🔌</p>
            <p className="text-sm">No API services found.</p>
          </div>
        )}
        {services.map((service) => (
          <div key={service.id} className="bg-gray-900 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-white font-semibold">{service.display_name}</p>
                <p className="text-gray-500 text-sm">{service.service_name}</p>
                {service.last_tested_at && (
                  <p className="text-gray-600 text-xs mt-1">
                    Last tested: {new Date(service.last_tested_at).toLocaleString()}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <ToggleSwitch
                  enabled={!!service.is_active}
                  onChange={(val) => handleToggle(service.id, val)}
                />
                <button
                  onClick={() => handleTest(service.id)}
                  disabled={testing === service.id}
                  className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition"
                >
                  {testing === service.id ? 'Testing...' : 'Test'}
                </button>
                <button
                  onClick={() => handleEditOpen(service)}
                  className="text-sm bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg transition"
                >
                  Edit Config
                </button>
              </div>
            </div>

            {editingId === service.id && (
              <div className="mt-3">
                <textarea
                  rows={8}
                  value={editConfig}
                  onChange={(e) => setEditConfig(e.target.value)}
                  className="w-full bg-gray-800 text-green-400 font-mono text-sm p-3 rounded-lg outline-none
                             focus:ring-2 focus:ring-purple-500"
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleEditSave(service.id)}
                    className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2 rounded-lg transition"
                  >
                    Save
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
        ))}
      </div>
    </div>
  );
}
