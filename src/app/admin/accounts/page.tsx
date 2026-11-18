'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useRBAC } from '@/hooks/useRBAC';
import { AccountRecord, UserRole } from '@/types/rbac';
import {
  ShieldAlert,
  UserPlus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Mail,
  Shield,
  X,
  Save,
} from 'lucide-react';

export default function AccountsPage() {
  const { user, role, isLCVP, session, logout, loading: authLoading } = useRBAC();
  const [accounts, setAccounts] = useState<AccountRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountRecord | null>(null);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('holder');
  const [formCategory, setFormCategory] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    if (!session?.access_token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/accounts', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load accounts');
      setAccounts(data.accounts || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error fetching accounts');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (session?.access_token && isLCVP) {
      fetchAccounts();
    }
  }, [session, isLCVP, fetchAccounts]);

  const handleOpenCreate = () => {
    setEditingAccount(null);
    setFormName('');
    setFormEmail('');
    setFormRole('holder');
    setFormCategory('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (acc: AccountRecord) => {
    setEditingAccount(acc);
    setFormName(acc.name);
    setFormEmail(acc.email);
    setFormRole(acc.role);
    setFormCategory(acc.assignedCategory || '');
    setIsModalOpen(true);
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          email: formEmail.trim(),
          name: formName.trim(),
          role: formRole,
          assignedCategory: formCategory.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save account');

      setSuccessMessage(
        editingAccount
          ? `Updated account permissions for ${formEmail}`
          : `Provisioned account for ${formEmail}`
      );
      setTimeout(() => setSuccessMessage(null), 4000);
      setIsModalOpen(false);
      await fetchAccounts();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`Are you sure you want to remove account ${email}?`)) return;

    setDeletingId(id);
    setError(null);

    try {
      const res = await fetch(`/api/admin/accounts?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete account');

      setSuccessMessage(`Account ${email} removed.`);
      setTimeout(() => setSuccessMessage(null), 4000);
      await fetchAccounts();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete account');
    } finally {
      setDeletingId(null);
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
                LCAU Governance · RBAC Directory
              </p>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
                User Accounts & Roles
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  LCVP Only
                </span>
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Provision new accounts, assign Asset Holder vs LCVP roles, and configure category scopes.
              </p>
            </div>

            {isLCVP && (
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={fetchAccounts}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition shadow-2xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#037ef3]' : ''}`} />
                  Refresh
                </button>
                <button
                  type="button"
                  onClick={handleOpenCreate}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#037ef3] hover:bg-[#0263c2] text-white text-xs font-bold shadow-xs transition active:scale-95"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Provision Account
                </button>
              </div>
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

        {/* Non-LCVP Notice */}
        {!isLCVP && !authLoading && (
          <div className="max-w-md mx-auto my-12 text-center bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                LCVP Access Only
              </h2>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Account provisioning and role delegation is restricted exclusively to LCVP Finance & Legality.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/"
                className="inline-block px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition shadow-xs"
              >
                Return to Assets
              </Link>
            </div>
          </div>
        )}

        {/* LCVP Content: Accounts Table */}
        {isLCVP && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            {loading ? (
              <div className="p-12 text-center">
                <RefreshCw className="w-6 h-6 text-[#037ef3] animate-spin mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-600">Loading directory...</p>
              </div>
            ) : accounts.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-xs text-slate-400">No accounts provisioned yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Assigned Category</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {accounts.map((acc) => {
                      const isDeleting = deletingId === acc.id;
                      const isLcvpRole = acc.role === 'lcvp';

                      return (
                        <tr key={acc.id} className="hover:bg-slate-50/60 transition">
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-bold text-slate-900">{acc.name}</p>
                              <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                <Mail className="w-3 h-3 text-slate-400" />
                                {acc.email}
                              </p>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${
                                isLcvpRole
                                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                  : 'bg-blue-50 text-[#037ef3] border-blue-200'
                              }`}
                            >
                              <Shield className="w-3 h-3" />
                              {isLcvpRole ? 'LCVP' : 'Asset Holder'}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <span className="text-slate-700 font-medium">
                              {acc.assignedCategory || '—'}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {acc.status}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(acc)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
                                title="Edit account"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(acc.id, acc.email)}
                                disabled={isDeleting}
                                className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition disabled:opacity-50"
                                title="Remove account"
                              >
                                {isDeleting ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Add/Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in-0 duration-150">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-[#037ef3]" />
                  <h3 className="font-extrabold text-base text-slate-900">
                    {editingAccount ? 'Edit Account' : 'Provision New Account'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveAccount} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Tim (Master Tin)"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#037ef3] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    AIESEC Official Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="e.g. member@aiesec.net"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#037ef3] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Role
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#037ef3] focus:outline-hidden bg-white"
                  >
                    <option value="holder">Asset Holder (Manages inventory & handovers)</option>
                    <option value="lcvp">LCVP (Superadmin & Read-Only Audit)</option>
                  </select>
                </div>

                {formRole === 'holder' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Assigned Category / Notes
                    </label>
                    <input
                      type="text"
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      placeholder="e.g. Stationary & General"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#037ef3] focus:outline-hidden"
                    />
                  </div>
                )}

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
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
                    <span>Save Account</span>
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
