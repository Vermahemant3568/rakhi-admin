import { useEffect, useState } from 'react';
import { getDashboard } from '../api/dashboard';
import { getServices }  from '../api/apiManager';
import { getLLMs }      from '../api/apiManager';
import StatCard  from '../components/StatCard';
import DataTable from '../components/DataTable';

export default function Dashboard() {
  const [data,     setData]     = useState(null);
  const [services, setServices] = useState([]);
  const [llms,     setLlms]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    Promise.all([
      getDashboard(),
      getServices().catch(() => ({ data: [] })),
      getLLMs().catch(() => ({ data: [] })),
    ]).then(([d, s, l]) => {
      setData(d.data);
      setServices(Array.isArray(s.data) ? s.data : (s.data?.data ?? []));
      setLlms(Array.isArray(l.data) ? l.data : (l.data?.data ?? []));
    }).catch(err => {
      setError(err?.response?.data?.message ?? 'Failed to load dashboard.');
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="px-4 py-3 bg-red-900/40 border border-red-700 rounded-lg text-red-400 text-sm flex justify-between items-center">
          <span>⚠️ {error}</span>
          <button onClick={load} className="text-red-300 hover:text-white underline text-xs">Retry</button>
        </div>
      </div>
    );
  }

  const statCards = [
    { title: 'Total Users',     value: data?.users?.total           ?? 0, icon: '👥', color: 'bg-blue-900/40'   },
    { title: 'Active Users',    value: data?.users?.active          ?? 0, icon: '⚡', color: 'bg-yellow-900/40' },
    { title: 'New Today',       value: data?.users?.today           ?? 0, icon: '🆕', color: 'bg-green-900/40'  },
    { title: 'Banned Users',    value: data?.users?.banned          ?? 0, icon: '🚫', color: 'bg-red-900/40'    },
    { title: 'Trial Subs',      value: data?.subscriptions?.trial   ?? 0, icon: '🎯', color: 'bg-orange-900/40' },
    { title: 'Active Subs',     value: data?.subscriptions?.active  ?? 0, icon: '💎', color: 'bg-purple-900/40' },
    { title: 'Active Sessions', value: data?.chats?.active_sessions ?? 0, icon: '💬', color: 'bg-pink-900/40'   },
    { title: 'Chats Today',     value: data?.chats?.today_sessions  ?? 0, icon: '📨', color: 'bg-indigo-900/40' },
    { title: 'Total Checkins',  value: data?.checkins?.total        ?? 0, icon: '✅', color: 'bg-teal-900/40'   },
    { title: 'Checkins Today',  value: data?.checkins?.today        ?? 0, icon: '📋', color: 'bg-cyan-900/40'   },
    { title: 'Total Coaches',   value: data?.coaches?.total         ?? 0, icon: '🧑‍⚕️', color: 'bg-blue-900/40' },
    { title: 'Active Coaches',  value: data?.coaches?.active        ?? 0, icon: '🟢', color: 'bg-green-900/40'  },
  ];

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">
          Welcome back! Here's what's happening with Rakhi.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(card => (
          <StatCard key={card.title} title={card.title} value={card.value} icon={card.icon} color={card.color} />
        ))}
      </div>

      {/* System Status Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* LLM Status */}
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
          <div className="flex justify-between items-center mb-4">
            <p className="text-gray-400 text-sm font-medium">🤖 LLM Configs</p>
            <span className="text-xs text-gray-500">
              {llms.filter(l => l.is_active).length}/{llms.length} Active
            </span>
          </div>
          {llms.length === 0 ? (
            <p className="text-gray-500 text-sm">
              No LLM configured.{' '}
              <a href="/llm-config" className="text-purple-400 underline">Configure now</a>
            </p>
          ) : (
            <div className="space-y-3">
              {llms.map(llm => {
                const providerIcon = { gemini: '🔮', chatgpt: '🤖' }[llm.provider] ?? '💡';
                const hasApiKey = llm.has_api_key === true;
                return (
                  <div key={llm.id} className={`rounded-xl p-3 border ${
                    llm.is_active
                      ? 'bg-purple-900/20 border-purple-700'
                      : 'bg-gray-800 border-gray-700'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{providerIcon}</span>
                        <div>
                          <p className="text-white text-sm font-medium capitalize">{llm.provider}</p>
                          <p className="text-gray-500 text-xs">{llm.model_name}</p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        llm.is_active
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-700 text-gray-400'
                      }`}>
                        {llm.is_active ? '✅ Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                      {[
                        ['Tokens',  llm.max_tokens],
                        ['Temp',    llm.temperature],
                        ['Top P',   llm.top_p],
                      ].map(([label, val]) => (
                        <div key={label} className="bg-gray-900/60 rounded-lg px-2 py-1 text-center">
                          <p className="text-gray-500">{label}</p>
                          <p className="text-white font-medium">{val}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        hasApiKey
                          ? 'bg-blue-900/40 text-blue-400'
                          : 'bg-yellow-900/40 text-yellow-400'
                      }`}>
                        {hasApiKey ? '🔑 API Key Set' : '⚠️ Needs API Key'}
                      </span>
                      <span className="text-gray-600 text-xs">
                        Added: {new Date(llm.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* API Services Status */}
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
          <div className="flex justify-between items-center mb-4">
            <p className="text-gray-400 text-sm font-medium">🔌 API Services</p>
            <span className="text-xs text-gray-500">
              {services.filter(s => s.is_active).length}/{services.length} Active
            </span>
          </div>
          {services.length === 0 ? (
            <p className="text-gray-500 text-sm">No API services found.</p>
          ) : (
            <div className="space-y-3">
              {services.map(s => {
                const configKeys = Object.keys(s.config ?? {});
                const isConfigured = configKeys.some(k => {
                  const val = s.config[k];
                  return val && !val.toString().startsWith('your_');
                });
                return (
                  <div key={s.id} className="bg-gray-800 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-white text-sm font-medium">{s.display_name}</p>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          s.is_active ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'
                        }`}>
                          {s.is_active ? '● Active' : '● Inactive'}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-500 text-xs mb-2">{s.service_name}</p>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        isConfigured
                          ? 'bg-blue-900/40 text-blue-400'
                          : 'bg-yellow-900/40 text-yellow-400'
                      }`}>
                        {isConfigured ? '🔑 Configured' : '⚠️ Needs API Key'}
                      </span>
                      {s.last_tested_at ? (
                        <span className="text-gray-500 text-xs">
                          Tested: {new Date(s.last_tested_at).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-gray-600 text-xs">Never tested</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Recent Users */}
      {data?.recent_users?.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-300 mb-4">Recent Users</h2>
          <DataTable
            loading={false}
            columns={[
              { key: 'id',     label: 'ID' },
              { key: 'name',   label: 'Name',
                render: (r) => `${r.first_name ?? ''} ${r.last_name ?? ''}`.trim() || '—' },
              { key: 'mobile', label: 'Mobile' },
              { key: 'created_at', label: 'Joined',
                render: (r) => new Date(r.created_at).toLocaleDateString() },
              { key: 'onboarding_complete', label: 'Onboarded',
                render: (r) => r.onboarding_complete ? '✅' : '⏳' },
            ]}
            data={data?.recent_users ?? []}
          />
        </div>
      )}
    </div>
  );
}
