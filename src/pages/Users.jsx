import { useEffect, useState } from 'react';
import { getUsers, banUser, unbanUser, getUser, getUserChats, getUserPlans, getUserMeals } from '../api/users';
import DataTable  from '../components/DataTable';
import Modal      from '../components/Modal';
import PageHeader from '../components/PageHeader';

const TABS = ['Profile', 'Plans', 'Chats', 'Meals'];

function InfoCard({ label, value }) {
  return (
    <div className="bg-gray-800/60 rounded-xl p-3 border border-gray-700/50">
      <p className="text-gray-500 text-xs mb-1">{label}</p>
      <p className="text-white text-sm font-medium">{value || '—'}</p>
    </div>
  );
}

export default function Users() {
  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);
  const [detail,   setDetail]   = useState(null);
  const [search,   setSearch]   = useState('');
  const [tab,      setTab]      = useState('Profile');
  const [tabData,  setTabData]  = useState({});
  const [tabLoad,  setTabLoad]  = useState(false);

  const load = () => {
    setLoading(true);
    getUsers({ search }).then(r => {
      setUsers(r.data.data ?? r.data);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, [search]);

  const openDetail = async (user) => {
    setSelected(user);
    setTab('Profile');
    setTabData({});
    const res = await getUser(user.id);
    setDetail(res.data?.data ?? res.data);
  };

  const closeDetail = () => { setSelected(null); setDetail(null); setTabData({}); };

  const loadTab = async (t, userId) => {
    if (tabData[t]) return;
    setTabLoad(true);
    try {
      let res;
      if (t === 'Plans') res = await getUserPlans(userId);
      if (t === 'Chats') res = await getUserChats(userId);
      if (t === 'Meals') res = await getUserMeals(userId);
      const d = res.data?.data ?? res.data;
      console.log(`${t} raw:`, JSON.stringify(res.data));
      setTabData(prev => ({ ...prev, [t]: Array.isArray(d) ? d : [] }));
    } catch { setTabData(prev => ({ ...prev, [t]: [] })); }
    finally { setTabLoad(false); }
  };

  const switchTab = (t) => {
    setTab(t);
    if (t !== 'Profile' && selected) loadTab(t, selected.id);
  };

  const handleBan = async (user) => {
    if (!window.confirm(`${user.is_banned ? 'Unban' : 'Ban'} this user?`)) return;
    user.is_banned ? await unbanUser(user.id) : await banUser(user.id);
    load();
    closeDetail();
  };

  const fullName = (u) => `${u?.first_name ?? ''} ${u?.last_name ?? ''}`.trim() || '—';
  const avatar   = (u) => (u?.first_name?.[0] ?? u?.mobile?.[0] ?? '?').toUpperCase();

  return (
    <div className="p-6">
      <PageHeader title="Users" subtitle="View and manage all Rakhi users" />

      <div className="mb-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or mobile..."
          className="bg-gray-800 text-white px-4 py-2.5 rounded-lg border border-gray-700 text-sm w-full max-w-sm outline-none focus:border-purple-500"
        />
      </div>

      <DataTable
        loading={loading}
        columns={[
          { key: 'name', label: 'User',
            render: (r) => (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {avatar(r)}
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{fullName(r)}</p>
                  <p className="text-gray-500 text-xs">{r.mobile}</p>
                </div>
              </div>
            )
          },
          { key: 'onboarding_complete', label: 'Onboarded',
            render: (r) => r.onboarding_complete
              ? <span className="text-green-400 text-xs">✅ Yes</span>
              : <span className="text-yellow-400 text-xs">⏳ No</span>
          },
          { key: 'is_banned', label: 'Status',
            render: (r) => r.is_banned
              ? <span className="bg-red-900/40 text-red-400 text-xs px-2 py-1 rounded-full">Banned</span>
              : <span className="bg-green-900/40 text-green-400 text-xs px-2 py-1 rounded-full">Active</span>
          },
          { key: 'created_at', label: 'Joined',
            render: (r) => new Date(r.created_at).toLocaleDateString()
          },
          { key: 'actions', label: '',
            render: (r) => (
              <button
                onClick={() => openDetail(r)}
                className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg transition"
              >
                View Profile
              </button>
            )
          },
        ]}
        data={users}
      />

      {/* Profile Modal */}
      <Modal isOpen={!!selected} onClose={closeDetail} title="" size="xl">
        {!detail ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="-mt-2">
            {/* Header */}
            <div className="flex items-center gap-4 mb-5 pb-5 border-b border-gray-800">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                {avatar(detail)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold text-lg">{fullName(detail)}</h3>
                <p className="text-gray-400 text-sm">{detail.mobile}</p>
                <div className="flex gap-2 mt-1.5 flex-wrap">
                  {detail.is_banned
                    ? <span className="bg-red-900/40 text-red-400 text-xs px-2 py-0.5 rounded-full">Banned</span>
                    : <span className="bg-green-900/40 text-green-400 text-xs px-2 py-0.5 rounded-full">Active</span>
                  }
                  {detail.onboarding_complete &&
                    <span className="bg-blue-900/40 text-blue-400 text-xs px-2 py-0.5 rounded-full">Onboarded</span>
                  }
                  {detail.subscription &&
                    <span className="bg-yellow-900/40 text-yellow-400 text-xs px-2 py-0.5 rounded-full capitalize">
                      {detail.subscription.status}
                    </span>
                  }
                </div>
              </div>
              <button
                onClick={() => handleBan(selected)}
                className={`text-xs px-3 py-1.5 rounded-lg transition flex-shrink-0 ${
                  selected?.is_banned
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {selected?.is_banned ? 'Unban' : 'Ban'}
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-4 bg-gray-800/50 p-1 rounded-lg">
              {TABS.map(t => (
                <button
                  key={t}
                  onClick={() => switchTab(t)}
                  className={`flex-1 text-xs py-1.5 rounded-md transition font-medium ${
                    tab === t
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {tab === 'Profile' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ['Gender',   detail.gender],
                    ['DOB',      detail.date_of_birth ? new Date(detail.date_of_birth).toLocaleDateString() : null],
                    ['Weight',   detail.weight ? `${detail.weight} kg` : null],
                    ['Height',   detail.height ? `${detail.height} cm` : null],
                    ['Language', detail.language?.name ?? detail.language ?? detail.preferred_language],
                    ['Diet',     detail.diet_preference ?? detail.dietary_preference ?? detail.diet],
                    ['Joined',   new Date(detail.created_at).toLocaleDateString()],
                    ['ID',       `#${detail.id}`],
                  ].map(([label, value]) => <InfoCard key={label} label={label} value={value} />)}
                </div>
                {detail.goals?.length > 0 && (
                  <div>
                    <p className="text-gray-500 text-xs mb-2">Goals</p>
                    <div className="flex flex-wrap gap-2">
                      {detail.goals.map(g => (
                        <span key={g.id} className="bg-purple-900/40 text-purple-300 px-2.5 py-1 rounded-full text-xs">
                          {g.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {detail.subscription && (
                  <div className="bg-yellow-900/20 border border-yellow-800/50 rounded-xl p-3">
                    <p className="text-yellow-400 text-xs font-medium mb-1">Subscription</p>
                    <p className="text-white text-sm capitalize">{detail.subscription.status}</p>
                    {detail.subscription.ends_at && (
                      <p className="text-gray-400 text-xs mt-0.5">
                        Expires {new Date(detail.subscription.ends_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {tab !== 'Profile' && (
              tabLoad ? (
                <div className="flex justify-center py-8">
                  <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : !tabData[tab]?.length ? (
                <p className="text-center text-gray-500 text-sm py-8">No {tab.toLowerCase()} found</p>
              ) : tab === 'Plans' ? (
                <div className="space-y-2">
                  {tabData.Plans.map((p, i) => (
                    <div key={i} className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-white text-sm font-medium">{p.name ?? p.title ?? `Plan #${p.id}`}</p>
                          {p.coach?.name && <p className="text-purple-400 text-xs mt-0.5">Coach: {p.coach.name}</p>}
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          p.status === 'active' ? 'bg-green-900/40 text-green-400' : 'bg-gray-700 text-gray-400'
                        }`}>{p.status ?? 'N/A'}</span>
                      </div>
                      {p.ends_at && <p className="text-gray-500 text-xs mt-1">Expires {new Date(p.ends_at).toLocaleDateString()}</p>}
                    </div>
                  ))}
                </div>
              ) : tab === 'Chats' ? (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {tabData.Chats.map((c, i) => (
                    <div key={i} className={`rounded-xl p-3 text-sm ${
                      c.role === 'user' ? 'bg-purple-900/30 ml-8' : 'bg-gray-800/60 mr-8'
                    }`}>
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-xs text-gray-500 capitalize">
                          {c.role === 'user' ? '👤 User' : `🤖 ${c.coach?.name ?? 'Coach'}`}
                        </p>
                        {c.created_at && <p className="text-xs text-gray-600">{new Date(c.created_at).toLocaleString()}</p>}
                      </div>
                      <p className="text-gray-300">{c.message ?? c.content}</p>
                    </div>
                  ))}
                </div>
              ) : tab === 'Meals' ? (
                <div className="space-y-2">
                  {tabData.Meals.map((m, i) => (
                    <div key={i} className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-3 flex justify-between items-center">
                      <div>
                        <p className="text-white text-sm font-medium">{m.meal_name ?? m.name ?? `Meal #${m.id}`}</p>
                        <p className="text-gray-500 text-xs mt-0.5">{m.logged_at ? new Date(m.logged_at).toLocaleDateString() : ''}</p>
                      </div>
                      {m.calories && <span className="text-yellow-400 text-xs">{m.calories} kcal</span>}
                    </div>
                  ))}
                </div>
              ) : null
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
