'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  Search,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  LayoutGrid,
  List,
  Layers,
  CheckCircle2,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { Asset, AssetCategory } from '@/types/asset';
import AssetCard from './AssetCard';
import AssetDetailModal from './AssetDetailModal';
import CustomDropdown, { DropdownOption } from './CustomDropdown';
import { getThumbnailUrl, getDriveViewUrl } from '@/lib/image-utils';

type ViewMode = 'grid' | 'list';

interface AssetTableProps {
  assets: Asset[];
  loading: boolean;
  isAdmin: boolean;
  onRefresh: () => void;
  onAddClick: () => void;
  onEditClick: (asset: Asset) => void;
  onDeleteClick: (asset: Asset) => void;
  onRequestClick: (asset: Asset) => void;
  onStatusToggle: (asset: Asset) => void;
  togglingId: string | null;
}

export default function AssetTable({
  assets,
  loading,
  isAdmin,
  onRefresh,
  onAddClick,
  onEditClick,
  onDeleteClick,
  onRequestClick,
  onStatusToggle,
  togglingId,
}: AssetTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | AssetCategory>('All');
  const [selectedStatus, setSelectedStatus] = useState<'All' | 'IN' | 'OUT'>('All');
  // Default: grid for public, list for admin
  const [viewMode, setViewMode] = useState<ViewMode>(isAdmin ? 'list' : 'grid');
  const [detailAsset, setDetailAsset] = useState<Asset | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [lightboxViewUrl, setLightboxViewUrl] = useState<string | null>(null);

  // Keep detail modal asset in sync with latest assets array (e.g. on status toggle)
  const activeDetailAsset = useMemo(() => {
    if (!detailAsset) return null;
    return (
      assets.find(
        (a) => a.category === detailAsset.category && a.rowIndex === detailAsset.rowIndex
      ) || detailAsset
    );
  }, [detailAsset, assets]);

  const filteredAssets = useMemo(() => {
    return assets.filter((item) => {
      if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
      if (selectedStatus !== 'All') {
        const s = item.status === 'OUT' ? 'OUT' : 'IN';
        if (s !== selectedStatus) return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        if (
          !item.id.toLowerCase().includes(q) &&
          !item.name.toLowerCase().includes(q) &&
          !item.reqBy.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [assets, selectedCategory, selectedStatus, searchTerm]);

  const counts = useMemo(() => ({
    total: assets.length,
    inCount: assets.filter((a) => a.status !== 'OUT').length,
    outCount: assets.filter((a) => a.status === 'OUT').length,
    Stationary: assets.filter((a) => a.category === 'Stationary').length,
    Decoration: assets.filter((a) => a.category === 'Decoration').length,
    General: assets.filter((a) => a.category === 'General').length,
  }), [assets]);

  const categoryOptions: DropdownOption<'All' | AssetCategory>[] = useMemo(() => [
    { value: 'All', label: 'All Categories', badge: counts.total },
    { value: 'Stationary', label: 'Stationary', badge: counts.Stationary },
    { value: 'Decoration', label: 'Decoration', badge: counts.Decoration },
    { value: 'General', label: 'General', badge: counts.General },
  ], [counts]);

  const statusOptions: DropdownOption<'All' | 'IN' | 'OUT'>[] = useMemo(() => [
    { value: 'All', label: 'All Status', badge: counts.total },
    {
      value: 'IN',
      label: 'IN (Available)',
      badge: counts.inCount,
      icon: <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />,
    },
    {
      value: 'OUT',
      label: 'OUT (Checked out)',
      badge: counts.outCount,
      icon: <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />,
    },
  ], [counts]);

  const openLightbox = useCallback((raw: string) => {
    const thumb = getThumbnailUrl(raw, 'lg');
    const view = getDriveViewUrl(raw);
    if (thumb) {
      setLightboxSrc(thumb);
      setLightboxViewUrl(view);
    }
  }, []);

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total</span>
            <Layers className="w-3.5 h-3.5 text-slate-300" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{counts.total}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">3 categories</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">In Stock</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-slate-300" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{counts.inCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Available</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Out</span>
            <Clock className="w-3.5 h-3.5 text-slate-300" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{counts.outCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Checked out</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="mb-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">By Category</span>
          </div>
          <div className="text-xs space-y-0.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Stationary</span>
              <span className="font-semibold text-slate-900">{counts.Stationary}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Decoration</span>
              <span className="font-semibold text-slate-900">{counts.Decoration}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">General</span>
              <span className="font-semibold text-slate-900">{counts.General}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-3 sm:p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search name, ID, or requester..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#037ef3]/20 focus:border-[#037ef3] transition shadow-2xs placeholder:text-slate-400"
            />
          </div>

          {/* Filters & Actions */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
            {/* Category Dropdown */}
            <CustomDropdown
              value={selectedCategory}
              onChange={setSelectedCategory}
              options={categoryOptions}
              className="flex-1 sm:flex-initial"
            />

            {/* Status Dropdown */}
            <CustomDropdown
              value={selectedStatus}
              onChange={setSelectedStatus}
              options={statusOptions}
              className="flex-1 sm:flex-initial"
              align="right"
            />

            {/* View toggle */}
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200/60 shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition ${
                  viewMode === 'grid'
                    ? 'bg-white shadow-2xs text-[#037ef3]'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                title="Grid view"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition ${
                  viewMode === 'list'
                    ? 'bg-white shadow-2xs text-[#037ef3]'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                title="List view"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Refresh */}
            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition disabled:opacity-50 shadow-2xs shrink-0"
              title="Refresh data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Admin Add */}
            {isAdmin && (
              <button
                onClick={onAddClick}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#037ef3] text-white hover:bg-[#0263c2] transition shadow-2xs whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Asset</span>
              </button>
            )}
          </div>
        </div>

        {/* Grid View */}
        {viewMode === 'grid' && (
          <div className="p-4">
            {loading && assets.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin text-[#037ef3]" />
                <p className="text-xs font-medium">Loading inventory...</p>
              </div>
            ) : filteredAssets.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-sm font-semibold text-slate-700">No assets found</p>
                <p className="text-xs text-slate-400 mt-1">Try adjusting your search or filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                {filteredAssets.map((asset) => (
                  <AssetCard
                    key={`${asset.category}-${asset.rowIndex}`}
                    asset={asset}
                    isAdmin={isAdmin}
                    onRequestClick={onRequestClick}
                    onEditClick={onEditClick}
                    onDeleteClick={onDeleteClick}
                    onStatusToggle={onStatusToggle}
                    onDetailClick={(a) => setDetailAsset(a)}
                    onImageClick={openLightbox}
                    isTogglingStatus={togglingId === `${asset.category}-${asset.rowIndex}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-4">Asset ID</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-4">Asset Name</th>
                  <th className="py-2.5 px-3 text-center">Total</th>
                  <th className="py-2.5 px-3 text-center">Remaining</th>
                  <th className="py-2.5 px-3">Unit</th>
                  <th className="py-2.5 px-3 text-center">Image</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                  <th className="py-2.5 px-4">Requested By</th>
                  <th className="py-2.5 px-3 text-center">Req Qty</th>
                  <th className="py-2.5 px-4 text-right">
                    {isAdmin ? 'Actions' : 'Request'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && assets.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-16 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <RefreshCw className="w-5 h-5 animate-spin text-[#037ef3]" />
                        <p className="text-xs">Loading inventory from Google Sheets...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredAssets.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-16 text-center">
                      <p className="text-sm font-semibold text-slate-700">No assets found</p>
                      <p className="text-xs text-slate-400 mt-1">Adjust your search or filters.</p>
                    </td>
                  </tr>
                ) : (
                  filteredAssets.map((asset) => {
                    const isOut = asset.status === 'OUT';
                    const isToggling = togglingId === `${asset.category}-${asset.rowIndex}`;
                    const thumbnailUrl = getThumbnailUrl(asset.image, 'sm');
                    const viewUrl = getDriveViewUrl(asset.image);

                    return (
                      <tr
                        key={`${asset.category}-${asset.rowIndex}`}
                        className="hover:bg-slate-50 transition group"
                      >
                        <td className="py-2.5 px-4 font-mono font-medium text-slate-800 whitespace-nowrap">
                          {asset.id || '—'}
                        </td>

                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="text-[10px] font-medium text-slate-500">
                            {asset.category}
                          </span>
                        </td>

                        <td
                          onClick={() => setDetailAsset(asset)}
                          className="py-2.5 px-4 font-semibold text-slate-900 cursor-pointer hover:text-[#037ef3] transition"
                          title="Click to view details"
                        >
                          {asset.name}
                        </td>

                        <td className="py-2.5 px-3 text-center text-slate-600 font-medium">
                          {asset.totalQty}
                        </td>

                        <td className="py-2.5 px-3 text-center font-bold">
                          <span className="text-slate-900">{asset.remainingQty}</span>
                        </td>

                        <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                          {asset.unit || '—'}
                        </td>

                        {/* Image cell — thumbnail + open link */}
                        <td className="py-2 px-3 text-center">
                          {thumbnailUrl ? (
                            <button
                              onClick={() => openLightbox(asset.image)}
                              className="inline-block w-9 h-9 rounded-md overflow-hidden border border-slate-200 hover:border-[#037ef3] transition group/img"
                              title="Preview image"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={thumbnailUrl}
                                alt={asset.name}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover group-hover/img:scale-110 transition"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            </button>
                          ) : (
                            <span className="text-slate-300 text-xs">—</span>
                          )}
                        </td>

                        {/* Status — dot + weight only, no color */}
                        <td className="py-2.5 px-4 text-center whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wide ${
                            isOut ? 'text-slate-500' : 'text-slate-900'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full inline-block flex-shrink-0 ${
                              isOut ? 'bg-slate-400' : 'bg-slate-900'
                            }`} />
                            {isOut ? 'OUT' : 'IN'}
                          </span>
                        </td>

                        <td className="py-2.5 px-4 text-slate-500 max-w-[180px] truncate" title={asset.reqBy}>
                          {asset.reqBy || <span className="text-slate-300">—</span>}
                        </td>

                        <td className="py-2.5 px-3 text-center font-medium text-slate-700">
                          {asset.reqQty > 0 ? asset.reqQty : <span className="text-slate-300">0</span>}
                        </td>

                        {/* Actions / Request */}
                        <td className="py-2.5 px-4 text-right whitespace-nowrap">
                          {isAdmin ? (
                            <div className="flex items-center justify-end gap-1">
                              {/* Quick status toggle */}
                              <button
                                onClick={() => onStatusToggle(asset)}
                                disabled={isToggling}
                                className="px-2 py-1 text-[10px] font-semibold rounded border border-slate-300 text-slate-600 hover:bg-slate-100 transition disabled:opacity-50"
                                title={isOut ? 'Mark as IN' : 'Mark as OUT'}
                              >
                                {isToggling ? '...' : isOut ? '→ IN' : '→ OUT'}
                              </button>
                              <button
                                onClick={() => onEditClick(asset)}
                                className="p-1 rounded text-slate-400 hover:text-[#037ef3] hover:bg-blue-50 transition"
                                title="Edit"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onDeleteClick(asset)}
                                className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => onRequestClick(asset)}
                              disabled={isOut || (typeof asset.remainingQty === 'number' && asset.remainingQty <= 0)}
                              className={`px-3 py-1 text-[11px] font-semibold rounded-lg transition ${
                                isOut || (typeof asset.remainingQty === 'number' && asset.remainingQty <= 0)
                                  ? 'text-slate-400 bg-slate-100 cursor-not-allowed'
                                  : 'text-[#037ef3] border border-[#037ef3]/30 hover:bg-[#037ef3]/5'
                              }`}
                            >
                              {isOut ? 'Unavailable' : 'Request'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-1">
          <span>
            Showing <span className="font-semibold text-slate-700">{filteredAssets.length}</span> of{' '}
            <span className="font-semibold text-slate-700">{assets.length}</span> assets
          </span>
          <span>Live sync · Google Sheets API v4</span>
        </div>
      </div>

      {/* Asset Detail Modal */}
      <AssetDetailModal
        asset={activeDetailAsset}
        isOpen={!!activeDetailAsset}
        onClose={() => setDetailAsset(null)}
        isAdmin={isAdmin}
        onRequestClick={onRequestClick}
        onEditClick={onEditClick}
        onDeleteClick={onDeleteClick}
        onStatusToggle={onStatusToggle}
        isTogglingStatus={
          activeDetailAsset
            ? togglingId === `${activeDetailAsset.category}-${activeDetailAsset.rowIndex}`
            : false
        }
        onImageClick={openLightbox}
      />

      {/* Inline Lightbox */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/80 flex items-center justify-center p-4"
          onClick={() => setLightboxSrc(null)}
        >
          <div
            className="bg-white rounded-xl overflow-hidden shadow-2xl max-w-2xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-slate-50 flex justify-center max-h-[70vh] overflow-hidden p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lightboxSrc}
                alt="Asset preview"
                referrerPolicy="no-referrer"
                className="max-h-[65vh] object-contain rounded"
              />
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
              {lightboxViewUrl ? (
                <a
                  href={lightboxViewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-[#037ef3] font-medium hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open original in Google Drive
                </a>
              ) : <span />}
              <button
                onClick={() => setLightboxSrc(null)}
                className="text-xs font-semibold text-slate-700 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
