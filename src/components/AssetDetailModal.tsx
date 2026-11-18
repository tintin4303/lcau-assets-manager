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
  Plus,
  Check,
  Minus,
  ShoppingBag,
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
  onAddToCart?: (asset: Asset) => void;
  onUpdateCartQty?: (category: string, rowIndex: number, qty: number) => void;
  onRemoveCartItem?: (category: string, rowIndex: number) => void;
  isInCart?: boolean;
  cartQty?: number;
  onOpenCart?: () => void;
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
  onAddToCart,
  onUpdateCartQty,
  onRemoveCartItem,
  isInCart = false,
  cartQty = 0,
  onOpenCart,
  isTogglingStatus,
  onImageClick,
}: AssetDetailModalProps) {
  const [imageError, setImageError] = useState(false);

  if (!isOpen || !asset) return null;

  const thumbnailUrl = getThumbnailUrl(asset.image, 'lg');
  const viewUrl = getDriveViewUrl(asset.image);
  const isOut = asset.status === 'OUT';
  const isPending = asset.status === 'IN' && !!asset.reqBy?.trim();
  const isNumericRemaining = typeof asset.remainingQty === 'number';
  const hasRemaining = (isOut || isPending) ? false : (isNumericRemaining ? (asset.remainingQty as number) > 0 : true);
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

            {isOut ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-900 text-white shrink-0 self-start">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                OUT (Checked out)
              </span>
            ) : isPending ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200/90 shrink-0 self-start">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                REQUESTED (Pending Handover)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shrink-0 self-start">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                IN (Available)
              </span>
            )}
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
                <div
                  className={`border rounded-xl p-3.5 ${
                    isPending
                      ? 'bg-amber-50/80 border-amber-200'
                      : 'bg-blue-50/60 border-blue-100'
                  }`}
                >
                  <div
                    className={`flex items-center gap-1.5 text-xs font-semibold mb-1 ${
                      isPending ? 'text-amber-800' : 'text-[#037ef3]'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>{isPending ? 'Requested By (Pending Handover)' : 'Checked Out By'}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 break-words">
                    {asset.reqBy || <span className="text-slate-400 font-normal italic">No name recorded</span>}
                  </p>
                  {asset.reqQty > 0 && (
                    <p className="text-xs text-slate-500 mt-1">
                      Quantity requested: <span className="font-semibold text-slate-800">{asset.reqQty} {asset.unit}</span>
                    </p>
                  )}
                  {isPending && isAdmin && (
                    <p className="text-[11px] text-amber-700 mt-2 font-medium bg-amber-100/60 p-1.5 rounded-lg border border-amber-200/60">
                      Member has requested this item. Click &quot;Hand Over&quot; below once you physically hand over the assets.
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
              {/* Mark IN/OUT & Handover */}
              <button
                type="button"
                onClick={() => onStatusToggle(asset)}
                disabled={isTogglingStatus}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg border transition disabled:opacity-50 ${
                  isOut
                    ? 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'
                    : isPending
                    ? 'bg-amber-500 text-white border-amber-500 hover:bg-amber-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                {isTogglingStatus
                  ? 'Updating...'
                  : isOut
                  ? 'Mark as Returned (IN)'
                  : isPending
                  ? 'Hand Over (Mark OUT)'
                  : 'Mark as OUT'}
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
          ) : isInCart ? (
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Inline Stepper */}
              <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-0.5">
                <button
                  type="button"
                  onClick={() => {
                    if (cartQty <= 1) {
                      onRemoveCartItem?.(asset.category, asset.rowIndex);
                    } else {
                      onUpdateCartQty?.(asset.category, asset.rowIndex, cartQty - 1);
                    }
                  }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-700 hover:text-slate-950 hover:bg-white active:bg-slate-200 transition"
                  title={cartQty <= 1 ? 'Remove from basket' : 'Decrease quantity'}
                >
                  {cartQty <= 1 ? (
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  ) : (
                    <Minus className="w-3.5 h-3.5" />
                  )}
                </button>

                <div className="px-3 text-center min-w-[50px]">
                  <span className="text-xs font-black text-slate-900 block leading-tight">{cartQty}</span>
                  <span className="text-[9px] text-slate-400 font-medium leading-none">in basket</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const isNum = typeof asset.remainingQty === 'number';
                    const max = isNum && (asset.remainingQty as number) > 0 ? (asset.remainingQty as number) : 999;
                    onUpdateCartQty?.(asset.category, asset.rowIndex, Math.min(max, cartQty + 1));
                  }}
                  disabled={typeof asset.remainingQty === 'number' && cartQty >= (asset.remainingQty as number)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-700 hover:text-slate-950 hover:bg-white active:bg-slate-200 transition disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {onOpenCart && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenCart();
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-[#037ef3] text-white hover:bg-[#0263c2] transition shadow-2xs"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>View Basket</span>
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (onAddToCart) {
                  onAddToCart(asset);
                } else {
                  onClose();
                  onRequestClick(asset);
                }
              }}
              disabled={isOut || isPending || !hasRemaining}
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition ${
                isOut || isPending || !hasRemaining
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-[#037ef3] text-white hover:bg-[#0263c2] shadow-2xs'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>
                {isOut
                  ? 'Unavailable (Checked Out)'
                  : isPending
                  ? 'Requested (Pending Handover)'
                  : 'Add to Request Basket'}
              </span>
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
