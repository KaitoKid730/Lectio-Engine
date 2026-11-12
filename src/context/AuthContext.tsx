import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '../types';
import { apiClient, ApiError } from '../utils/apiClient';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  studentLogin: (accessCode: string, studentId: string, pin: string) => Promise<void>;
  logout: () => Promise<void>;
  switchPersona: (role: UserRole) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrentUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const userData = await apiClient.get<User>('/api/auth/me');
      setUser(userData);
    } catch (err: any) {
      if (err instanceof ApiError && err.statusCode === 401) {
        localStorage.removeItem('lectio_session_id');
        setUser(null);
      } else {
        setError(err.message || 'Failed to authenticate user.');
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.post<{ user: User; sessionId?: string }>('/api/auth/login', {
        email,
        password,
      });
      if (res.sessionId) {
        localStorage.setItem('lectio_session_id', res.sessionId);
      }
      setUser(res.user);
    } catch (err: any) {
      const errorMsg = err.message || 'Login failed. Please check your credentials.';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const studentLogin = async (accessCode: string, studentId: string, pin: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.post<{ user: User; sessionId?: string }>('/api/auth/student-login', {
        accessCode,
        studentId,
        pin,
      });
      if (res.sessionId) {
        localStorage.setItem('lectio_session_id', res.sessionId);
      }
      setUser(res.user);
    } catch (err: any) {
      const errorMsg = err.message || 'Student login failed.';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await apiClient.post('/api/auth/logout');
    } catch (err: any) {
      console.warn('Logout API warning:', err);
    } finally {
      localStorage.removeItem('lectio_session_id');
      setUser(null);
      setError(null);
      setLoading(false);
    }
  };

  const switchPersona = async (targetRole: UserRole) => {
    try {
      setLoading(true);
      setError(null);
      // Calls dev persona switch endpoint or logs in with standard test user for role
      const res = await apiClient.post<{ user: User; sessionId?: string }>('/api/auth/switch-persona', {
        role: targetRole,
      });
      if (res.sessionId) {
        localStorage.setItem('lectio_session_id', res.sessionId);
      }
      setUser(res.user);
    } catch (err: any) {
      console.warn('Persona switch fallback:', err);
      // Fallback hydration if endpoint unavailable
      const mockUser: User = {
        id: `usr_${targetRole}_dev`,
        name: `Dev ${targetRole.replace('_', ' ')}`,
        email: `${targetRole}@lectio-dev.edu`,
        role: targetRole,
        districtId: 'dist_demo_1',
      };
      setUser(mockUser);
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        loading,
        error,
        isAuthenticated: !!user,
        login,
        studentLogin,
        logout,
        switchPersona,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
