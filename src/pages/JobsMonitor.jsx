import { useEffect, useState } from 'react';
import { getQueueJobs, getUserPlans } from '../api/jobs';
import DataTable  from '../components/DataTable';
import PageHeader from '../components/PageHeader';

const STATUS_COLORS = {
  pending:    'bg-yellow-900/40 text-yellow-400',
  processing: 'bg-blue-900/40 text-blue-400',
  completed:  'bg-green-900/40 text-green-400',
  failed:     'bg-red-900/40 text-red-400',
};

export default function JobsMonitor() {
  const [jobs,       setJobs]       = useState([]);
  const [userPlans,  setUserPlans]  = useState([]);
  const [loadingJ,   setLoadingJ]   = useState(true);
  const [loadingP,   setLoadingP]   = useState(true);
  const [errorJ,     setErrorJ]     = useState('');
  const [errorP,     setErrorP]     = useState('');
  const [tab,        setTab]        = useState('jobs');

  const loadJobs = () => {
    setLoadingJ(true);
    setErrorJ('');
    getQueueJobs()
      .then(r => setJobs(Array.isArray(r.data) ? r.data : (r.data?.data ?? [])))
      .catch(err => setErrorJ(err?.response?.data?.message ?? 'Failed to load queue jobs.'))
      .finally(() => setLoadingJ(false));
  };

  const loadUserPlans = () => {
    setLoadingP(true);
    setErrorP('');
    getUserPlans()
      .then(r => setUserPlans(Array.isArray(r.data) ? r.data : (r.data?.data ?? [])))
      .catch(err => setErrorP(err?.response?.data?.message ?? 'Failed to load user plans.'))
      .finally(() => setLoadingP(false));
  };

  useEffect(() => {
    loadJobs();
    loadUserPlans();
  }, []);

  const jobStats = {
    total:      jobs.length,
    pending:    jobs.filter(j => j.status === 'pending').length,
    processing: jobs.filter(j => j.status === 'processing').length,
    failed:     jobs.filter(j => j.status === 'failed').length,
    completed:  jobs.filter(j => j.status === 'completed').length,
  };

  const pdfStats = {
    total:     userPlans.length,
    generated: userPlans.filter(p => p.pdf_url || p.pdf_generated).length,
    pending:   userPlans.filter(p => !p.pdf_url && !p.pdf_generated).length,
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Jobs Monitor"
        subtitle="Track queue jobs and user plan PDF generation"
        action={
          <button
            onClick={() => { loadJobs(); loadUserPlans(); }}
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg text-sm transition"
          >
            🔄 Refresh
          </button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <p className="text-gray-500 text-xs">Total Jobs</p>
          <p className="text-white text-2xl font-bold">{jobStats.total}</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-yellow-900/40">
          <p className="text-yellow-400 text-xs">Pending Jobs</p>
          <p className="text-white text-2xl font-bold">{jobStats.pending}</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-red-900/40">
          <p className="text-red-400 text-xs">Failed Jobs</p>
          <p className="text-white text-2xl font-bold">{jobStats.failed}</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-green-900/40">
          <p className="text-green-400 text-xs">PDFs Generated</p>
          <p className="text-white text-2xl font-bold">{pdfStats.generated} / {pdfStats.total}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-800">
        {[
          { key: 'jobs',      label: `🗂️ Queue Jobs (${jobStats.total})` },
          { key: 'userplans', label: `📄 User Plans / PDFs (${pdfStats.total})` },
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

      {/* Queue Jobs Tab */}
      {tab === 'jobs' && (
        <div>
          {errorJ && (
            <div className="mb-4 px-4 py-3 bg-red-900/40 border border-red-700 rounded-lg text-red-400 text-sm flex justify-between">
              <span>⚠️ {errorJ}</span>
              <button onClick={loadJobs} className="underline text-xs">Retry</button>
            </div>
          )}
          <DataTable
            loading={loadingJ}
            columns={[
              { key: 'id',         label: 'ID' },
              { key: 'queue',      label: 'Queue',
                render: (r) => <span className="text-purple-400 text-xs font-mono">{r.queue ?? '—'}</span> },
              { key: 'payload',    label: 'Job',
                render: (r) => {
                  try {
                    const p = typeof r.payload === 'string' ? JSON.parse(r.payload) : r.payload;
                    return <span className="text-gray-300 text-xs font-mono">{p?.displayName ?? p?.job ?? r.job ?? '—'}</span>;
                  } catch { return <span className="text-gray-500 text-xs">—</span>; }
                }
              },
              { key: 'status',     label: 'Status',
                render: (r) => (
                  <span className={`px-2 py-1 rounded-full text-xs ${STATUS_COLORS[r.status] ?? 'bg-gray-700 text-gray-400'}`}>
                    {r.status ?? 'queued'}
                  </span>
                )
              },
              { key: 'attempts',   label: 'Attempts',
                render: (r) => r.attempts ?? 0 },
              { key: 'exception',  label: 'Error',
                render: (r) => r.exception
                  ? <span className="text-red-400 text-xs truncate max-w-xs block" title={r.exception}>{r.exception.substring(0, 60)}...</span>
                  : <span className="text-gray-600 text-xs">—</span>
              },
              { key: 'created_at', label: 'Created',
                render: (r) => r.created_at ? new Date(r.created_at).toLocaleString() : '—' },
            ]}
            data={jobs}
          />
        </div>
      )}

      {/* User Plans / PDFs Tab */}
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
              { key: 'id',           label: 'ID' },
              { key: 'user',         label: 'User',
                render: (r) => r.user
                  ? `${r.user.first_name ?? ''} ${r.user.last_name ?? ''}`.trim() || r.user.mobile || '—'
                  : r.user_id ?? '—'
              },
              { key: 'plan_type',    label: 'Plan Type',
                render: (r) => (
                  <span className="text-purple-400 text-xs capitalize">{r.plan_type ?? r.type ?? '—'}</span>
                )
              },
              { key: 'pdf_status',   label: 'PDF Status',
                render: (r) => {
                  const generated = r.pdf_url || r.pdf_generated;
                  return (
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      generated ? 'bg-green-900/40 text-green-400' : 'bg-yellow-900/40 text-yellow-400'
                    }`}>
                      {generated ? '✅ Generated' : '⏳ Pending'}
                    </span>
                  );
                }
              },
              { key: 'pdf_url',      label: 'PDF Link',
                render: (r) => r.pdf_url
                  ? <a href={r.pdf_url} target="_blank" rel="noreferrer" className="text-blue-400 text-xs underline">View PDF</a>
                  : <span className="text-gray-600 text-xs">—</span>
              },
              { key: 'coach',        label: 'Coach',
                render: (r) => r.coach?.name ?? '—' },
              { key: 'created_at',   label: 'Created',
                render: (r) => r.created_at ? new Date(r.created_at).toLocaleDateString() : '—' },
            ]}
            data={userPlans}
          />
        </div>
      )}
    </div>
  );
}
