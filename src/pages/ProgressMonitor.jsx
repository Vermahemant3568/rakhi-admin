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
  const [tab,       setTab]       = useState('chats');

  const load = () => {
    setLoading(true);
    setError('');
    Promise.all([
      getProgressOverview().catch(() => ({ data: {} })),
      getUserStreaks().catch(() => ({ data: { streaks: [] } })),
      getProgressSummary().catch(() => ({ data: { summary: [] } })),
      getChatActivity().catch(() => ({ data: { chat_activity: [] } })),
    ]).then(([o, s, sum, c]) => {
      setOverview(o.data ?? {});
      // backend wraps in { streaks: [...] }
      const streakList = s.data?.streaks ?? s.data?.data ?? s.data ?? [];
      setStreaks(Array.isArray(streakList) ? streakList : []);
      const summaryList = sum.data?.summary ?? sum.data?.data ?? sum.data ?? [];
      setSummary(Array.isArray(summaryList) ? summaryList : []);
      const chatList = c.data?.chat_activity ?? c.data?.data ?? c.data ?? [];
      setChats(Array.isArray(chatList) ? chatList : []);
    }).catch(err => {
      setError(err?.response?.data?.message ?? 'Failed to load progress data.');
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full py-24">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const ov = overview ?? {};

  const statCards = [
    { title: 'Total Checkins',      value: ov.total_checkins      ?? 0, icon: '✅', color: 'bg-green-900/40'  },
    { title: 'Checkins Today',      value: ov.checkins_today      ?? 0, icon: '📋', color: 'bg-teal-900/40'   },
    { title: 'Active Streaks',      value: ov.active_streaks      ?? 0, icon: '🔥', color: 'bg-orange-900/40' },
    { title: 'Avg Streak (days)',   value: ov.avg_streak          ?? 0, icon: '📈', color: 'bg-blue-900/40'   },
    { title: 'Total Chats',         value: ov.total_chats         ?? 0, icon: '💬', color: 'bg-purple-900/40' },
    { title: 'PDFs Generated',      value: ov.pdfs_generated      ?? 0, icon: '📄', color: 'bg-indigo-900/40' },
    { title: 'Diet Plans Today',    value: ov.diet_plans_today    ?? 0, icon: '🥗', color: 'bg-yellow-900/40' },
    { title: 'Fitness Plans Today', value: ov.fitness_plans_today ?? 0, icon: '💪', color: 'bg-pink-900/40'   },
  ];

  const planStateCards = [
    { title: 'Plans Generating', value: ov.plans_generating ?? 0, icon: '⚙️', color: 'bg-blue-900/40'   },
    { title: 'Plans Completed',  value: ov.plans_completed  ?? 0, icon: '✅', color: 'bg-green-900/40'  },
    { title: 'Plans Failed',     value: ov.plans_failed     ?? 0, icon: '❌', color: 'bg-red-900/40'    },
  ];

  const tabs = [
    { key: 'chats',   label: `📊 Plan Activity (${chats.length})`    },
    { key: 'streaks', label: `🔥 User Streaks (${streaks.length})`    },
    { key: 'summary', label: `📋 30-Day Summary (${summary.length})`  },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Progress Monitor"
        subtitle="Track user streaks, checkins, plan generation activity and 30-day summaries"
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

      {/* Main Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map(c => (
          <StatCard key={c.title} title={c.title} value={c.value} icon={c.icon} color={c.color} />
        ))}
      </div>

      {/* Plan State Cards */}
      <div>
        <p className="text-gray-500 text-xs uppercase tracking-wider mb-3">Plan Generation States</p>
        <div className="grid grid-cols-3 gap-4">
          {planStateCards.map(c => (
            <StatCard key={c.title} title={c.title} value={c.value} icon={c.icon} color={c.color} />
          ))}
        </div>
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

      {/* Plan Activity Tab */}
      {tab === 'chats' && (
        <DataTable
          loading={false}
          columns={[
            { key: 'user',        label: 'User',
              render: (r) => r.user
                ? `${r.user.first_name ?? ''} ${r.user.last_name ?? ''}`.trim() || r.user.mobile || '—'
                : `User #${r.user_id}` },
            { key: 'consultation_state', label: 'Consultation',
              render: (r) => (
                <span className="text-xs px-2 py-0.5 rounded-full capitalize bg-gray-700 text-gray-300">
                  {r.consultation_state?.replace(/_/g, ' ') ?? '—'}
                </span>
              )},
            { key: 'plan_state',  label: 'Plan State',
              render: (r) => {
                const colors = {
                  completed:  'bg-green-900/40 text-green-400',
                  generating: 'bg-blue-900/40 text-blue-400',
                  failed:     'bg-red-900/40 text-red-400',
                };
                return r.plan_generation_state
                  ? <span className={`text-xs px-2 py-0.5 rounded-full ${colors[r.plan_generation_state] ?? 'bg-gray-700 text-gray-400'}`}>
                      {r.plan_generation_state}
                    </span>
                  : <span className="text-gray-600 text-xs">—</span>;
              }},
            { key: 'plans_count', label: 'Plans',
              render: (r) => {
                const count = [r.plans?.consultation, r.plans?.diet, r.plans?.fitness].filter(Boolean).length;
                return (
                  <span className={count === 3 ? 'text-green-400 text-xs' : 'text-yellow-400 text-xs'}>
                    {count} / 3
                  </span>
                );
              }},
            { key: 'pdfs',        label: 'PDFs',
              render: (r) => {
                const entries = [
                  { key: 'consultation', label: '📋', plan: r.plans?.consultation },
                  { key: 'diet',         label: '🥗', plan: r.plans?.diet },
                  { key: 'fitness',      label: '💪', plan: r.plans?.fitness },
                ];
                return (
                  <div className="flex gap-2">
                    {entries.map(({ key, label, plan }) => (
                      plan?.file_url
                        ? <a key={key} href={plan.file_url} target="_blank" rel="noreferrer"
                            className="text-blue-400 text-xs underline" title={key}>{label}</a>
                        : <span key={key} className="text-gray-600 text-xs" title={`${key} not ready`}>{label}</span>
                    ))}
                  </div>
                );
              }},
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
              }},
            { key: 'updated_at',  label: 'Last Update',
              render: (r) => r.updated_at ? new Date(r.updated_at).toLocaleString() : '—' },
          ]}
          data={chats}
        />
      )}

      {/* Streaks Tab */}
      {tab === 'streaks' && (
        <DataTable
          loading={false}
          columns={[
            { key: 'user',           label: 'User',
              render: (r) => r.user
                ? `${r.user.first_name ?? ''} ${r.user.last_name ?? ''}`.trim() || r.user.mobile || '—'
                : `User #${r.user_id}` },
            { key: 'current_streak', label: 'Current Streak',
              render: (r) => (
                <span className="text-orange-400 font-bold">
                  🔥 {r.current_streak ?? 0} days
                </span>
              )},
            { key: 'longest_streak', label: 'Longest Streak',
              render: (r) => `${r.longest_streak ?? 0} days` },
            { key: 'total_checkins', label: 'Total Checkins',
              render: (r) => r.total_checkins ?? 0 },
            { key: 'last_checkin',   label: 'Last Checkin',
              render: (r) => r.last_checkin_at
                ? new Date(r.last_checkin_at).toLocaleDateString()
                : '—' },
            { key: 'streak_status',  label: 'Status',
              render: (r) => {
                const active = (r.current_streak ?? 0) > 0;
                return (
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    active ? 'bg-green-900/40 text-green-400' : 'bg-gray-700 text-gray-400'
                  }`}>
                    {active ? 'Active' : 'Inactive'}
                  </span>
                );
              }},
          ]}
          data={streaks}
        />
      )}

      {/* 30-Day Summary Tab */}
      {tab === 'summary' && (
        <DataTable
          loading={false}
          columns={[
            { key: 'user',         label: 'User',
              render: (r) => r.user
                ? `${r.user.first_name ?? ''} ${r.user.last_name ?? ''}`.trim() || r.user.mobile || '—'
                : `User #${r.user_id}` },
            { key: 'checkin_days', label: 'Checkin Days',
              render: (r) => `${r.checkin_days ?? 0} / 30` },
            { key: 'avg_energy',   label: 'Avg Energy',
              render: (r) => r.avg_energy
                ? <span className="text-yellow-400">{r.avg_energy} / 10</span>
                : '—' },
            { key: 'avg_sleep',    label: 'Avg Sleep',
              render: (r) => r.avg_sleep ? `${r.avg_sleep}h` : '—' },
            { key: 'avg_water',    label: 'Avg Water',
              render: (r) => r.avg_water ? `${r.avg_water}L` : '—' },
            { key: 'avg_mood',     label: 'Avg Mood',
              render: (r) => r.avg_mood
                ? <span className="text-yellow-400">{Number(r.avg_mood).toFixed(1)} / 5</span>
                : '—' },
            { key: 'exercise_days', label: 'Exercise Days',
              render: (r) => `${r.exercise_days ?? 0} days` },
          ]}
          data={summary}
        />
      )}
    </div>
  );
}
