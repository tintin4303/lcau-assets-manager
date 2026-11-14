'use client';

import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  User,
  Package,
  Layers,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  Maximize2,
} from 'lucide-react';
import { Asset } from '@/types/asset';
import { getThumbnailUrl, getDriveViewUrl } from '@/lib/image-utils';

interface AssetDetailModalProps {
  asset: Asset | null;
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
  onRequestClick: (asset: Asset) => void;
  onEditClick: (asset: Asset) => void;
  onDeleteClick: (asset: Asset) => void;
  onStatusToggle: (asset: Asset) => void;
  isTogglingStatus: boolean;
  onImageClick?: (rawImage: string) => void;
}

export default function AssetDetailModal({
  asset,
  isOpen,
  onClose,
  isAdmin,
  onRequestClick,
  onEditClick,
  onDeleteClick,
  onStatusToggle,
  isTogglingStatus,
  onImageClick,
}: AssetDetailModalProps) {
  const [imageError, setImageError] = useState(false);

  if (!isOpen || !asset) return null;

  const thumbnailUrl = getThumbnailUrl(asset.image, 'lg');
  const viewUrl = getDriveViewUrl(asset.image);
  const isOut = asset.status === 'OUT';
  const isNumericRemaining = typeof asset.remainingQty === 'number';
  const hasRemaining = isOut ? false : (isNumericRemaining ? asset.remainingQty > 0 : true);
  const hasImage = !!thumbnailUrl && !imageError;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 shadow-2xs">
              {asset.id || 'NO-ID'}
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-150 text-slate-600 bg-slate-200/60">
              {asset.category}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* Main Title & Status Row */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-slate-950 leading-snug">
                {asset.name}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Category: <span className="text-slate-700 font-medium">{asset.category}</span>
                {asset.unit && <> · Unit: <span className="text-slate-700 font-medium">{asset.unit}</span></>}
              </p>
            </div>

            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold shrink-0 self-start ${
                isOut
                  ? 'bg-slate-900 text-white'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${isOut ? 'bg-amber-400' : 'bg-emerald-500'}`}
              />
              {isOut ? 'OUT (Checked out)' : 'IN (Available)'}
            </span>
          </div>

          {/* Photo & Quantities Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
            {/* Image Preview Box */}
            <div className="relative aspect-4/3 sm:aspect-square w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200 group">
              {hasImage ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={thumbnailUrl}
                    alt={asset.name}
                    referrerPolicy="no-referrer"
                    onClick={() => onImageClick?.(asset.image)}
                    className="w-full h-full object-cover cursor-pointer hover:scale-102 transition duration-200"
                    onError={() => setImageError(true)}
                  />
                  <div
                    onClick={() => onImageClick?.(asset.image)}
                    className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/15 transition cursor-pointer flex items-center justify-center"
                  >
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm border border-slate-200 flex items-center gap-1.5">
                      <Maximize2 className="w-3 h-3" />
                      <span>Full view</span>
                    </span>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
                  <span className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 font-bold text-lg mb-1 shadow-2xs">
                    {asset.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">No photo available</span>
                </div>
              )}

              {viewUrl && (
                <a
                  href={viewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-white/90 backdrop-blur-sm text-slate-600 hover:text-slate-950 border border-slate-200 shadow-sm transition"
                  title="Open in Google Drive"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            {/* Inventory Metrics */}
            <div className="space-y-3">
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2.5">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Inventory Quantities
                </p>

                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div className="p-2 rounded-lg bg-white border border-slate-200/60 shadow-2xs">
                    <p className="text-[10px] text-slate-500 font-medium">Total</p>
                    <p className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 break-words">
                      {asset.totalQty}
                    </p>
                    {asset.unit && <p className="text-[10px] text-slate-400">{asset.unit}</p>}
                  </div>

                  <div className="p-2 rounded-lg bg-white border border-slate-200/60 shadow-2xs">
                    <p className="text-[10px] text-slate-500 font-medium">In Stock</p>
                    <p className={`text-xs sm:text-sm font-bold mt-0.5 break-words ${hasRemaining ? 'text-slate-950' : 'text-rose-600'}`}>
                      {asset.remainingQty}
                    </p>
                    {asset.unit && <p className="text-[10px] text-slate-400">{asset.unit}</p>}
                  </div>

                  <div className="p-2 rounded-lg bg-white border border-slate-200/60 shadow-2xs">
                    <p className="text-[10px] text-slate-500 font-medium">Requested</p>
                    <p className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5">
                      {asset.reqQty || 0}
                    </p>
                    {asset.unit && <p className="text-[10px] text-slate-400">{asset.unit}</p>}
                  </div>
                </div>
              </div>

              {/* Requester Information Card */}
              {asset.reqBy || isOut ? (
                <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#037ef3] mb-1">
                    <User className="w-3.5 h-3.5" />
                    <span>Requested / Checked Out By</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 break-words">
                    {asset.reqBy || <span className="text-slate-400 font-normal italic">No name recorded</span>}
                  </p>
                  {asset.reqQty > 0 && (
                    <p className="text-xs text-slate-500 mt-1">
                      Quantity: <span className="font-semibold text-slate-800">{asset.reqQty} {asset.unit}</span>
                    </p>
                  )}
                </div>
              ) : (
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 flex items-center gap-2 text-xs text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Item is in stock and available for checkout.</span>
                </div>
              )}

              {/* View in Drive Link */}
              {viewUrl && (
                <a
                  href={viewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#037ef3] hover:underline pt-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>View full resolution on Google Drive</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer with Actions */}
        <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-2">
          {isAdmin ? (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Mark IN/OUT */}
              <button
                type="button"
                onClick={() => onStatusToggle(asset)}
                disabled={isTogglingStatus}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition disabled:opacity-50 ${
                  isOut
                    ? 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                {isTogglingStatus ? 'Updating...' : isOut ? 'Mark as IN' : 'Mark as OUT'}
              </button>

              {/* Edit */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditClick(asset);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition"
              >
                <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Edit</span>
              </button>

              {/* Delete */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDeleteClick(asset);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-rose-600 hover:bg-rose-50 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                onClose();
                onRequestClick(asset);
              }}
              disabled={isOut || !hasRemaining}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
                isOut || !hasRemaining
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-[#037ef3] text-white hover:bg-[#0263c2]'
              }`}
            >
              {isOut ? 'Unavailable' : 'Request This Asset'}
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition ml-auto"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
