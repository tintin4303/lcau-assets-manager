'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Building,
  User,
} from 'lucide-react';
import { CartItem } from '@/types/asset';
import { LCAUEvent } from '@/types/event';
import { getThumbnailUrl } from '@/lib/image-utils';

interface RequestCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQty: (category: string, rowIndex: number, qty: number) => void;
  onRemoveItem: (category: string, rowIndex: number) => void;
  onClearCart: () => void;
  onSuccess: (count: number) => void;
}

const COMMON_FUNCTIONS = [
  'oGX',
  'iGV',
  'BD',
  'FnL',
  'Marketing',
  'PM',
  'EB',
  'Other',
];

export default function RequestCartModal({
  isOpen,
  onClose,
  items,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  onSuccess,
}: RequestCartModalProps) {
  // Separated fields
  const [name, setName] = useState('');
  const [func, setFunc] = useState('oGX');
  const [customFunc, setCustomFunc] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('');
  const [customEvent, setCustomEvent] = useState('');

  const [upcomingEvents, setUpcomingEvents] = useState<LCAUEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch upcoming events for dropdown
  useEffect(() => {
    if (isOpen) {
      setLoadingEvents(true);
      fetch('/api/events?filter=upcoming')
        .then((res) => res.json())
        .then((data) => {
          if (data.events && Array.isArray(data.events) && data.events.length > 0) {
            setUpcomingEvents(data.events);
            setSelectedEvent(data.events[0].name);
          } else {
            setSelectedEvent('__custom__');
          }
        })
        .catch((err) => {
          console.error('Failed to load upcoming events:', err);
          setSelectedEvent('__custom__');
        })
        .finally(() => setLoadingEvents(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Please enter your full name.');
      return;
    }

    const finalFunc = func === 'Other' ? customFunc.trim() : func;
    if (!finalFunc) {
      setError('Please specify your function/department.');
      return;
    }

    const finalEvent = selectedEvent === '__custom__' ? customEvent.trim() : selectedEvent.trim();
    if (!finalEvent) {
      setError('Please specify the event or purpose.');
      return;
    }

    if (items.length === 0) {
      setError('Your request basket is empty.');
      return;
    }

    // Combined into format for Google Sheets Column H (Req By)
    const combinedReqBy = `${trimmedName} / ${finalFunc} / ${finalEvent}`;

    setLoading(true);

    try {
      const payload = {
        reqBy: combinedReqBy,
        items: items.map((item) => ({
          category: item.asset.category,
          rowIndex: item.asset.rowIndex,
          reqQty: item.reqQty,
          assetId: item.asset.id,
          name: item.asset.name,
        })),
      };

      const res = await fetch('/api/assets/request-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit batch request');
      }

      const count = items.length;
      onClearCart();
      setName('');
      setCustomFunc('');
      setCustomEvent('');
      onClose();
      onSuccess(count);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred during request submission.');
    } finally {
      setLoading(false);
    }
  };

  const totalUnits = items.reduce((sum, item) => sum + item.reqQty, 0);

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in-0 slide-in-from-bottom-6 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 flex flex-col max-h-[92vh] sm:max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mt-2.5 mb-0.5 sm:hidden shrink-0" />

        {/* Header */}
        <div className="px-5 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/60 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#037ef3]/10 text-[#037ef3] flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Request Basket</h2>
              <p className="text-[11px] text-slate-400">
                {items.length === 0
                  ? 'No items selected'
                  : `${items.length} unique asset${items.length > 1 ? 's' : ''} (${totalUnits} total units)`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {items.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs font-semibold text-slate-700">Your basket is empty</p>
              <p className="text-[11px] text-slate-400">
                Browse the catalog and tap the &quot;+&quot; button on items to add them.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Items List */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {items.map((item) => {
                  const thumb = getThumbnailUrl(item.asset.image, 'sm');
                  const isNumeric = typeof item.asset.remainingQty === 'number';
                  const maxQty =
                    isNumeric && (item.asset.remainingQty as number) > 0
                      ? (item.asset.remainingQty as number)
                      : 999;

                  return (
                    <div
                      key={`${item.asset.category}-${item.asset.rowIndex}`}
                      className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {thumb ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={thumb}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover bg-white border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 text-slate-400 font-bold text-xs flex items-center justify-center shrink-0">
                            {item.asset.name.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {item.asset.name}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {item.asset.category} · max {maxQty} {item.asset.unit || 'units'}
                          </p>
                        </div>
                      </div>

                      {/* Stepper + Delete */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5">
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateQty(
                                item.asset.category,
                                item.asset.rowIndex,
                                Math.max(1, item.reqQty - 1)
                              )
                            }
                            className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-7 text-center text-xs font-bold text-slate-800">
                            {item.reqQty}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateQty(
                                item.asset.category,
                                item.asset.rowIndex,
                                Math.min(maxQty, item.reqQty + 1)
                              )
                            }
                            className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.asset.category, item.asset.rowIndex)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Separated Requester Form */}
              <form id="bulk-request-form" onSubmit={handleSubmit} className="space-y-3 pt-2 border-t border-slate-100">
                <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Requester Details
                </p>

                {/* 1. Name Field */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#037ef3]" />
                    <span>Your Full Name <span className="text-rose-500">*</span></span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Perry"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#037ef3]"
                    required
                  />
                </div>

                {/* 2. Function / Department Field */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-[#037ef3]" />
                    <span>Function / Department <span className="text-rose-500">*</span></span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={func}
                      onChange={(e) => setFunc(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#037ef3] bg-white font-medium text-slate-800"
                    >
                      {COMMON_FUNCTIONS.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>

                    {func === 'Other' ? (
                      <input
                        type="text"
                        value={customFunc}
                        onChange={(e) => setCustomFunc(e.target.value)}
                        placeholder="Specify function"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#037ef3]"
                        required
                      />
                    ) : (
                      <div className="flex items-center px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500">
                        AIESEC LCAU
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Event Tracker Selection Field */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#037ef3]" />
                      <span>Event / Purpose <span className="text-rose-500">*</span></span>
                    </span>
                    {loadingEvents && (
                      <span className="text-[10px] text-slate-400">Loading upcoming events...</span>
                    )}
                  </label>

                  <select
                    value={selectedEvent}
                    onChange={(e) => setSelectedEvent(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#037ef3] bg-white font-medium text-slate-800"
                  >
                    {upcomingEvents.map((evt) => (
                      <option key={evt.id} value={evt.name}>
                        {evt.name} ({new Date(evt.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })})
                      </option>
                    ))}
                    <option value="__custom__">Other / Custom Event</option>
                  </select>

                  {selectedEvent === '__custom__' && (
                    <input
                      type="text"
                      value={customEvent}
                      onChange={(e) => setCustomEvent(e.target.value)}
                      placeholder="Enter specific event name or purpose..."
                      className="mt-2 w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#037ef3]"
                      required
                    />
                  )}

                  <p className="text-[10px] text-slate-400 mt-1">
                    Recorded in Google Sheets as: &quot;{name.trim() || 'Name'} / {func === 'Other' ? customFunc.trim() || 'Function' : func} / {selectedEvent === '__custom__' ? customEvent.trim() || 'Event' : selectedEvent || 'Event'}&quot;
                  </p>
                </div>

                <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3 text-xs text-slate-600 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-[#037ef3]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>How batch requests work</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-500">
                    Once submitted, all {items.length} items will be reserved under your name as{' '}
                    <span className="font-semibold text-slate-700">Pending Handover</span>. You can then collect the physical assets from the Asset Holder.
                  </p>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition"
            >
              Back to Catalog
            </button>

            <button
              type="submit"
              form="bulk-request-form"
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-lg bg-[#037ef3] text-white hover:bg-[#0263c2] transition shadow-2xs disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting {items.length} requests...</span>
                </>
              ) : (
                <span>Submit Request ({items.length} items)</span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
