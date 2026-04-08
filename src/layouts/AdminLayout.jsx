import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import useAuthStore from '../store/authStore';

const navItems = [
  { label: 'Dashboard',      path: '/dashboard' },
  { label: 'Coaches',        path: '/coaches' },
  { label: 'Goals',          path: '/goals' },
  { label: 'Languages',      path: '/languages' },
  { label: 'Prompts',        path: '/prompts' },
  { label: 'Rules',          path: '/rules' },
  { label: 'LLM Config',     path: '/llm-config' },
  { label: 'API Manager',    path: '/api-manager' },
  { label: 'Plans',          path: '/plans' },
  { label: 'Finance',        path: '/finance' },
  { label: 'Jobs Monitor',   path: '/jobs' },
  { label: 'Progress',       path: '/progress' },
  { label: 'Knowledge Base', path: '/knowledge' },
  { label: 'Users',          path: '/users' },
];

export default function AdminLayout() {
  const { admin, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post('/logout');
    } finally {
      logout();
      navigate('/login');
    }
  };

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">

      {/* Sidebar */}
      <aside className="w-60 bg-gray-900 flex flex-col shrink-0">
        <div className="p-5 border-b border-gray-800">
          <h1 className="text-lg font-bold text-purple-400">Rakhi Admin</h1>
          <p className="text-xs text-gray-500 mt-1 truncate">{admin?.email}</p>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 space-y-1 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `block px-4 py-2.5 rounded-lg text-sm transition
                ${isActive
                  ? 'bg-purple-600 text-white font-semibold'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="w-full text-sm text-gray-400 hover:text-red-400 transition text-left px-4 py-2"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gray-950">
        <Outlet />
      </main>

    </div>
  );
}
