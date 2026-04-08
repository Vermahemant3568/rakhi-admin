import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import AdminLayout from '../layouts/AdminLayout';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import ApiManager from '../pages/ApiManager';
import LLMConfig from '../pages/LLMConfig';
import Coaches from '../pages/Coaches';
import Prompts from '../pages/Prompts';
import Rules from '../pages/Rules';
import Goals from '../pages/Goals';
import Languages from '../pages/Languages';
import Plans from '../pages/Plans';
import KnowledgeBase from '../pages/KnowledgeBase';
import Users from '../pages/Users';
import Finance from '../pages/Finance';
import JobsMonitor from '../pages/JobsMonitor';
import ProgressMonitor from '../pages/ProgressMonitor';

function Protected({ children }) {
  const { token } = useAuthStore();
  return token ? children : <Navigate to="/login" />;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <Protected>
            <AdminLayout />
          </Protected>
        }>
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard"   element={<Dashboard />} />
          <Route path="api-manager" element={<ApiManager />} />
          <Route path="llm-config"  element={<LLMConfig />} />
          <Route path="coaches"     element={<Coaches />} />
          <Route path="prompts"     element={<Prompts />} />
          <Route path="rules"       element={<Rules />} />
          <Route path="goals"       element={<Goals />} />
          <Route path="languages"   element={<Languages />} />
          <Route path="plans"       element={<Plans />} />
          <Route path="knowledge"   element={<KnowledgeBase />} />
          <Route path="finance"      element={<Finance />} />
          <Route path="jobs"         element={<JobsMonitor />} />
          <Route path="progress"     element={<ProgressMonitor />} />
          <Route path="users"        element={<Users />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
