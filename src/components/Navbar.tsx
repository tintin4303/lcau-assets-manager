'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Package, Menu, X } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { UserRole } from '@/types/rbac';

interface NavbarProps {
  user: User | null;
  role?: UserRole;
  onLogout: () => Promise<void>;
}

export default function Navbar({ user, role = 'requester', onLogout }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const isLCVP = role === 'lcvp';
  const isHolder = role === 'holder';
  const isAuthenticated = !!user;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Info */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-9 h-9 rounded-xl bg-[#037ef3] flex items-center justify-center text-white shadow-xs group-hover:bg-[#0263c2] transition">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-slate-900 tracking-tight text-base sm:text-lg">
                  AIESEC <span className="text-[#037ef3]">LCAU</span>
                </span>
                <span className="hidden sm:inline-block text-xs font-semibold text-slate-400">
                  · Asset Management
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium leading-none mt-0.5">
                Finance and Legality Function
              </p>
            </div>
          </Link>

          {/* Hamburger Dropdown Container */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition flex items-center gap-1.5"
              aria-label="Toggle navigation menu"
              aria-expanded={isOpen}
            >
              {isOpen ? (
                <X className="w-4 h-4 text-slate-700" />
              ) : (
                <Menu className="w-4 h-4 text-slate-700" />
              )}
              <span className="hidden sm:inline text-xs font-bold text-slate-700">
                Menu
              </span>
            </button>

            {/* Compact Floating Dropdown Menu */}
            {isOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 sm:w-52 bg-white rounded-2xl border border-slate-200 shadow-xl p-1.5 z-50 animate-in fade-in-0 zoom-in-95 duration-150">
                {/* User email header if logged in */}
                {user && (
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <p className="text-[11px] font-bold text-slate-900 truncate">
                      {user.email}
                    </p>
                    <p className="text-[10px] text-[#037ef3] font-semibold mt-0.5">
                      {isLCVP ? 'LCVP' : isHolder ? 'Asset Holder' : 'Member'}
                    </p>
                  </div>
                )}

                {/* Role-Aware Menu Items */}
                <div className="space-y-0.5 text-xs font-semibold text-slate-700">
                  {/* Common to all: Assets */}
                  <Link
                    href="/"
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 rounded-xl hover:bg-slate-100 hover:text-slate-900 transition"
                  >
                    Assets
                  </Link>

                  {/* Requests & Events: available when authenticated (holder or lcvp) */}
                  {(isHolder || isLCVP) && (
                    <>
                      <Link
                        href="/requests"
                        onClick={() => setIsOpen(false)}
                        className="block px-3 py-2 rounded-xl hover:bg-slate-100 hover:text-slate-900 transition"
                      >
                        Requests
                      </Link>

                      <Link
                        href="/events"
                        onClick={() => setIsOpen(false)}
                        className="block px-3 py-2 rounded-xl hover:bg-slate-100 hover:text-slate-900 transition"
                      >
                        Events
                      </Link>
                    </>
                  )}

                  {/* LCVP Exclusive Items */}
                  {isLCVP && (
                    <>
                      <Link
                        href="/lcvp/accounts"
                        onClick={() => setIsOpen(false)}
                        className="block px-3 py-2 rounded-xl hover:bg-slate-100 hover:text-slate-900 transition"
                      >
                        Accounts
                      </Link>

                      <Link
                        href="/lcvp/holders"
                        onClick={() => setIsOpen(false)}
                        className="block px-3 py-2 rounded-xl hover:bg-slate-100 hover:text-slate-900 transition"
                      >
                        Asset Holders
                      </Link>
                    </>
                  )}
                </div>

                {/* Auth Action */}
                <div className="pt-1 mt-1 border-t border-slate-100">
                  {isAuthenticated ? (
                    <button
                      type="button"
                      onClick={async () => {
                        setIsOpen(false);
                        await onLogout();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-semibold transition"
                    >
                      Sign Out
                    </button>
                  ) : (
                    <Link
                      href="/login"
                      onClick={() => setIsOpen(false)}
                      className="block px-3 py-2 rounded-xl text-[#037ef3] hover:bg-blue-50 text-xs font-semibold transition"
                    >
                      Sign In
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
