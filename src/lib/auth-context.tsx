'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, refreshOnce, setAccessToken } from '@/lib/api';
import type { AgencyType } from '@/lib/types';

export interface AuthUser {
  id: string;
  agencyId: string;
  email: string;
  name: string;
  lastName: string | null;
  avatarUrl: string | null;
  phone: string | null;
  agency: { id: string; name: string; slug: string } | null;
  roles: { id: string; name: string; slug: string }[];
  permissions: string[];
}

export interface RegisterValues {
  agencyName: string;
  type: AgencyType;
  name: string;
  email: string;
  password: string;
}

export interface UpdateProfileValues {
  name?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  currentPassword?: string;
  newPassword?: string;
}

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<void>;
  register: (values: RegisterValues) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (code: string) => boolean;
  updateProfile: (values: UpdateProfileValues) => Promise<AuthUser>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let token: string | null = null;
      try {
        // Share the in-flight refresh with apiFetch's own 401 retry — the refresh token
        // rotates on every use, so two concurrent /auth/refresh calls race and the loser
        // revokes the whole session.
        token = await refreshOnce();
      } catch {
        if (!cancelled) setStatus('unauthenticated');
        return;
      }
      if (cancelled) return;
      if (!token) {
        setStatus('unauthenticated');
        return;
      }
      try {
        const me = await api.get<AuthUser>('/auth/me');
        if (cancelled) return;
        setUser(me);
        setStatus('authenticated');
      } catch {
        if (!cancelled) setStatus('unauthenticated');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.post<{ accessToken: string; user: AuthUser }>('/auth/login', { email, password });
    setAccessToken(data.accessToken);
    setUser(data.user);
    setStatus('authenticated');
  }, []);

  const register = useCallback(async (values: RegisterValues) => {
    const data = await api.post<{ accessToken: string; user: AuthUser }>('/auth/register', values);
    setAccessToken(data.accessToken);
    setUser(data.user);
    setStatus('authenticated');
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      /* session already gone */
    }
    setAccessToken(null);
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  const hasPermission = useCallback((code: string) => user?.permissions.includes(code) ?? false, [user]);

  const updateProfile = useCallback(async (values: UpdateProfileValues) => {
    const updated = await api.patch<AuthUser>('/auth/me', values);
    setUser(updated);
    return updated;
  }, []);

  const value = useMemo(
    () => ({ user, status, login, register, logout, hasPermission, updateProfile }),
    [user, status, login, register, logout, hasPermission, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
