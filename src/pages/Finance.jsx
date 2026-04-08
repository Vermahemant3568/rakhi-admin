import { useEffect, useState } from 'react';
import { getFinance } from '../api/finance';
import { getPlans }   from '../api/plans';
import StatCard  from '../components/StatCard';
import DataTable from '../components/DataTable';
import PageHeader from '../components/PageHeader';

export default function Finance() {
  const [data,    setData]    = useState(null);
  const [plans,   setPlans]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    Promise.all([
      getFinance(),
      getPlans().catch(() => ({ data: [] })),
    ]).then(([f, p]) => {
      console.log('finance raw:', JSON.stringify(f.data, null, 2));
      setData(f.data?.data ?? f.data);
      setPlans(Array.isArray(p.data) ? p.data : (p.data?.data ?? []));
    }).catch(err => {
      setError(err?.response?.data?.message ?? 'Failed to load finance data.');
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

  const revenue      = data?.revenue      ?? {};
  const subs         = data?.subscriptions ?? {};
  const recentSubs   = data?.recent_subscriptions ?? [];
  const planBreakdown= data?.plan_breakdown ?? [];

  const statCards = [
    { title: 'Total Revenue',       value: `₹${revenue.total        ?? 0}`, icon: '💰', color: 'bg-green-900/40'  },
    { title: 'This Month',          value: `₹${revenue.this_month   ?? 0}`, icon: '📈', color: 'bg-teal-900/40'   },
    { title: 'Last Month',          value: `₹${revenue.last_month   ?? 0}`, icon: '📉', color: 'bg-blue-900/40'   },
    { title: 'Today',               value: `₹${revenue.today        ?? 0}`, icon: '🗓️', color: 'bg-indigo-900/40' },
    { title: 'Active Subs',         value: subs.active    ?? 0,             icon: '💎', color: 'bg-purple-900/40' },
    { title: 'Trial Subs',          value: subs.trial     ?? 0,             icon: '🎯', color: 'bg-orange-900/40' },
    { title: 'Expired Subs',        value: subs.expired   ?? 0,             icon: '⏰', color: 'bg-red-900/40'    },
    { title: 'Cancelled Subs',      value: subs.cancelled ?? 0,             icon: '🚫', color: 'bg-gray-700'      },
  ];

  return (
    <div className="p-6 space-y-8">
      <PageHeader
        title="Finance & Revenue"
        subtitle="Track revenue, subscriptions and plan performance"
        action={
          <button onClick={load} className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg text-sm transition">
            🔄 Refresh
          </button>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(card => (
          <StatCard key={card.title} title={card.title} value={card.value} icon={card.icon} color={card.color} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Plan Breakdown */}
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
          <p className="text-gray-300 font-semibold mb-4">📊 Revenue by Plan</p>
          {planBreakdown.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No plan data available.</p>
          ) : (
            <div className="space-y-3">
              {planBreakdown.map((p, i) => {
                const total = planBreakdown.reduce((sum, x) => sum + (x.revenue ?? 0), 0);
                const pct   = total > 0 ? Math.round((p.revenue / total) * 100) : 0;
                return (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">{p.plan_name ?? p.name ?? `Plan ${i + 1}`}</span>
                      <span className="text-white font-medium">₹{p.revenue ?? 0}
                        <span className="text-gray-500 ml-2 text-xs">({p.count ?? 0} users)</span>
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-1.5">
                      <div
                        className="bg-purple-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Active Plans Summary */}
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
          <p className="text-gray-300 font-semibold mb-4">💳 Active Plans</p>
          {plans.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No plans configured.</p>
          ) : (
            <div className="space-y-3">
              {plans.map(plan => (
                <div key={plan.id} className="bg-gray-800 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-medium">{plan.name}</p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {plan.duration_days} days · {plan.trial_days} day trial
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">₹{plan.price}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      plan.is_active ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'
                    }`}>
                      {plan.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Recent Subscriptions */}
      <div>
        <p className="text-gray-300 font-semibold mb-4">🧾 Recent Subscriptions</p>
        <DataTable
          loading={false}
          columns={[
            { key: 'user',       label: 'User',
              render: (r) => r.user
                ? `${r.user.first_name ?? ''} ${r.user.last_name ?? ''}`.trim() || r.user.mobile || '—'
                : '—'
            },
            { key: 'plan',       label: 'Plan',
              render: (r) => r.plan?.name ?? '—' },
            { key: 'status',     label: 'Status',
              render: (r) => {
                const colors = {
                  active:    'bg-green-900/40 text-green-400',
                  trial:     'bg-blue-900/40 text-blue-400',
                  expired:   'bg-red-900/40 text-red-400',
                  cancelled: 'bg-gray-700 text-gray-400',
                };
                return (
                  <span className={`px-2 py-1 rounded-full text-xs ${colors[r.status] ?? 'bg-gray-700 text-gray-400'}`}>
                    {r.status}
                  </span>
                );
              }
            },
            { key: 'amount',     label: 'Amount',
              render: (r) => r.amount ? `₹${r.amount}` : '—' },
            { key: 'starts_at',  label: 'Started',
              render: (r) => r.starts_at ? new Date(r.starts_at).toLocaleDateString() : '—' },
            { key: 'ends_at',    label: 'Expires',
              render: (r) => r.ends_at ? new Date(r.ends_at).toLocaleDateString() : '—' },
          ]}
          data={recentSubs}
        />
      </div>
    </div>
  );
}
