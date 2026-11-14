'use client';

import React, { useState } from 'react';
import { X, Loader2, ExternalLink, AlertCircle } from 'lucide-react';
import { Asset } from '@/types/asset';
import { getThumbnailUrl, getDriveViewUrl } from '@/lib/image-utils';

interface RequestModalProps {
  isOpen: boolean;
  asset: Asset | null;
  onClose: () => void;
  onSuccess: (assetId: string) => void;
}

export default function RequestModal({ isOpen, asset, onClose, onSuccess }: RequestModalProps) {
  const [reqBy, setReqBy] = useState('');
  const [reqQty, setReqQty] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  if (!isOpen || !asset) return null;

  const thumbnailUrl = getThumbnailUrl(asset.image, 'lg');
  const viewUrl = getDriveViewUrl(asset.image);
  const isOut = asset.status === 'OUT';
  const isNumericRemaining = typeof asset.remainingQty === 'number';
  const isNumericTotal = typeof asset.totalQty === 'number';
  const maxAvailable = isNumericRemaining && asset.remainingQty > 0
    ? asset.remainingQty
    : (isNumericTotal ? (asset.totalQty as number) : 999);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!reqBy.trim()) {
      setError('Please enter your name and function.');
      return;
    }
    if (reqQty <= 0) {
      setError('Quantity must be at least 1.');
      return;
    }
    if (isNumericRemaining && asset.remainingQty > 0 && reqQty > asset.remainingQty) {
      setError(`Quantity must be between 1 and ${asset.remainingQty}.`);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/assets/${asset.category}/${asset.rowIndex}/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reqBy: reqBy.trim(), reqQty }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');

      onSuccess(asset.id);
      setReqBy('');
      setReqQty(1);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setReqBy('');
    setReqQty(1);
    setError(null);
    setImageError(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-xl shadow-xl border border-slate-200 overflow-hidden">
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
          <div className="w-20 h-20 rounded-lg border border-slate-200 bg-white overflow-hidden shrink-0 flex items-center justify-center">
            {thumbnailUrl && !imageError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={thumbnailUrl}
                alt={asset.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <span className="text-2xl font-bold text-slate-200 select-none">
                {asset.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {asset.category} · {asset.id}
            </p>
            <p className="text-base font-bold text-slate-900 mt-0.5 truncate">{asset.name}</p>

            <div className="flex items-center gap-3 mt-2">
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                isOut
                  ? 'bg-slate-100 text-slate-500'
                  : 'bg-emerald-50 text-emerald-700'
              }`}>
                {isOut ? 'OUT' : 'IN'}
              </span>
              <span className="text-xs text-slate-600">
                {isNumericRemaining && isNumericTotal ? (
                  <>
                    <span className="font-semibold text-slate-900">{asset.remainingQty}</span>
                    {' '}/{' '}{asset.totalQty} {asset.unit || 'units'} remaining
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-slate-900">{asset.totalQty}</span>
                    {' '}{asset.unit || ''} ({isOut ? 'Checked out' : 'In stock'})
                  </>
                )}
              </span>
              {viewUrl && (
                <a
                  href={viewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-[#037ef3] hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  View image
                </a>
              )}
            </div>
          </div>
        </div>

        {/* OUT Warning */}
        {isOut && (
          <div className="mx-5 mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-2 text-xs text-slate-700">
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
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Your Name / Function / Event
            </label>
            <input
              type="text"
              value={reqBy}
              onChange={(e) => setReqBy(e.target.value)}
              placeholder="e.g. Perry / MX / Culture Night"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#037ef3] placeholder:text-slate-400"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Format: Name / Function / Event Name
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Quantity Requested
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setReqQty((q) => Math.max(1, q - 1))}
                className="w-9 h-9 rounded-lg border border-slate-300 text-slate-700 font-bold text-base hover:bg-slate-50 transition flex items-center justify-center"
              >
                −
              </button>
              <input
                type="number"
                min={1}
                max={maxAvailable}
                value={reqQty}
                onChange={(e) => setReqQty(parseInt(e.target.value, 10) || 1)}
                className="w-20 text-center px-3 py-2 text-sm font-semibold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#037ef3]"
                required
              />
              <button
                type="button"
                onClick={() => setReqQty((q) => Math.min(maxAvailable, q + 1))}
                className="w-9 h-9 rounded-lg border border-slate-300 text-slate-700 font-bold text-base hover:bg-slate-50 transition flex items-center justify-center"
              >
                +
              </button>
              <span className="text-xs text-slate-400">
                of {asset.remainingQty} available
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || isOut}
              className="flex-1 inline-flex justify-center items-center gap-2 py-2.5 text-sm font-semibold text-white bg-[#037ef3] hover:bg-[#0263c2] rounded-lg transition shadow-sm disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isOut ? 'Currently Unavailable' : 'Confirm Request'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
