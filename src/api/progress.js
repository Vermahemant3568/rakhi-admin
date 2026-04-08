import api from './axios';
export const getProgressOverview = () => api.get('/progress/overview');
export const getUserStreaks      = () => api.get('/progress/streaks');
export const getProgressSummary  = () => api.get('/progress/summary');
export const getChatActivity     = () => api.get('/progress/chat-activity');
