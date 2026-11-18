'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useRBAC } from '@/hooks/useRBAC';
import { LCAUEvent } from '@/types/event';
import { Asset } from '@/types/asset';
import { EventRequestRecord, EventEquipmentSummary } from '@/types/history';
import {
  Calendar,
  Plus,
  RefreshCw,
  MapPin,
  Building,
  CheckCircle2,
  Clock,
  AlertCircle,
  Edit2,
  Trash2,
  Package,
  X,
  Save,
  History,
  Sparkles,
  TrendingUp,
  User,
  ArrowRight,
} from 'lucide-react';

const COMMON_FUNCTIONS = ['All LC', 'MX', 'BD', 'oGX', 'iGV', 'FnL', 'PM', 'EB'];

export default function EventsPage() {
  const { user, role, isHolder, isLCVP, isAdmin, session, logout, loading: authLoading } = useRBAC();
  const [events, setEvents] = useState<LCAUEvent[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [historyRecords, setHistoryRecords] = useState<EventRequestRecord[]>([]);
  const [recommendations, setRecommendations] = useState<EventEquipmentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Active view tab
  const [activeTab, setActiveTab] = useState<'events' | 'history' | 'recommender'>('events');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');

  // Event Detail / History Modal
  const [selectedEventHistory, setSelectedEventHistory] = useState<LCAUEvent | null>(null);

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<LCAUEvent | null>(null);
  const [formName, setFormName] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formFunc, setFormFunc] = useState('All LC');
  const [formLocation, setFormLocation] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formStatus, setFormStatus] = useState<LCAUEvent['status']>('upcoming');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const headers: HeadersInit = session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : {};

      const [eventsRes, assetsRes, historyRes] = await Promise.all([
        fetch('/api/events', { headers }),
        fetch('/api/assets', { cache: 'no-store' }),
        fetch('/api/events/history'),
      ]);

      const eventsData = await eventsRes.json();
      const assetsData = await assetsRes.json();
      const historyData = await historyRes.json();

      if (!eventsRes.ok) throw new Error(eventsData.error || 'Failed to load events');

      setEvents(eventsData.events || []);
      setAssets(assetsData.assets || []);
      setHistoryRecords(historyData.records || []);
      setRecommendations(historyData.summary || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error fetching events');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenCreate = () => {
    setEditingEvent(null);
    setFormName('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormFunc('All LC');
    setFormLocation('AU Suvarnabhumi Campus');
    setFormDesc('');
    setFormStatus('upcoming');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (evt: LCAUEvent) => {
    setEditingEvent(evt);
    setFormName(evt.name);
    setFormDate(evt.date);
    setFormFunc(evt.organizingFunction || 'All LC');
    setFormLocation(evt.location || '');
    setFormDesc(evt.description || '');
    setFormStatus(evt.status);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    setSaving(true);
    setError(null);

    const payload = {
      name: formName.trim(),
      date: formDate.trim(),
      organizingFunction: formFunc.trim(),
      location: formLocation.trim(),
      description: formDesc.trim(),
      status: formStatus,
    };

    try {
      const url = editingEvent ? `/api/events/${editingEvent.id}` : '/api/events';
      const method = editingEvent ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save event');

      setSuccessMessage(
        editingEvent
          ? `Updated event "${formName}"`
          : `Created new event "${formName}" for request dropdown!`
      );
      setTimeout(() => setSuccessMessage(null), 4000);
      setIsModalOpen(false);
      await fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete event "${name}"?`)) return;

    setDeletingId(id);
    setError(null);

    try {
      const res = await fetch(`/api/events/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete event');

      setSuccessMessage(`Event "${name}" deleted.`);
      setTimeout(() => setSuccessMessage(null), 4000);
      await fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete event');
    } finally {
      setDeletingId(null);
    }
  };

  // Filter events
  const filteredEvents = events.filter((e) => {
    if (filter === 'active') return e.status === 'upcoming' || e.status === 'ongoing';
    if (filter === 'completed') return e.status === 'completed' || e.status === 'cancelled';
    return true;
  });

  // History for selected event
  const selectedEventHistoryRecords = selectedEventHistory
    ? historyRecords.filter((r) =>
        r.eventName.toLowerCase().includes(selectedEventHistory.name.toLowerCase()) ||
        selectedEventHistory.name.toLowerCase().includes(r.eventName.toLowerCase())
      )
    : [];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 select-none">
      <Navbar user={user} role={role} onLogout={logout} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-7 space-y-6">
        {/* Header */}
        <div className="border-b border-slate-200 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-[#037ef3] uppercase tracking-widest mb-1">
                LCAU Operations · Equipment Intelligence
              </p>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Event Tracker & History
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Manage upcoming events, audit what equipment was requested for previous events, and review high-demand inventory.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={fetchData}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition shadow-2xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#037ef3]' : ''}`} />
                Refresh
              </button>

              {isAdmin && (
                <button
                  type="button"
                  onClick={handleOpenCreate}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#037ef3] hover:bg-[#0263c2] text-white text-xs font-bold shadow-xs transition active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create Event
                </button>
              )}
            </div>
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

        {/* Main Section Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('events')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'events'
                ? 'bg-[#037ef3] text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Events Directory</span>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-md font-bold ${
                activeTab === 'events' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {events.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'history'
                ? 'bg-[#037ef3] text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Previous Events History</span>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-md font-bold ${
                activeTab === 'history' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {historyRecords.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('recommender')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'recommender'
                ? 'bg-[#037ef3] text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Most Requested Items</span>
          </button>
        </div>

        {/* ── TAB 1: EVENTS DIRECTORY ── */}
        {activeTab === 'events' && (
          <div className="space-y-4">
            {/* Filter Sub-Tabs */}
            <div className="inline-flex p-1 bg-white border border-slate-200 rounded-2xl shadow-2xs gap-1">
              <button
                type="button"
                onClick={() => setFilter('active')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                  filter === 'active'
                    ? 'bg-[#037ef3] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Upcoming & Ongoing</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${
                    filter === 'active' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {events.filter((e) => e.status === 'upcoming' || e.status === 'ongoing').length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFilter('completed')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                  filter === 'completed'
                    ? 'bg-[#037ef3] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Past / Completed</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${
                    filter === 'completed' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {events.filter((e) => e.status === 'completed' || e.status === 'cancelled').length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                  filter === 'all'
                    ? 'bg-[#037ef3] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                All ({events.length})
              </button>
            </div>

            {/* Events Grid */}
            {loading ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs">
                <RefreshCw className="w-6 h-6 text-[#037ef3] animate-spin mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-600">Loading events...</p>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs">
                <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-800">No events found in this view</h3>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredEvents.map((evt) => {
                  const isDeleting = deletingId === evt.id;
                  const isUpcoming = evt.status === 'upcoming';
                  const isOngoing = evt.status === 'ongoing';

                  // Historical and active requests for this event
                  const eventRecords = historyRecords.filter((r) =>
                    r.eventName.toLowerCase().includes(evt.name.toLowerCase()) ||
                    evt.name.toLowerCase().includes(r.eventName.toLowerCase())
                  );

                  const totalBorrowedUnits = eventRecords.reduce((sum, r) => sum + r.quantity, 0);

                  return (
                    <div
                      key={evt.id}
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition space-y-4"
                    >
                      <div className="space-y-3">
                        {/* Function & Status Header */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 font-bold text-slate-500 uppercase tracking-wider text-[11px]">
                            <Building className="w-3.5 h-3.5 text-[#037ef3]" />
                            <span>{evt.organizingFunction || 'All LC'}</span>
                          </div>

                          <div className="flex items-center gap-1.5 text-xs font-semibold">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                isOngoing
                                  ? 'bg-amber-500 animate-pulse'
                                  : isUpcoming
                                  ? 'bg-emerald-500'
                                  : 'bg-slate-400'
                              }`}
                            />
                            <span
                              className={
                                isOngoing
                                  ? 'text-amber-700 capitalize'
                                  : isUpcoming
                                  ? 'text-emerald-700 capitalize'
                                  : 'text-slate-500 capitalize'
                              }
                            >
                              {evt.status}
                            </span>
                          </div>
                        </div>

                        {/* Title & Date */}
                        <div>
                          <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                            {evt.name}
                          </h3>
                          <p className="text-xs text-slate-500 font-semibold flex items-center gap-1.5 mt-1">
                            <Calendar className="w-3.5 h-3.5 text-[#037ef3]" />
                            <span>
                              {new Date(evt.date).toLocaleDateString(undefined, {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          </p>
                        </div>

                        {/* Location */}
                        {evt.location && (
                          <p className="text-xs text-slate-600 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span className="truncate">{evt.location}</span>
                          </p>
                        )}

                        {/* Equipment Summary Snippet */}
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-700 flex items-center gap-1.5">
                              <Package className="w-3.5 h-3.5 text-[#037ef3]" />
                              <span>Equipment History</span>
                            </span>
                            <span className="font-extrabold text-slate-900">
                              {eventRecords.length} items ({totalBorrowedUnits} units)
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => setSelectedEventHistory(evt)}
                            className="w-full py-1.5 px-2.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-[11px] font-bold text-slate-700 transition flex items-center justify-center gap-1 shadow-2xs"
                          >
                            <History className="w-3 h-3 text-[#037ef3]" />
                            <span>View Requested Items History</span>
                          </button>
                        </div>
                      </div>

                      {/* Actions for Admins */}
                      {isAdmin && (
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(evt)}
                            className="flex-1 py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition flex items-center justify-center gap-1.5"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Edit Event</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(evt.id, evt.name)}
                            disabled={isDeleting}
                            className="p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition disabled:opacity-50"
                            title="Delete event"
                          >
                            {isDeleting ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: PREVIOUS EVENTS HISTORY LOG ── */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-4 p-5">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">
                  Historical Log of Requested Items Across All Events
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Complete audit record of every item requested, loaned, and returned per event.
                </p>
              </div>
              <span className="text-xs font-bold text-slate-500">
                {historyRecords.length} Total Records
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">Event Name</th>
                    <th className="py-2.5 px-3">Asset Requested</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Qty</th>
                    <th className="py-2.5 px-3">Requester & Function</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {historyRecords.map((r) => {
                    const isReturned = r.status === 'returned';
                    const isLoaned = r.status === 'loaned';

                    return (
                      <tr key={r.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          {r.eventName}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">
                          {r.assetName}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">
                          {r.category}
                        </td>
                        <td className="py-2.5 px-3 font-extrabold text-slate-900">
                          {r.quantity}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">
                          <span className="font-semibold">{r.requesterName}</span> ({r.requesterFunction})
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="inline-flex items-center gap-1.5 font-semibold text-xs">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isReturned
                                  ? 'bg-emerald-500'
                                  : isLoaned
                                  ? 'bg-rose-500'
                                  : 'bg-amber-500 animate-pulse'
                              }`}
                            />
                            <span
                              className={
                                isReturned
                                  ? 'text-emerald-700'
                                  : isLoaned
                                  ? 'text-rose-700'
                                  : 'text-amber-700'
                              }
                            >
                              {isReturned ? 'Returned (IN)' : isLoaned ? 'Loaned (OUT)' : 'Pending Handover'}
                            </span>
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                          {new Date(r.requestedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 3: MOST REQUESTED ITEMS (RECOMMENDER PREVIEW) ── */}
        {activeTab === 'recommender' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#037ef3] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">
                  Most Requested Equipment Intelligence
                </h3>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  Historical equipment demand aggregated across all previous events.
                  This data powers the upcoming <strong>Smart Equipment Recommender</strong> when planning new events.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendations.map((item, index) => (
                <div
                  key={item.assetName}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-between hover:shadow-md transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-8 h-8 rounded-xl bg-slate-100 font-black text-xs text-slate-700 flex items-center justify-center shrink-0">
                      #{index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-slate-900 truncate">
                        {item.assetName}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {item.category} · {item.requestCount} event bookings
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-sm font-extrabold text-[#037ef3]">
                      {item.totalQuantity}
                    </span>
                    <p className="text-[10px] text-slate-400">units borrowed</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── EVENT HISTORY MODAL ── */}
        {selectedEventHistory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in-0 duration-150">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
              <div className="flex items-start justify-between pb-2 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-[#037ef3]" />
                    <h3 className="font-extrabold text-base text-slate-900">
                      {selectedEventHistory.name}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {selectedEventHistory.organizingFunction} · {new Date(selectedEventHistory.date).toLocaleDateString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedEventHistory(null)}
                  className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {selectedEventHistoryRecords.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No equipment history logged for this event yet.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {selectedEventHistoryRecords.map((r) => {
                    const isReturned = r.status === 'returned';
                    const isLoaned = r.status === 'loaned';

                    return (
                      <div
                        key={r.id}
                        className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <p className="font-bold text-slate-900">{r.assetName}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Requested by <span className="font-semibold">{r.requesterName}</span> ({r.requesterFunction})
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-extrabold text-slate-900">
                            {r.quantity} units
                          </span>
                          <div className="mt-0.5">
                            <span className="inline-flex items-center gap-1 font-semibold text-[11px]">
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isReturned
                                    ? 'bg-emerald-500'
                                    : isLoaned
                                    ? 'bg-rose-500'
                                    : 'bg-amber-500 animate-pulse'
                                }`}
                              />
                              <span
                                className={
                                  isReturned
                                    ? 'text-emerald-700 capitalize'
                                    : isLoaned
                                    ? 'text-rose-700 capitalize'
                                    : 'text-amber-700 capitalize'
                                }
                              >
                                {r.status}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedEventHistory(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── CREATE / EDIT EVENT MODAL ── */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in-0 duration-150">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#037ef3]" />
                  <h3 className="font-extrabold text-base text-slate-900">
                    {editingEvent ? 'Edit Event' : 'Create New Event'}
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

              <form onSubmit={handleSave} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Event Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Culture & Connect Night 2026"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#037ef3] focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Event Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#037ef3] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Function
                    </label>
                    <select
                      value={formFunc}
                      onChange={(e) => setFormFunc(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#037ef3] focus:outline-hidden bg-white"
                    >
                      {COMMON_FUNCTIONS.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Physical Location
                  </label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="e.g. AU Suvarnabhumi Campus, CL Plaza"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#037ef3] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as LCAUEvent['status'])}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#037ef3] focus:outline-hidden bg-white"
                  >
                    <option value="upcoming">Upcoming (Listed in request basket dropdown)</option>
                    <option value="ongoing">Ongoing (Active operations)</option>
                    <option value="completed">Completed / Finished</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Description / Purpose
                  </label>
                  <textarea
                    rows={2}
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="Brief description of the event purpose and target audience..."
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#037ef3] focus:outline-hidden"
                  />
                </div>

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
                    <span>Save Event</span>
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
