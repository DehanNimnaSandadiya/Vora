// Extended API functions for new features
import api from './api';

// Friends API
export const friendsApi = {
  getFriends: () => api.get('/friends'),
  getRequests: () => api.get('/friends/requests'),
  sendRequest: (data: { userId?: string; email?: string }) => api.post('/friends/request', data),
  acceptRequest: (userId: string) => api.post('/friends/accept', { userId }),
  rejectRequest: (userId: string) => api.post('/friends/reject', { userId }),
  removeFriend: (userId: string) => api.post('/friends/remove', { userId }),
  searchUsers: (query: string) => api.get('/friends/search', { params: { q: query } }),
};

// Presets API
export const presetsApi = {
  getAll: () => api.get('/presets'),
  create: (data: {
    name: string;
    focusMinutes: number;
    breakMinutes: number;
    longBreakMinutes?: number;
    cycles?: number;
    isDefault?: boolean;
  }) => api.post('/presets', data),
  update: (id: string, data: Partial<{
    name: string;
    focusMinutes: number;
    breakMinutes: number;
    longBreakMinutes?: number;
    cycles?: number;
    isDefault?: boolean;
  }>) => api.patch(`/presets/${id}`, data),
  delete: (id: string) => api.delete(`/presets/${id}`),
  setDefault: (id: string) => api.post(`/presets/${id}/default`),
};

// Sessions API
export const sessionsApi = {
  start: (data: { roomId?: string; mode: 'focus' | 'break'; source: 'pomodoro' | 'manual' }) =>
    api.post('/sessions/start', data),
  end: (sessionId?: string) => api.post('/sessions/end', { sessionId }),
  getSummary: (range: '7d' | '30d' = '7d') => api.get('/sessions/summary', { params: { range } }),
  export: (range: '7d' | '30d' = '30d') => 
    api.get('/sessions/export', { params: { range }, responseType: 'blob' }),
};

// Notifications API
export const notificationsApi = {
  getAll: (params?: { limit?: number; unreadOnly?: boolean }) =>
    api.get('/notifications', { params }),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

// Analytics API
export const analyticsApi = {
  getMe: (range: '7d' | '30d' = '30d') => api.get('/analytics/me', { params: { range } }),
  getLeaderboard: () => api.get('/analytics/leaderboard'),
};

// Room Invites API
export const roomInvitesApi = {
  createLink: (roomId: string) => api.post(`/rooms/${roomId}/invites/link`),
  createEmail: (roomId: string, email: string) =>
    api.post(`/rooms/${roomId}/invites/email`, { email }),
  joinWithToken: (token: string) => api.post('/rooms/joinWithInvite', { token }),
};

// Task Comments API
export const taskCommentsApi = {
  getComments: (taskId: string) => api.get(`/tasks/${taskId}/comments`),
  createComment: (taskId: string, text: string) =>
    api.post(`/tasks/${taskId}/comments`, { text }),
};

// Task Templates API
export const taskTemplatesApi = {
  getAll: () => api.get('/task-templates'),
  create: (data: { name: string; tasks: Array<{ text: string; priority?: string; tags?: string[] }> }) =>
    api.post('/task-templates', data),
  applyToRoom: (roomId: string, templateId: string) =>
    api.post(`/task-templates/rooms/${roomId}/from-template`, { templateId }),
};

// Messages API
export const messagesApi = {
  pin: (messageId: string) => api.patch(`/messages/${messageId}/pin`),
  delete: (messageId: string) => api.patch(`/messages/${messageId}/delete`),
  react: (messageId: string, emoji: string) => api.post(`/messages/${messageId}/react`, { emoji }),
};

// Users API (extended)
export const usersApi = {
  getMe: () => api.get('/users/me'),
  updateMe: (data: Partial<{
    name: string;
    bio: string;
    university: string;
    timezone: string;
    language: 'en' | 'si' | 'ta';
    avatarUrl: string;
    preferences: any;
  }>) => api.patch('/users/me', data),
};

// Rooms API (extended)
export const roomsApi = {
  update: (roomId: string, data: Partial<{
    name: string;
    description: string;
    goal: string;
    pinnedNotes: string;
    isPrivate: boolean;
    schedule: any;
  }>) => api.patch(`/rooms/${roomId}`, data),
  updateRole: (roomId: string, userId: string, role: 'owner' | 'moderator' | 'member') =>
    api.post(`/rooms/${roomId}/role`, { userId, role }),
  muteUser: (roomId: string, userId: string, minutes: number) =>
    api.post(`/rooms/${roomId}/mute`, { userId, minutes }),
};

// Tasks API (extended)
export const tasksApi = {
  update: (roomId: string, taskId: string, data: Partial<{
    text: string;
    status: 'todo' | 'doing' | 'done';
    assignedTo: string;
    dueDate: string;
    priority: 'low' | 'medium' | 'high';
    tags: string[];
  }>) => api.patch(`/rooms/${roomId}/tasks/${taskId}`, data),
};

