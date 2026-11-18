'use client';

import React, { useState } from 'react';
import { Trash2, Plus, Minus } from 'lucide-react';
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
  onAddToCart?: (asset: Asset) => void;
  onUpdateCartQty?: (category: string, rowIndex: number, qty: number) => void;
  onRemoveCartItem?: (category: string, rowIndex: number) => void;
  isInCart?: boolean;
  cartQty?: number;
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
  onAddToCart,
  onUpdateCartQty,
  onRemoveCartItem,
  isInCart,
  cartQty = 0,
  isTogglingStatus,
}: AssetCardProps) {
  const [imageError, setImageError] = useState(false);

  React.useEffect(() => {
    setImageError(false);
  }, [asset.image]);

  const thumbnailUrl = getThumbnailUrl(asset.image, 'lg');
  const isOut = asset.status === 'OUT';
  const isPending = asset.status === 'IN' && !!asset.reqBy?.trim();
  const isNumericRemaining = typeof asset.remainingQty === 'number';
  const hasRemaining = (isOut || isPending) ? false : (isNumericRemaining ? (asset.remainingQty as number) > 0 : true);
  const hasImage = !!thumbnailUrl && !imageError;
  const maxQty = isNumericRemaining && (asset.remainingQty as number) > 0 ? (asset.remainingQty as number) : 999;

  const availabilityText = isOut
    ? '0 available'
    : isPending
    ? 'Pending'
    : isNumericRemaining
    ? `${asset.remainingQty} available`
    : `${asset.totalQty} available`;

  return (
    <div
      onClick={() => onDetailClick(asset)}
      className="group relative rounded-2xl overflow-hidden border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer select-none bg-slate-100"
      style={{ aspectRatio: '3/4' }}
    >
      {/* ── FULL BACKGROUND IMAGE ──────────────────────────── */}
      {hasImage ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          key={thumbnailUrl || 'image'}
          src={thumbnailUrl}
          alt={asset.name}
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="absolute inset-0 bg-slate-100 flex flex-col items-center justify-center gap-1.5">
          <span className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 font-bold text-lg shadow-2xs">
            {asset.name.charAt(0).toUpperCase()}
          </span>
          <span className="text-[11px] text-slate-400 font-medium">No photo</span>
        </div>
      )}

      {/* ── ADMIN ONLY TOP STATUS BADGE ───────────────────── */}
      {isAdmin && (
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs bg-slate-900/80 text-white backdrop-blur-xs">
            {availabilityText}
          </span>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs text-white ${
              isOut ? 'bg-rose-600' : isPending ? 'bg-amber-500' : 'bg-emerald-600'
            }`}
          >
            {isOut ? 'OUT' : isPending ? 'PENDING' : 'IN'}
          </span>
        </div>
      )}

      {/* ── BOTTOM OVERLAY PANEL ───────────────────────────── */}
      <div className="absolute bottom-2 left-2 right-2 bg-white/95 backdrop-blur-md rounded-xl border border-white/80 shadow-sm p-2 sm:p-2.5 flex items-center justify-between gap-2 group-hover:bg-white transition-colors">
        {/* Left: Asset Name (Plus Available Count for requesters only) */}
        <div className="min-w-0 flex-1">
          <h3
            className="text-xs sm:text-sm font-extrabold text-slate-950 truncate leading-tight"
            title={asset.name}
          >
            {asset.name}
          </h3>
          {!isAdmin && (
            <p
              className={`text-[10px] sm:text-[11px] font-semibold mt-0.5 truncate leading-none ${
                isOut
                  ? 'text-slate-400'
                  : isPending
                  ? 'text-amber-600'
                  : 'text-[#037ef3]'
              }`}
            >
              {availabilityText}
            </p>
          )}
        </div>

        {/* Right: Actions */}
        {isAdmin ? (
          /* Admin Controls: Status Toggle Only */
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onStatusToggle(asset);
            }}
            disabled={isTogglingStatus}
            className={`h-7 px-2.5 rounded-lg flex items-center justify-center font-bold text-[10px] shrink-0 transition disabled:opacity-50 ${
              isOut
                ? 'bg-slate-900 text-white hover:bg-slate-700'
                : isPending
                ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {isTogglingStatus ? (
              <span className="w-2.5 h-2.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : isOut ? (
              'IN'
            ) : isPending ? (
              'Hand Over'
            ) : (
              'OUT'
            )}
          </button>
        ) : isInCart ? (
          /* Requester: In-basket Stepper */
          <div
            onClick={(e) => e.stopPropagation()}
            className="shrink-0 h-8 flex items-center bg-[#037ef3] text-white rounded-xl p-0.5 shadow-2xs"
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (cartQty <= 1) {
                  onRemoveCartItem?.(asset.category, asset.rowIndex);
                } else {
                  onUpdateCartQty?.(asset.category, asset.rowIndex, cartQty - 1);
                }
              }}
              className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-black/15 active:bg-black/25 transition text-white"
              title={cartQty <= 1 ? 'Remove from basket' : 'Decrease'}
              aria-label="Decrease quantity"
            >
              {cartQty <= 1 ? (
                <Trash2 className="w-3 h-3 text-white" />
              ) : (
                <Minus className="w-3 h-3 text-white" />
              )}
            </button>

            <span className="min-w-[18px] px-1 text-center text-xs font-black select-none leading-none">
              {cartQty}
            </span>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onUpdateCartQty?.(
                  asset.category,
                  asset.rowIndex,
                  Math.min(maxQty, cartQty + 1)
                );
              }}
              disabled={isNumericRemaining && cartQty >= (asset.remainingQty as number)}
              className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-black/15 active:bg-black/25 transition disabled:opacity-35 disabled:cursor-not-allowed text-white"
              title="Increase"
              aria-label="Increase quantity"
            >
              <Plus className="w-3 h-3 text-white" />
            </button>
          </div>
        ) : (
          /* Requester: Clean "+" Add Button */
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart ? onAddToCart(asset) : onRequestClick(asset);
            }}
            disabled={isOut || isPending || !hasRemaining}
            className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition ${
              isOut || isPending || !hasRemaining
                ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                : 'bg-[#037ef3] text-white hover:bg-[#0263c2] active:scale-95 shadow-2xs'
            }`}
            title={
              isOut
                ? 'Unavailable'
                : isPending
                ? 'Requested · Pending handover'
                : 'Add to basket'
            }
            aria-label="Add to basket"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </button>
        )}
      </div>
    </div>
  );
}
