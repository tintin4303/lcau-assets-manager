'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ShieldCheck, ArrowLeft, Loader2, Lock, Mail } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. Try Supabase Auth first
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (!signInError && data?.session) {
        router.push('/');
        router.refresh();
        return;
      }

      // 2. Check custom user table with bcrypt verification
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const customData = await res.json();

      if (res.ok && customData.success) {
        localStorage.setItem(
          'lcau_custom_auth',
          JSON.stringify({ user: customData.user, token: customData.token })
        );
        router.push('/');
        router.refresh();
        return;
      }

      throw new Error(customData.error || signInError?.message || 'Invalid login credentials.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid login credentials.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#037ef3] text-white shadow-md mb-4">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Admin Portal
        </h2>
        <p className="mt-1 text-xs font-medium text-slate-500">
          AIESEC in Assumption University • LCAU 26.27
        </p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Finance and Legality Function
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 sm:rounded-xl sm:px-10">
          <form className="space-y-5" onSubmit={handleLogin}>
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Admin Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@aiesec.net"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#037ef3]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#037ef3]"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center space-x-1.5 py-2.5 px-4 border border-transparent rounded-lg shadow-xs text-xs font-semibold text-white bg-[#037ef3] hover:bg-[#0263c2] focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-[#037ef3] transition disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Sign In to Admin Portal</span>
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between text-xs">
            <Link
              href="/"
              className="inline-flex items-center space-x-1 text-slate-500 hover:text-slate-800 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Public Dashboard</span>
            </Link>
            <span className="text-[11px] text-slate-400">Restricted Access</span>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Made and used by LCAU, Finance and Legality Function.
        </p>
      </div>
    </div>
  );
}
