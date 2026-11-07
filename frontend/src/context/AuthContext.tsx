import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/index.js';
import { api } from '../services/api.js';
import { socketService } from '../services/socket.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; role?: string }) => Promise<void>;
  logout: () => void;
  switchDemoUser: (userId: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('taskflow_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('taskflow_token');
      if (storedToken) {
        try {
          const res = await api.getMe();
          setUser(res.user);
          socketService.connect();
          socketService.joinUser(res.user._id);
        } catch (err) {
          console.warn('[Auth] Stored token invalid or server waking up, attempting demo sign in...');
          try {
            // Auto switch to Sarah Connor demo user if token is stale
            const demoRes = await api.demoSwitch('usr_sarah_1');
            localStorage.setItem('taskflow_token', demoRes.token);
            setToken(demoRes.token);
            setUser(demoRes.user);
            socketService.connect();
            socketService.joinUser(demoRes.user._id);
          } catch (e) {
            localStorage.removeItem('taskflow_token');
            setToken(null);
            setUser(null);
          }
        }
      } else {
        // Automatically default to Sarah Connor for immediate zero-barrier evaluation!
        try {
          const demoRes = await api.demoSwitch('usr_sarah_1');
          localStorage.setItem('taskflow_token', demoRes.token);
          setToken(demoRes.token);
          setUser(demoRes.user);
          socketService.connect();
          socketService.joinUser(demoRes.user._id);
        } catch (e) {
          // Server might be offline or starting
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.login(email, password);
      localStorage.setItem('taskflow_token', res.token);
      setToken(res.token);
      setUser(res.user);
      socketService.connect();
      socketService.joinUser(res.user._id);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: { name: string; email: string; password: string; role?: string }) => {
    setIsLoading(true);
    try {
      const res = await api.register(data);
      localStorage.setItem('taskflow_token', res.token);
      setToken(res.token);
      setUser(res.user);
      socketService.connect();
      socketService.joinUser(res.user._id);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('taskflow_token');
    setToken(null);
    setUser(null);
    socketService.disconnect();
  };

  const switchDemoUser = async (userId: string) => {
    setIsLoading(true);
    try {
      const res = await api.demoSwitch(userId);
      localStorage.setItem('taskflow_token', res.token);
      setToken(res.token);
      setUser(res.user);
      socketService.connect();
      socketService.joinUser(res.user._id);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    const res = await api.updateMe(data);
    setUser(res.user);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        switchDemoUser,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
