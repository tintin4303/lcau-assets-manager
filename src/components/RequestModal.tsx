'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, ExternalLink, AlertCircle, User, Building, Calendar } from 'lucide-react';
import { Asset } from '@/types/asset';
import { LCAUEvent } from '@/types/event';
import { getThumbnailUrl, getDriveViewUrl } from '@/lib/image-utils';

interface RequestModalProps {
  isOpen: boolean;
  asset: Asset | null;
  onClose: () => void;
  onSuccess: (assetId: string) => void;
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

export default function RequestModal({ isOpen, asset, onClose, onSuccess }: RequestModalProps) {
  // Separated Fields
  const [name, setName] = useState('');
  const [func, setFunc] = useState('oGX');
  const [customFunc, setCustomFunc] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('');
  const [customEvent, setCustomEvent] = useState('');
  const [reqQty, setReqQty] = useState(1);

  const [upcomingEvents, setUpcomingEvents] = useState<LCAUEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  // Load upcoming events
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
        .catch(() => {
          setSelectedEvent('__custom__');
        })
        .finally(() => setLoadingEvents(false));
    }
  }, [isOpen]);

  if (!isOpen || !asset) return null;

  const thumbnailUrl = getThumbnailUrl(asset.image, 'lg');
  const viewUrl = getDriveViewUrl(asset.image);
  const isOut = asset.status === 'OUT';
  const isNumericRemaining = typeof asset.remainingQty === 'number';
  const remainingNum = isNumericRemaining ? (asset.remainingQty as number) : 0;
  const isNumericTotal = typeof asset.totalQty === 'number';
  const totalNum = isNumericTotal ? (asset.totalQty as number) : 999;
  const maxAvailable = isNumericRemaining && remainingNum > 0 ? remainingNum : totalNum;

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

    if (reqQty <= 0) {
      setError('Quantity must be at least 1.');
      return;
    }
    if (isNumericRemaining && remainingNum > 0 && reqQty > remainingNum) {
      setError(`Quantity must be between 1 and ${remainingNum}.`);
      return;
    }

    // Format for Google Sheets Column H
    const combinedReqBy = `${trimmedName} / ${finalFunc} / ${finalEvent}`;

    setLoading(true);

    try {
      const res = await fetch(`/api/assets/${asset.category}/${asset.rowIndex}/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reqBy: combinedReqBy, reqQty }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');

      onSuccess(asset.id);
      setName('');
      setCustomFunc('');
      setCustomEvent('');
      setReqQty(1);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setCustomFunc('');
    setCustomEvent('');
    setReqQty(1);
    setError(null);
    setImageError(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in-0 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Request Asset</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              This will update the inventory sheet in real time.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Asset Preview */}
        <div className="flex items-start gap-4 px-5 py-4 bg-slate-50 border-b border-slate-100">
          {/* Image */}
          <div className="w-16 h-16 rounded-xl border border-slate-200 bg-white overflow-hidden shrink-0 flex items-center justify-center">
            {thumbnailUrl && !imageError ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={thumbnailUrl}
                alt={asset.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <span className="text-xl font-bold text-slate-300 select-none">
                {asset.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              {asset.category} · {asset.id}
            </p>
            <p className="text-sm font-bold text-slate-900 mt-0.5 truncate">{asset.name}</p>

            <div className="flex items-center gap-2 mt-1">
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  isOut ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-700'
                }`}
              >
                {isOut ? 'OUT' : 'IN'}
              </span>
              <span className="text-xs text-slate-600">
                {isNumericRemaining && isNumericTotal ? (
                  <>
                    <span className="font-semibold text-slate-900">{asset.remainingQty}</span> /{' '}
                    {asset.totalQty} {asset.unit || 'units'} available
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-slate-900">{asset.totalQty}</span>{' '}
                    {asset.unit || ''} ({isOut ? 'Checked out' : 'In stock'})
                  </>
                )}
              </span>
              {viewUrl && (
                <a
                  href={viewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-[#037ef3] hover:underline ml-auto"
                >
                  <ExternalLink className="w-3 h-3" />
                  View
                </a>
              )}
            </div>
          </div>
        </div>

        {/* OUT Warning */}
        {isOut && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2 text-xs text-slate-700">
            <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Currently checked out</p>
              <p className="text-slate-500 mt-0.5">
                Requested by: {asset.reqBy || 'Unknown'} ({asset.reqQty} {asset.unit || 'unit(s)'}).
                Contact your Asset Holder to confirm availability.
              </p>
            </div>
          </div>
        )}

        {/* Request Form */}
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3.5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          {/* 1. Name */}
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

          {/* 2. Function */}
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

          {/* 3. Event Tracker Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#037ef3]" />
                <span>Event / Purpose <span className="text-rose-500">*</span></span>
              </span>
              {loadingEvents && (
                <span className="text-[10px] text-slate-400">Loading events...</span>
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
          </div>

          {/* 4. Quantity Requested */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Quantity Requested
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setReqQty((q) => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-lg border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-50 transition flex items-center justify-center"
              >
                −
              </button>
              <input
                type="number"
                min={1}
                max={maxAvailable}
                value={reqQty}
                onChange={(e) => setReqQty(parseInt(e.target.value, 10) || 1)}
                className="w-16 text-center px-2 py-1.5 text-xs font-bold border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#037ef3]"
                required
              />
              <button
                type="button"
                onClick={() => setReqQty((q) => Math.min(maxAvailable, q + 1))}
                className="w-8 h-8 rounded-lg border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-50 transition flex items-center justify-center"
              >
                +
              </button>
              <span className="text-xs text-slate-400">
                of {String(asset.remainingQty)} available
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || isOut}
              className="flex-1 inline-flex justify-center items-center gap-2 py-2 text-xs font-bold text-white bg-[#037ef3] hover:bg-[#0263c2] rounded-xl transition shadow-xs disabled:opacity-50"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isOut ? 'Currently Unavailable' : 'Confirm Request'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
