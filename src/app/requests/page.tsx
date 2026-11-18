'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useRBAC } from '@/hooks/useRBAC';
import { Asset } from '@/types/asset';
import {
  Clock,
  CheckCircle2,
  Package,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  Eye,
  ArrowRight,
  UserCheck,
  Search,
} from 'lucide-react';

interface RequestItem extends Asset {
  requestStatus: 'pending_handover' | 'checked_out' | 'unknown';
}

export default function RequestsPage() {
  const { user, role, isHolder, isLCVP, isAdmin, session, logout, loading: authLoading } = useRBAC();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'out'>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchRequests = useCallback(async () => {
    if (!session?.access_token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/requests', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load requests');
      setRequests(data.requests || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error fetching requests');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (session?.access_token) {
      fetchRequests();
    }
  }, [session, fetchRequests]);

  const handleAction = async (item: RequestItem, action: 'handover' | 'return') => {
    if (!isHolder) {
      setError('LCVP Audit Restriction: Physical handovers and returns must be executed by Asset Holders.');
      setTimeout(() => setError(null), 4000);
      return;
    }

    const key = `${item.category}-${item.rowIndex}-${action}`;
    setActionLoadingId(key);
    setError(null);

    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          category: item.category,
          rowIndex: item.rowIndex,
          action,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update request');

      setSuccessMessage(
        action === 'handover'
          ? `Handed over ${item.name} (${item.reqQty || 1} units) to ${item.reqBy || 'requester'}. Marked as OUT.`
          : `${item.name} returned to inventory. Marked as IN.`
      );
      setTimeout(() => setSuccessMessage(null), 4000);

      // Refresh requests list
      await fetchRequests();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filter requests
  const filteredRequests = requests.filter((r) => {
    const matchesFilter =
      filter === 'all'
        ? true
        : filter === 'pending'
        ? r.requestStatus === 'pending_handover'
        : r.requestStatus === 'checked_out';

    const matchesSearch =
      searchQuery === '' ||
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.reqBy && r.reqBy.toLowerCase().includes(searchQuery.toLowerCase())) ||
      r.category.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const pendingCount = requests.filter((r) => r.requestStatus === 'pending_handover').length;
  const checkedOutCount = requests.filter((r) => r.requestStatus === 'checked_out').length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 select-none">
      <Navbar user={user} role={role} onLogout={logout} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-7 space-y-6">
        {/* Header */}
        <div className="border-b border-slate-200 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-[#037ef3] uppercase tracking-widest mb-1">
                LCAU Operations · Requests Management
              </p>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
                Incoming Requests & Handovers
                {isLCVP && (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Audit View (Read-Only)
                  </span>
                )}
                {isHolder && (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Asset Holder View
                  </span>
                )}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {isHolder
                  ? 'Verify requester identity and confirm physical item handover and returns.'
                  : isLCVP
                  ? 'Executive audit log of all pending and active equipment loans across LCAU.'
                  : 'Asset requests portal.'}
              </p>
            </div>

            {isAdmin && (
              <button
                type="button"
                onClick={fetchRequests}
                disabled={loading}
                className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition shadow-2xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#037ef3]' : ''}`} />
                Refresh Queue
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

        {/* LCVP Audit Notice Banner */}
        {isLCVP && (
          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0 text-indigo-700">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-indigo-950">
                LCVP Oversight & Audit Mode Active
              </p>
              <p className="text-xs text-indigo-700 mt-0.5 leading-relaxed">
                As LCVP Finance & Legality, you have full audit visibility into all requests.
                To maintain physical custody integrity, <strong>only the assigned Asset Holder can execute physical handovers and returns</strong>.
              </p>
            </div>
          </div>
        )}

        {/* Unauthenticated / Unauthorized Public View */}
        {!isAdmin && !authLoading && (
          <div className="max-w-md mx-auto my-12 text-center bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#037ef3] flex items-center justify-center mx-auto">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Authorized Personnel Only
              </h2>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                The requests queue and physical handover controls are restricted to LCAU Asset Holders and LCVP.
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
              <Link
                href="/login"
                className="px-4 py-2.5 rounded-xl bg-[#037ef3] text-white text-xs font-bold hover:bg-[#0263c2] transition shadow-xs"
              >
                Sign In with LC Account
              </Link>
              <Link
                href="/"
                className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition"
              >
                Browse Public Assets
              </Link>
            </div>
          </div>
        )}

        {/* Admin Content */}
        {isAdmin && (
          <>
            {/* Filter Tabs & Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Tabs */}
              <div className="inline-flex p-1 bg-white border border-slate-200 rounded-2xl shadow-2xs gap-1">
                <button
                  type="button"
                  onClick={() => setFilter('pending')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    filter === 'pending'
                      ? 'bg-amber-500 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Pending Handover</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      filter === 'pending' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {pendingCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setFilter('out')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    filter === 'out'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Checked Out</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      filter === 'out' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {checkedOutCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    filter === 'all'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  All Requests ({requests.length})
                </button>
              </div>

              {/* Search */}
              <div className="relative min-w-[220px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by item, requester, or ID..."
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#037ef3]"
                />
              </div>
            </div>

            {/* Requests List */}
            {loading ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs">
                <RefreshCw className="w-6 h-6 text-[#037ef3] animate-spin mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-600">Loading requests queue...</p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">
                  {filter === 'pending'
                    ? 'No pending handovers'
                    : filter === 'out'
                    ? 'No items currently checked out'
                    : 'No requests found'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {filter === 'pending'
                    ? 'All approved asset requests have been handed over.'
                    : 'Check back when members submit requests.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRequests.map((item) => {
                  const isPending = item.requestStatus === 'pending_handover';
                  const isOut = item.requestStatus === 'checked_out';
                  const handoverKey = `${item.category}-${item.rowIndex}-handover`;
                  const returnKey = `${item.category}-${item.rowIndex}-return`;
                  const isHandoverLoading = actionLoadingId === handoverKey;
                  const isReturnLoading = actionLoadingId === returnKey;

                  return (
                    <div
                      key={`${item.category}-${item.rowIndex}`}
                      className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between hover:shadow-md transition"
                    >
                      <div className="space-y-3">
                        {/* Top Category & Status */}
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">
                            {item.category} · {item.id}
                          </span>

                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                              isPending
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : isOut
                                ? 'bg-slate-900 text-white border-slate-900'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {isPending ? 'Pending Handover' : isOut ? 'Checked Out' : 'In Stock'}
                          </span>
                        </div>

                        {/* Title & Qty */}
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                            {item.name}
                          </h3>
                          <div className="mt-1 flex items-center gap-2 text-xs text-slate-600">
                            <span className="font-extrabold text-slate-900">
                              {item.reqQty || 1} {item.unit || 'units'}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="text-slate-500 font-medium">
                              Row #{item.rowIndex}
                            </span>
                          </div>
                        </div>

                        {/* Requester Box */}
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Requested By
                          </p>
                          <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5 text-[#037ef3]" />
                            {item.reqBy || 'Unspecified Member'}
                          </p>
                        </div>
                      </div>

                      {/* Action Button Section */}
                      <div className="mt-4 pt-3 border-t border-slate-100">
                        {isHolder ? (
                          isPending ? (
                            <button
                              type="button"
                              onClick={() => handleAction(item, 'handover')}
                              disabled={isHandoverLoading}
                              className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition active:scale-98 disabled:opacity-50 flex items-center justify-center gap-1.5"
                            >
                              {isHandoverLoading ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <>
                                  <span>Hand Over (Mark OUT)</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </>
                              )}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAction(item, 'return')}
                              disabled={isReturnLoading}
                              className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition active:scale-98 disabled:opacity-50 flex items-center justify-center gap-1.5"
                            >
                              {isReturnLoading ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>Mark Returned (IN)</span>
                                </>
                              )}
                            </button>
                          )
                        ) : isLCVP ? (
                          <div className="py-2 px-3 rounded-xl bg-slate-100 border border-slate-200 text-center">
                            <span className="text-[11px] font-bold text-slate-500 flex items-center justify-center gap-1">
                              <Eye className="w-3.5 h-3.5 text-indigo-500" />
                              Read-Only (Holder Action Required)
                            </span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
