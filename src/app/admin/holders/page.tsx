'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useRBAC } from '@/hooks/useRBAC';
import { CategoryHolderAssignment } from '@/types/rbac';
import {
  ShieldAlert,
  Users,
  MapPin,
  Mail,
  Edit2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FolderOpen,
  X,
  Save,
} from 'lucide-react';

export default function AssetHoldersPage() {
  const { user, role, isLCVP, session, logout, loading: authLoading } = useRBAC();
  const [assignments, setAssignments] = useState<CategoryHolderAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Edit Modal State
  const [editingCategory, setEditingCategory] = useState<CategoryHolderAssignment | null>(null);
  const [formHolderName, setFormHolderName] = useState('');
  const [formHolderEmail, setFormHolderEmail] = useState('');
  const [formStorageLocation, setFormStorageLocation] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchAssignments = useCallback(async () => {
    if (!session?.access_token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/holders', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load holder assignments');
      setAssignments(data.assignments || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error fetching holder assignments');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (session?.access_token) {
      fetchAssignments();
    }
  }, [session, fetchAssignments]);

  const handleEditClick = (item: CategoryHolderAssignment) => {
    setEditingCategory(item);
    setFormHolderName(item.holderName);
    setFormHolderEmail(item.holderEmail);
    setFormStorageLocation(item.storageLocation);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/holders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          category: editingCategory.category,
          holderName: formHolderName.trim(),
          holderEmail: formHolderEmail.trim(),
          storageLocation: formStorageLocation.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update assignment');

      setSuccessMessage(`Successfully updated holder for ${editingCategory.category}`);
      setTimeout(() => setSuccessMessage(null), 4000);
      setEditingCategory(null);
      await fetchAssignments();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 select-none">
      <Navbar user={user} role={role} onLogout={logout} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-7 space-y-6">
        {/* Header */}
        <div className="border-b border-slate-200 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-[#037ef3] uppercase tracking-widest mb-1">
                LCAU Governance · Custody Delegation
              </p>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
                Asset Holder Assignments
                {isLCVP ? (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    LCVP Admin
                  </span>
                ) : (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    Read-Only
                  </span>
                )}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {isLCVP
                  ? 'Assign which officer physically holds and oversees inventory for each category.'
                  : 'Official record of category custody locations and designated asset holders.'}
              </p>
            </div>

            {session && (
              <button
                type="button"
                onClick={fetchAssignments}
                disabled={loading}
                className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition shadow-2xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#037ef3]' : ''}`} />
                Refresh
              </button>
            )}
          </div>
        </div>

        {/* Success Banner */}
        {successMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-in fade-in-0 duration-150">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-in fade-in-0 duration-150">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Unauthenticated Notice */}
        {!session && !authLoading && (
          <div className="max-w-md mx-auto my-12 text-center bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Sign In Required
              </h2>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                You must sign in with an authorized LCAU account to view asset holder assignments.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/login"
                className="inline-block px-4 py-2.5 rounded-xl bg-[#037ef3] text-white text-xs font-bold hover:bg-[#0263c2] transition shadow-xs"
              >
                Sign In
              </Link>
            </div>
          </div>
        )}

        {/* Assignments Cards */}
        {session && (
          <>
            {loading ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs">
                <RefreshCw className="w-6 h-6 text-[#037ef3] animate-spin mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-600">Loading assignments...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {assignments.map((item) => {
                  const categoryBadgeColor =
                    item.category === 'Stationary'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : item.category === 'Decoration'
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200';

                  return (
                    <div
                      key={item.category}
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition"
                    >
                      <div className="space-y-4">
                        {/* Category Header */}
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-lg border ${categoryBadgeColor}`}
                          >
                            {item.category}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            Updated {new Date(item.lastUpdated).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Holder Info */}
                        <div className="space-y-2.5 pt-1">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Designated Asset Holder
                            </p>
                            <p className="text-sm font-extrabold text-slate-900 mt-0.5 flex items-center gap-1.5">
                              <Users className="w-4 h-4 text-[#037ef3]" />
                              {item.holderName || 'Unassigned'}
                            </p>
                          </div>

                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Official Email
                            </p>
                            <p className="text-xs font-semibold text-slate-700 mt-0.5 flex items-center gap-1.5 truncate">
                              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{item.holderEmail || '—'}</span>
                            </p>
                          </div>

                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Physical Custody Location
                            </p>
                            <p className="text-xs font-semibold text-slate-700 mt-0.5 flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              <span>{item.storageLocation || 'Unspecified'}</span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Edit Button for LCVP */}
                      {isLCVP && (
                        <div className="mt-5 pt-3 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => handleEditClick(item)}
                            className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition active:scale-98 flex items-center justify-center gap-1.5"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit Assignment</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Edit Modal for LCVP */}
        {editingCategory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in-0 duration-150">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-[#037ef3]" />
                  <h3 className="font-extrabold text-base text-slate-900">
                    Reassign {editingCategory.category} Holder
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Asset Holder Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formHolderName}
                    onChange={(e) => setFormHolderName(e.target.value)}
                    placeholder="e.g. Tim (Master Tin)"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#037ef3] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Holder Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={formHolderEmail}
                    onChange={(e) => setFormHolderEmail(e.target.value)}
                    placeholder="e.g. nyunttin@aiesec.net"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#037ef3] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Physical Storage / Custody Location
                  </label>
                  <input
                    type="text"
                    required
                    value={formStorageLocation}
                    onChange={(e) => setFormStorageLocation(e.target.value)}
                    placeholder="e.g. Student Lounge Locker 4A"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#037ef3] focus:outline-hidden"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingCategory(null)}
                    disabled={saving}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 rounded-xl bg-[#037ef3] hover:bg-[#0263c2] text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {saving ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    <span>Save Assignment</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
