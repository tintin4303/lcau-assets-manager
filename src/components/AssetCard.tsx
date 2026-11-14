'use client';

import React, { useState } from 'react';
import { ArrowUpRight, Edit2, Trash2, Info } from 'lucide-react';
import { Asset } from '@/types/asset';
import { getThumbnailUrl } from '@/lib/image-utils';

interface AssetCardProps {
  asset: Asset;
  isAdmin: boolean;
  onRequestClick: (asset: Asset) => void;
  onEditClick: (asset: Asset) => void;
  onDeleteClick: (asset: Asset) => void;
  onStatusToggle: (asset: Asset) => void;
  onDetailClick: (asset: Asset) => void;
  onImageClick?: (rawImage: string) => void;
  isTogglingStatus: boolean;
}

export default function AssetCard({
  asset,
  isAdmin,
  onRequestClick,
  onEditClick,
  onDeleteClick,
  onStatusToggle,
  onDetailClick,
  onImageClick,
  isTogglingStatus,
}: AssetCardProps) {
  const [imageError, setImageError] = useState(false);

  const thumbnailUrl = getThumbnailUrl(asset.image, 'lg');
  const isOut = asset.status === 'OUT';
  const isNumericRemaining = typeof asset.remainingQty === 'number';
  const isNumericTotal = typeof asset.totalQty === 'number';
  const hasRemaining = isOut ? false : (isNumericRemaining ? asset.remainingQty > 0 : true);
  const hasImage = !!thumbnailUrl && !imageError;

  const availabilityBadge = isOut
    ? '0 available'
    : isNumericRemaining && isNumericTotal
    ? `${asset.remainingQty}/${asset.totalQty} available`
    : `${asset.totalQty} available`;

  const subtitle = [asset.category, asset.unit].filter(Boolean).join(' · ');

  return (
    <div
      onClick={() => onDetailClick(asset)}
      className="group relative rounded-2xl overflow-hidden border border-slate-200 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer select-none"
      style={{ aspectRatio: '3/4' }}
    >
      {/* ── BACKGROUND IMAGE (fills entire card) ───────────── */}
      {hasImage ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={thumbnailUrl}
          alt={asset.name}
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="absolute inset-0 bg-slate-100 flex flex-col items-center justify-center gap-2">
          <span className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 font-bold text-lg shadow-xs">
            {asset.name.charAt(0).toUpperCase()}
          </span>
          <span className="text-[11px] text-slate-400 font-medium">No photo</span>
        </div>
      )}

      {/* ── TOP BADGES ─────────────────────────────────────── */}
      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10 gap-2">
        <span
          className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-900/65 backdrop-blur-sm text-white shadow-sm max-w-[155px] truncate"
          title={availabilityBadge}
        >
          {availabilityBadge}
        </span>

        <span
          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full shadow-sm ${
            isOut ? 'bg-slate-900/80 text-white' : 'bg-[#037ef3]/90 text-white'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${isOut ? 'bg-amber-400' : 'bg-white'}`} />
          {isOut ? 'OUT' : 'IN'}
        </span>
      </div>

      {/* ── BOTTOM WHITE INFO PANEL ────────────────────────── */}
      <div className="absolute bottom-2 left-2 right-2 bg-white/92 backdrop-blur-md rounded-2xl border border-white/70 shadow-sm px-3 pt-2.5 pb-2 flex flex-col gap-0.5 group-hover:bg-white/98 transition-colors">
        {/* Row 1: Name + Quick Action Button */}
        <div className="flex items-start justify-between gap-1.5">
          <h3
            className="text-xs sm:text-sm font-extrabold text-slate-950 leading-snug line-clamp-2 flex-1"
            title={asset.name}
          >
            {asset.name}
          </h3>

          {/* Quick Action Button */}
          {isAdmin ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onStatusToggle(asset);
              }}
              disabled={isTogglingStatus}
              className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] transition disabled:opacity-50 ${
                isOut
                  ? 'bg-slate-900 text-white hover:bg-slate-700'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              title={isOut ? 'Mark IN' : 'Mark OUT'}
            >
              {isTogglingStatus ? (
                <span className="w-2.5 h-2.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                isOut ? 'IN' : 'OUT'
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRequestClick(asset);
              }}
              disabled={isOut || !hasRemaining}
              className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition ${
                isOut || !hasRemaining
                  ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                  : 'bg-slate-900 text-white hover:bg-slate-700'
              }`}
              title={isOut ? 'Unavailable' : 'Request'}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Row 2: Subtitle or Requester + Admin tools / Info hint */}
        <div className="flex items-center justify-between gap-1 min-h-[16px] text-[10px] sm:text-[11px] font-medium text-slate-600">
          <p className="truncate flex-1 leading-tight" title={isOut && asset.reqBy ? `By: ${asset.reqBy}` : subtitle}>
            {isOut && asset.reqBy ? (
              <span>
                <strong className="text-slate-800">By:</strong> {asset.reqBy}
                {asset.reqQty > 0 && <span className="text-slate-400 ml-1">({asset.reqQty} req)</span>}
              </span>
            ) : (
              subtitle || '\u00A0'
            )}
          </p>

          <div className="flex items-center gap-0.5 shrink-0">
            {isAdmin ? (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditClick(asset);
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-[#037ef3] hover:bg-blue-50 transition"
                  title="Edit"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteClick(asset);
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                  title="Delete"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </>
            ) : (
              <span className="text-[10px] font-semibold text-[#037ef3] group-hover:underline">
                Details &rarr;
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
