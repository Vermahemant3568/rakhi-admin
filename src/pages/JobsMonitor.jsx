import { useEffect, useState } from 'react';
import {
  getQueueJobs, getUserPlans,
  clearAllFailed, retryAllFailed, deleteFailedJob, regenerateUserPlans,
} from '../api/jobs';
import DataTable  from '../components/DataTable';
import PageHeader from '../components/PageHeader';

export default function JobsMonitor() {
  const [stats,      setStats]      = useState({ pending_count: 0, failed_count: 0, by_type: [] });
  const [pending,    setPending]    = useState([]);
  const [failed,     setFailed]     = useState([]);
  const [userPlans,  setUserPlans]  = useState([]);
  const [loadingJ,   setLoadingJ]   = useState(true);
  const [loadingP,   setLoadingP]   = useState(true);
  const [errorJ,     setErrorJ]     = useState('');
  const [errorP,     setErrorP]     = useState('');
  const [tab,        setTab]        = useState('failed');
  const [actionMsg,  setActionMsg]  = useState('');

  const loadJobs = () => {
    setLoadingJ(true);
    setErrorJ('');
    getQueueJobs()
      .then(r => {
        const d = r.data;
        setStats(d.stats ?? { pending_count: 0, failed_count: 0, by_type: [] });
        setPending(d.pending ?? []);
        setFailed(d.failed ?? []);
      })
      .catch(err => setErrorJ(err?.response?.data?.message ?? 'Failed to load jobs.'))
      .finally(() => setLoadingJ(false));
  };

  const loadUserPlans = () => {
    setLoadingP(true);
    setErrorP('');
    getUserPlans()
      .then(r => {
        const d = r.data;
        // backend returns { success, data: { data: [...], total, ... } }
        const list = d?.data?.data ?? d?.data ?? [];
        setUserPlans(Array.isArray(list) ? list : []);
      })
      .catch(err => setErrorP(err?.response?.data?.message ?? 'Failed to load user plans.'))
      .finally(() => setLoadingP(false));
  };

  useEffect(() => { loadJobs(); loadUserPlans(); }, []);

  const flash = (msg) => { setActionMsg(msg); setTimeout(() => setActionMsg(''), 3000); };

  const handleClearFailed = async () => {
    if (!confirm('Clear all failed jobs?')) return;
    try { const r = await clearAllFailed(); flash(r.data.message); loadJobs(); }
    catch { flash('Failed to clear jobs.'); }
  };

  const handleRetryAll = async () => {
    try { const r = await retryAllFailed(); flash(r.data.message); loadJobs(); }
    catch { flash('Failed to retry jobs.'); }
  };

  const handleDeleteFailed = async (id) => {
    try { await deleteFailedJob(id); loadJobs(); }
    catch { flash('Failed to delete job.'); }
  };

  const handleRegeneratePlans = async (userId, userName) => {
    if (!confirm(`Regenerate plans for ${userName}?`)) return;
    try { const r = await regenerateUserPlans(userId); flash(r.data.message); loadUserPlans(); }
    catch (err) { flash(err?.response?.data?.message ?? 'Failed to regenerate plans.'); }
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Jobs Monitor"
        subtitle="Track queue jobs and user plan generation"
        action={
          <button
            onClick={() => { loadJobs(); loadUserPlans(); }}
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg text-sm transition"
          >
            🔄 Refresh
          </button>
        }
      />

      {actionMsg && (
        <div className="px-4 py-3 bg-green-900/40 border border-green-700 rounded-lg text-green-400 text-sm">
          ✅ {actionMsg}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <p className="text-gray-500 text-xs">Pending Jobs</p>
          <p className="text-white text-2xl font-bold">{stats.pending_count}</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-red-900/40">
          <p className="text-red-400 text-xs">Failed Jobs</p>
          <p className="text-white text-2xl font-bold">{stats.failed_count}</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-purple-900/40">
          <p className="text-purple-400 text-xs">Total Plans</p>
          <p className="text-white text-2xl font-bold">{userPlans.length}</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-green-900/40">
          <p className="text-green-400 text-xs">Plans with PDF</p>
          <p className="text-white text-2xl font-bold">
            {userPlans.filter(p => p.file_url).length} / {userPlans.length}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-800">
        {[
          { key: 'failed',    label: `❌ Failed Jobs (${stats.failed_count})` },
          { key: 'pending',   label: `⏳ Pending Jobs (${stats.pending_count})` },
          { key: 'userplans', label: `📄 User Plans (${userPlans.length})` },
          { key: 'bytype',    label: '📊 By Type' },
        ].map(t => (
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

      {/* Error banners */}
      {errorJ && (
        <div className="px-4 py-3 bg-red-900/40 border border-red-700 rounded-lg text-red-400 text-sm flex justify-between">
          <span>⚠️ {errorJ}</span>
          <button onClick={loadJobs} className="underline text-xs">Retry</button>
        </div>
      )}

      {/* Failed Jobs Tab */}
      {tab === 'failed' && (
        <div className="space-y-3">
          {failed.length > 0 && (
            <div className="flex gap-2">
              <button onClick={handleRetryAll}
                className="bg-blue-800 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs">
                🔁 Retry All
              </button>
              <button onClick={handleClearFailed}
                className="bg-red-900 hover:bg-red-800 text-white px-3 py-1.5 rounded text-xs">
                🗑️ Clear All
              </button>
            </div>
          )}
          <DataTable
            loading={loadingJ}
            columns={[
              { key: 'id',                label: 'ID' },
              { key: 'job_name',          label: 'Job',
                render: r => <span className="text-purple-400 text-xs font-mono">{r.job_name?.split('\\').pop() ?? '—'}</span> },
              { key: 'queue',             label: 'Queue',
                render: r => <span className="text-gray-400 text-xs">{r.queue ?? '—'}</span> },
              { key: 'failed_at',         label: 'Failed At',
                render: r => r.failed_at ? new Date(r.failed_at).toLocaleString() : '—' },
              { key: 'exception_summary', label: 'Error',
                render: r => r.exception_summary
                  ? <span className="text-red-400 text-xs" title={r.exception_summary}>{r.exception_summary.substring(0, 80)}</span>
                  : <span className="text-gray-600 text-xs">—</span> },
              { key: 'actions',           label: '',
                render: r => (
                  <button onClick={() => handleDeleteFailed(r.id)}
                    className="text-red-500 hover:text-red-400 text-xs">Delete</button>
                )},
            ]}
            data={failed}
          />
        </div>
      )}

      {/* Pending Jobs Tab */}
      {tab === 'pending' && (
        <DataTable
          loading={loadingJ}
          columns={[
            { key: 'id',           label: 'ID' },
            { key: 'job_name',     label: 'Job',
              render: r => <span className="text-purple-400 text-xs font-mono">{r.job_name?.split('\\').pop() ?? '—'}</span> },
            { key: 'queue',        label: 'Queue',
              render: r => <span className="text-gray-400 text-xs">{r.queue ?? '—'}</span> },
            { key: 'attempts',     label: 'Attempts',
              render: r => <span className="text-yellow-400 text-xs">{r.attempts ?? 0}</span> },
            { key: 'available_at', label: 'Available At',
              render: r => r.available_at ?? '—' },
            { key: 'created_at',   label: 'Created',
              render: r => r.created_at ?? '—' },
          ]}
          data={pending}
        />
      )}

      {/* User Plans Tab */}
      {tab === 'userplans' && (
        <div>
          {errorP && (
            <div className="mb-4 px-4 py-3 bg-red-900/40 border border-red-700 rounded-lg text-red-400 text-sm flex justify-between">
              <span>⚠️ {errorP}</span>
              <button onClick={loadUserPlans} className="underline text-xs">Retry</button>
            </div>
          )}
          <DataTable
            loading={loadingP}
            columns={[
              { key: 'id',        label: 'ID' },
              { key: 'user',      label: 'User',
                render: r => r.user
                  ? `${r.user.first_name ?? ''} ${r.user.last_name ?? ''}`.trim() || r.user.mobile || '—'
                  : `User #${r.user_id}` },
              { key: 'plan_type', label: 'Type',
                render: r => (
                  <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${
                    r.plan_type === 'diet'         ? 'bg-green-900/40 text-green-400' :
                    r.plan_type === 'fitness'      ? 'bg-blue-900/40 text-blue-400' :
                    r.plan_type === 'consultation' ? 'bg-purple-900/40 text-purple-400' :
                    'bg-gray-700 text-gray-400'
                  }`}>{r.plan_type ?? '—'}</span>
                )},
              { key: 'file_url',  label: 'PDF',
                render: r => r.file_url
                  ? <a href={r.file_url} target="_blank" rel="noreferrer" className="text-blue-400 text-xs underline">View PDF</a>
                  : <span className="text-yellow-500 text-xs">⏳ Pending</span> },
              { key: 'coach',     label: 'Coach',
                render: r => r.coach?.name ?? '—' },
              { key: 'generated_at', label: 'Generated',
                render: r => r.generated_at ? new Date(r.generated_at).toLocaleDateString() : '—' },
              { key: 'actions',   label: '',
                render: r => (
                  <button
                    onClick={() => handleRegeneratePlans(r.user_id, r.user?.first_name ?? `User #${r.user_id}`)}
                    className="text-purple-400 hover:text-purple-300 text-xs whitespace-nowrap"
                  >
                    🔁 Regenerate
                  </button>
                )},
            ]}
            data={userPlans}
          />
        </div>
      )}

      {/* By Type Tab */}
      {tab === 'bytype' && (
        <div className="space-y-2">
          {loadingJ ? (
            <p className="text-gray-500 text-sm">Loading...</p>
          ) : stats.by_type?.length === 0 ? (
            <p className="text-gray-500 text-sm">No pending jobs.</p>
          ) : (
            stats.by_type?.map((t, i) => (
              <div key={i} className="flex items-center justify-between bg-gray-900 rounded-lg px-4 py-3 border border-gray-800">
                <span className="text-purple-400 text-sm font-mono">{t.job_name?.split('\\').pop() ?? t.job_name}</span>
                <span className="text-white font-bold text-sm">{t.count}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
