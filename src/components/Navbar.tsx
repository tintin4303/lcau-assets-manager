'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, LogIn, LogOut, Package } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

interface NavbarProps {
  user: User | null;
  onLogout: () => Promise<void>;
}

export default function Navbar({ user, onLogout }: NavbarProps) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Info */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-[#037ef3] flex items-center justify-center text-white shadow-sm">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg">
                  AIESEC <span className="text-[#037ef3]">LCAU</span>
                </span>
                <span className="hidden sm:inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-[#037ef3] border border-blue-100">
                  Asset Management
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Finance and Legality Function
              </p>
            </div>
          </div>

          {/* Auth State & Navigation */}
          <div className="flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium">
                  <ShieldCheck className="w-4 h-4 text-slate-500" />
                  <span>Admin: <span className="font-semibold">{user.email}</span></span>
                </div>
                <button
                  onClick={onLogout}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
                  title="Sign out of Admin"
                >
                  <LogOut className="w-3.5 h-3.5 text-slate-500" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <span className="hidden sm:inline-block text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                  Public Read-Only
                </span>
                <Link
                  href="/login"
                  className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md bg-[#037ef3] text-white hover:bg-[#0263c2] shadow-xs transition"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Admin Login</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
