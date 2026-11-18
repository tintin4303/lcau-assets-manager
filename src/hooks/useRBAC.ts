'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { UserRole } from '@/types/rbac';
import type { User, Session } from '@supabase/supabase-js';

export interface RBACState {
  user: User | null;
  session: Session | null;
  role: UserRole;
  isHolder: boolean;
  isLCVP: boolean;
  isAdmin: boolean;
  canExecuteHandover: boolean;
  loading: boolean;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useRBAC(): RBACState {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole>('requester');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchRole = useCallback(async (token: string | undefined) => {
    if (!token) {
      setRole('requester');
      return;
    }
    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setRole(data.role || 'requester');
      } else {
        setRole('requester');
      }
    } catch {
      setRole('requester');
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.access_token) {
        await fetchRole(session.access_token);
      } else {
        setRole('requester');
      }
    } finally {
      setLoading(false);
    }
  }, [fetchRole]);

  useEffect(() => {
    refresh();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.access_token) {
        await fetchRole(session.access_token);
      } else {
        setRole('requester');
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refresh, fetchRole]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole('requester');
  }, []);

  const isHolder = role === 'holder';
  const isLCVP = role === 'lcvp';
  const isAdmin = isHolder || isLCVP;
  const canExecuteHandover = isHolder;

  return {
    user,
    session,
    role,
    isHolder,
    isLCVP,
    isAdmin,
    canExecuteHandover,
    loading,
    logout,
    refresh,
  };
}
