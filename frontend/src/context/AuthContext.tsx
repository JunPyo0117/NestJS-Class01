import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { User } from '@/types';
import * as authApi from '@/api/auth';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, isAdmin?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (u: User | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const u = await authApi.getPrivate();
      setUser(u);
    } catch (error: any) {
      // axios interceptor가 refresh를 시도했지만 실패한 경우에만 토큰 삭제
      // (interceptor에서 이미 토큰을 삭제하고 /login으로 리다이렉트함)
      // 여기서는 localStorage를 다시 확인해서 토큰이 없으면 user를 null로 설정
      if (!localStorage.getItem('accessToken')) {
        setUser(null);
      }
      // 토큰이 여전히 있다면 일시적인 네트워크 오류일 수 있으므로 user 상태 유지
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      const tokens = await authApi.login(email, password);
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      await loadUser();
    },
    [loadUser]
  );

  const register = useCallback(
    async (email: string, password: string, isAdmin?: boolean) => {
      const tokens = await authApi.register(
        email,
        password,
        isAdmin ? 0 : undefined,
      );
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      await loadUser();
    },
    [loadUser],
  );

  const logout = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        await authApi.logout(token);
      } catch {
        // ignore
      }
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
