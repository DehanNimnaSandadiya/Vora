import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  avatarUrl?: string | null;
  bio?: string;
  university: string | null;
  timezone?: string;
  language?: 'en' | 'si' | 'ta';
  preferences?: {
    theme?: 'dark' | 'light' | 'system';
    notifications?: {
      inApp?: boolean;
      email?: boolean;
      push?: boolean;
    };
    focus?: {
      dailyGoalMinutes?: number;
      defaultPresetId?: string | null;
      focusModeEnabled?: boolean;
      distractionBlockerEnabled?: boolean;
    };
  };
  stats?: {
    streakCount?: number;
    lastGoalMetDate?: string | null;
  };
  provider: 'local' | 'google';
  role?: 'user' | 'admin';
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  role: 'user' | 'admin' | null;
  login: (email: string, password: string) => Promise<'user' | 'admin'>;
  register: (name: string, email: string, password: string, university?: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        fetchUser();
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const fetchUser = async () => {
    try {
      const response = await api.get('/auth/me');
      const userData = response.data.user;
      const userWithRole = { ...userData, role: userData.role || 'user' };
      setUser(userWithRole);
      localStorage.setItem('user', JSON.stringify(userWithRole));
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  const login = async (email: string, password: string): Promise<'user' | 'admin'> => {
    const response = await api.post('/auth/login', { email, password });
    const { token, user: userData, role } = response.data;
    localStorage.setItem('token', token);
    const userWithRole = { ...userData, role: role || userData.role || 'user' };
    localStorage.setItem('user', JSON.stringify(userWithRole));
    setUser(userWithRole);
    return (role || userData.role || 'user') as 'user' | 'admin';
  };

  const register = async (name: string, email: string, password: string, university?: string) => {
    const response = await api.post('/auth/register', { name, email, password, university });
    const { token, user: userData, role } = response.data;
    localStorage.setItem('token', token);
    const userWithRole = { ...userData, role: role || userData.role || 'user' };
    localStorage.setItem('user', JSON.stringify(userWithRole));
    setUser(userWithRole);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const role = user?.role || null;

  return (
    <AuthContext.Provider value={{ user, loading, role, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

