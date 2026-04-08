import { useEffect, useState } from 'react';
import {
  getProgressOverview,
  getUserStreaks,
  getProgressSummary,
  getChatActivity,
} from '../api/progress';
import DataTable  from '../components/DataTable';
import PageHeader from '../components/PageHeader';
import StatCard   from '../components/StatCard';

export default function ProgressMonitor() {
  const [overview,  setOverview]  = useState(null);
  const [streaks,   setStreaks]   = useState([]);
  const [summary,   setSummary]   = useState([]);
  const [chats,     setChats]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [tab,       setTab]       = useState('streaks');

  const load = () => {
    setLoading(true);
    setError('');
    Promise.all([
      getProgressOverview().catch(() => ({ data: {} })),
      getUserStreaks().catch(() => ({ data: [] })),
      getProgressSummary().catch(() => ({ data: [] })),
      getChatActivity().catch(() => ({ data: [] })),
    ]).then(([o, s, sum, c]) => {
      setOverview(o.data?.data ?? o.data ?? {});
      setStreaks(Array.isArray(s.data) ? s.data : (s.data?.data ?? []));
      setSummary(Array.isArray(sum.data) ? sum.data : (sum.data?.data ?? []));
      setChats(Array.isArray(c.data) ? c.data : (c.data?.data ?? []));
    }).catch(err => {
      setError(err?.response?.data?.message ?? 'Failed to load progress data.');
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

  const statCards = [
    { title: 'Total Checkins',      value: overview?.total_checkins      ?? 0, icon: '✅', color: 'bg-green-900/40'  },
    { title: 'Checkins Today',      value: overview?.checkins_today      ?? 0, icon: '📋', color: 'bg-teal-900/40'   },
    { title: 'Active Streaks',      value: overview?.active_streaks      ?? 0, icon: '🔥', color: 'bg-orange-900/40' },
    { title: 'Avg Streak (days)',   value: overview?.avg_streak          ?? 0, icon: '📈', color: 'bg-blue-900/40'   },
    { title: 'Total Chats',         value: overview?.total_chats         ?? 0, icon: '💬', color: 'bg-purple-900/40' },
    { title: 'PDFs Generated',      value: overview?.pdfs_generated      ?? 0, icon: '📄', color: 'bg-indigo-900/40' },
    { title: 'Diet Plans Today',    value: overview?.diet_plans_today    ?? 0, icon: '🥗', color: 'bg-yellow-900/40' },
    { title: 'Fitness Plans Today', value: overview?.fitness_plans_today ?? 0, icon: '💪', color: 'bg-pink-900/40'   },
  ];

  const tabs = [
    { key: 'streaks',  label: `🔥 User Streaks (${streaks.length})`   },
    { key: 'summary',  label: `📊 30-Day Summary (${summary.length})`  },
    { key: 'chats',    label: `💬 Chat & PDF Activity (${chats.length})` },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Progress Monitor"
        subtitle="Track user streaks, checkins, 30-day summaries and chat/PDF activity"
        action={
          <button onClick={load}
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg text-sm transition">
            🔄 Refresh
          </button>
        }
      />

      {error && (
        <div className="px-4 py-3 bg-red-900/40 border border-red-700 rounded-lg text-red-400 text-sm flex justify-between">
          <span>⚠️ {error}</span>
          <button onClick={load} className="underline text-xs">Retry</button>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map(c => (
          <StatCard key={c.title} title={c.title} value={c.value} icon={c.icon} color={c.color} />
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-800">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px ${
              tab === t.key
                ? 'border-purple-500 text-white'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Streaks Tab */}
      {tab === 'streaks' && (
        <DataTable
          loading={false}
          columns={[
            { key: 'user',           label: 'User',
              render: (r) => r.user
                ? `${r.user.first_name ?? ''} ${r.user.last_name ?? ''}`.trim() || r.user.mobile || '—'
                : r.user_id ?? '—'
            },
            { key: 'current_streak', label: 'Current Streak',
              render: (r) => (
                <span className="text-orange-400 font-bold">
                  🔥 {r.current_streak ?? 0} days
                </span>
              )
            },
            { key: 'longest_streak', label: 'Longest Streak',
              render: (r) => `${r.longest_streak ?? 0} days` },
            { key: 'total_checkins', label: 'Total Checkins',
              render: (r) => r.total_checkins ?? 0 },
            { key: 'last_checkin',   label: 'Last Checkin',
              render: (r) => r.last_checkin_at
                ? new Date(r.last_checkin_at).toLocaleDateString()
                : '—'
            },
            { key: 'streak_status',  label: 'Status',
              render: (r) => {
                const active = r.current_streak > 0;
                return (
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    active ? 'bg-green-900/40 text-green-400' : 'bg-gray-700 text-gray-400'
                  }`}>
                    {active ? 'Active' : 'Inactive'}
                  </span>
                );
              }
            },
          ]}
          data={streaks}
        />
      )}

      {/* 30-Day Summary Tab */}
      {tab === 'summary' && (
        <DataTable
          loading={false}
          columns={[
            { key: 'user',              label: 'User',
              render: (r) => r.user
                ? `${r.user.first_name ?? ''} ${r.user.last_name ?? ''}`.trim() || r.user.mobile || '—'
                : r.user_id ?? '—'
            },
            { key: 'avg_calories',      label: 'Avg Calories',
              render: (r) => r.avg_calories ? `${Math.round(r.avg_calories)} kcal` : '—' },
            { key: 'avg_water',         label: 'Avg Water',
              render: (r) => r.avg_water ? `${r.avg_water}L` : '—' },
            { key: 'avg_sleep',         label: 'Avg Sleep',
              render: (r) => r.avg_sleep ? `${r.avg_sleep}h` : '—' },
            { key: 'avg_steps',         label: 'Avg Steps',
              render: (r) => r.avg_steps ? Math.round(r.avg_steps).toLocaleString() : '—' },
            { key: 'avg_mood',          label: 'Avg Mood',
              render: (r) => r.avg_mood
                ? <span className="text-yellow-400">{Number(r.avg_mood).toFixed(1)} / 5</span>
                : '—'
            },
            { key: 'checkin_days',      label: 'Checkin Days',
              render: (r) => `${r.checkin_days ?? 0} / 30` },
          ]}
          data={summary}
        />
      )}

      {/* Chat & PDF Activity Tab */}
      {tab === 'chats' && (
        <DataTable
          loading={false}
          columns={[
            { key: 'user',        label: 'User',
              render: (r) => r.user
                ? `${r.user.first_name ?? ''} ${r.user.last_name ?? ''}`.trim() || r.user.mobile || '—'
                : r.user_id ?? '—'
            },
            { key: 'coach',       label: 'Coach',
              render: (r) => r.coach?.name ?? '—' },
            { key: 'message',     label: 'Trigger Message',
              render: (r) => (
                <span className="text-gray-300 text-xs truncate max-w-xs block" title={r.message}>
                  {r.message ? r.message.substring(0, 60) + (r.message.length > 60 ? '...' : '') : '—'}
                </span>
              )
            },
            { key: 'plan_type',   label: 'Plan Type',
              render: (r) => r.plan_type
                ? <span className="text-purple-400 text-xs capitalize">{r.plan_type}</span>
                : '—'
            },
            { key: 'pdf_status',  label: 'PDF',
              render: (r) => {
                if (!r.plan_type) return <span className="text-gray-600 text-xs">N/A</span>;
                return r.pdf_url
                  ? <a href={r.pdf_url} target="_blank" rel="noreferrer" className="text-blue-400 text-xs underline">📄 View</a>
                  : <span className="bg-yellow-900/40 text-yellow-400 text-xs px-2 py-0.5 rounded-full">⏳ Pending</span>;
              }
            },
            { key: 'job_status',  label: 'Job',
              render: (r) => {
                const colors = {
                  completed:  'bg-green-900/40 text-green-400',
                  processing: 'bg-blue-900/40 text-blue-400',
                  failed:     'bg-red-900/40 text-red-400',
                  pending:    'bg-yellow-900/40 text-yellow-400',
                };
                return r.job_status
                  ? <span className={`text-xs px-2 py-0.5 rounded-full ${colors[r.job_status] ?? 'bg-gray-700 text-gray-400'}`}>{r.job_status}</span>
                  : <span className="text-gray-600 text-xs">—</span>;
              }
            },
            { key: 'created_at',  label: 'Time',
              render: (r) => r.created_at ? new Date(r.created_at).toLocaleString() : '—' },
          ]}
          data={chats}
        />
      )}
    </div>
  );
}
