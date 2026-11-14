'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Loader2, Upload, Image as ImageIcon, ExternalLink, FolderOpen } from 'lucide-react';
import { Asset, AssetCategory, CreateAssetInput, UpdateAssetInput } from '@/types/asset';
import { getThumbnailUrl, getDriveViewUrl } from '@/lib/image-utils';

interface AssetModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  asset?: Asset | null;
  onClose: () => void;
  onSuccess: () => void;
  accessToken: string;
}

export default function AssetModal({
  isOpen,
  mode,
  asset,
  onClose,
  onSuccess,
  accessToken,
}: AssetModalProps) {
  const [category, setCategory] = useState<AssetCategory>('Stationary');
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [totalQty, setTotalQty] = useState<string | number>(1);
  const [unit, setUnit] = useState('');
  const [image, setImage] = useState('');
  const [status, setStatus] = useState<'IN' | 'OUT'>('IN');
  const [reqBy, setReqBy] = useState('');
  const [reqQty, setReqQty] = useState<number>(0);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (asset && mode === 'edit') {
      setCategory(asset.category);
      setId(asset.id);
      setName(asset.name);
      setTotalQty(asset.totalQty);
      setUnit(asset.unit);
      setImage(asset.image);
      setStatus(asset.status === 'OUT' ? 'OUT' : 'IN');
      setReqBy(asset.reqBy);
      setReqQty(asset.reqQty);
    } else {
      setCategory('Stationary');
      setId('');
      setName('');
      setTotalQty(1);
      setUnit('');
      setImage('');
      setStatus('IN');
      setReqBy('');
      setReqQty(0);
    }
    setError(null);
    setPreviewError(false);
    setLocalPreview(null);
  }, [asset, mode, isOpen]);

  if (!isOpen) return null;

  const previewThumbnail = localPreview || getThumbnailUrl(image);
  const previewDriveLink = getDriveViewUrl(image);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    // Show local preview immediately so the user sees their photo with 0ms delay
    const objectUrl = URL.createObjectURL(file);
    setLocalPreview(objectUrl);
    setPreviewError(false);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('assetId', id || 'asset');

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload image');
      }

      setImage(data.url);
      setPreviewError(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error uploading file';
      setError(message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!id.trim()) {
      setError('Asset ID is required.');
      return;
    }
    if (!name.trim()) {
      setError('Asset Name is required.');
      return;
    }
    const trimmedTotal = totalQty.toString().trim();
    if (!trimmedTotal) {
      setError('Total Asset Qty is required.');
      return;
    }
    if (reqQty < 0) {
      setError('Req Qty cannot be negative.');
      return;
    }

    const formattedTotalQty = /^\d+$/.test(trimmedTotal)
      ? parseInt(trimmedTotal, 10)
      : trimmedTotal;

    setLoading(true);

    try {
      if (mode === 'create') {
        const payload: CreateAssetInput = {
          category,
          id: id.trim(),
          name: name.trim(),
          totalQty: formattedTotalQty,
          unit: unit.trim(),
          image: image.trim(),
          status,
          reqBy: reqBy.trim(),
          reqQty: Number(reqQty),
        };

        const res = await fetch('/api/assets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to create asset');
        }
      } else if (mode === 'edit' && asset) {
        const payload: UpdateAssetInput = {
          name: name.trim(),
          totalQty: formattedTotalQty,
          unit: unit.trim(),
          image: image.trim(),
          status,
          reqBy: reqBy.trim(),
          reqQty: Number(reqQty),
        };

        const res = await fetch(`/api/assets/${asset.category}/${asset.rowIndex}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to update asset');
        }
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {mode === 'create' ? 'Add New Asset' : 'Edit Asset'}
            </h3>
            <p className="text-xs text-slate-500">
              {mode === 'create'
                ? 'Appends a new record to the selected tab.'
                : `Updating ${asset?.id} in tab: ${asset?.category}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category *
              </label>
              <select
                value={category}
                disabled={mode === 'edit'}
                onChange={(e) => setCategory(e.target.value as AssetCategory)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-hidden focus:ring-2 focus:ring-[#037ef3] disabled:bg-slate-100 disabled:text-slate-500"
              >
                <option value="Stationary">Stationary</option>
                <option value="Decoration">Decoration</option>
                <option value="General">General</option>
              </select>
            </div>

            {/* Asset ID */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Asset ID *
              </label>
              <input
                type="text"
                value={id}
                disabled={mode === 'edit'}
                onChange={(e) => setId(e.target.value)}
                placeholder="e.g. S045, UD012"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-hidden focus:ring-2 focus:ring-[#037ef3] disabled:bg-slate-100 disabled:text-slate-500"
                required
              />
            </div>
          </div>

          {/* Asset Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Asset Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Marker Pens, Whiteboard"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-hidden focus:ring-2 focus:ring-[#037ef3]"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* Total Qty */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Total Qty *
              </label>
              <input
                type="text"
                value={totalQty}
                onChange={(e) => setTotalQty(e.target.value)}
                placeholder="e.g. 10 or 3 thick, 3 thin"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-hidden focus:ring-2 focus:ring-[#037ef3]"
                required
              />
              <p className="text-[10px] text-slate-400 mt-1">Number or spec (e.g. 3 thick, 3 thin)</p>
            </div>

            {/* Unit */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Unit
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="Pack, Box, Unit"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-hidden focus:ring-2 focus:ring-[#037ef3]"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'IN' | 'OUT')}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-hidden focus:ring-2 focus:ring-[#037ef3] font-medium"
              >
                <option value="IN">IN</option>
                <option value="OUT">OUT</option>
              </select>
            </div>
          </div>

          {/* Image Upload & URL input */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700">
                Asset Image
              </label>
              <a
                href="https://drive.google.com/drive/folders/0ACbIyNw09xJfUk9PVA"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-[#037ef3] hover:underline font-medium"
                title="Open the LCAU Asset Photos folder in Google Drive"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>Open LCAU Photos Folder</span>
              </a>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={image}
                onChange={(e) => {
                  setImage(e.target.value);
                  setPreviewError(false);
                }}
                placeholder="Paste Google Drive link or image URL..."
                className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-hidden focus:ring-2 focus:ring-[#037ef3]"
              />

              {/* Upload Button */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*,.heic,.heif,.png,.jpg,.jpeg,.webp"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 transition shrink-0 disabled:opacity-50"
                title="Upload image from computer or mobile"
              >
                {uploading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                <span>{uploading ? 'Uploading...' : 'Upload'}</span>
              </button>
            </div>

            {/* Live Image Preview in Modal */}
            {image && (
              <div className="mt-2 p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-12 h-12 rounded border border-slate-200 bg-white overflow-hidden shrink-0 flex items-center justify-center">
                    {previewThumbnail && !previewError ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previewThumbnail}
                        alt="Preview"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        onError={() => setPreviewError(true)}
                      />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-700 truncate max-w-[240px]">
                      {previewError ? 'Unable to load preview' : 'Image preview active'}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate max-w-[240px]">
                      {image}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {previewDriveLink && (
                    <a
                      href={previewDriveLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-[#037ef3] hover:underline inline-flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setImage('');
                      setPreviewError(false);
                    }}
                    className="text-xs text-slate-400 hover:text-rose-600 px-1"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 pt-1 border-t border-slate-100">
            {/* Req By */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Requested By
              </label>
              <input
                type="text"
                value={reqBy}
                onChange={(e) => setReqBy(e.target.value)}
                placeholder="Name/Function/Event"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-hidden focus:ring-2 focus:ring-[#037ef3]"
              />
            </div>

            {/* Req Qty */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Requested Qty
              </label>
              <input
                type="number"
                min="0"
                value={reqQty}
                onChange={(e) => setReqQty(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-hidden focus:ring-2 focus:ring-[#037ef3]"
              />
            </div>
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading || uploading}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || uploading}
              className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#037ef3] hover:bg-[#0263c2] rounded-md transition shadow-xs disabled:opacity-50"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{mode === 'create' ? 'Add Asset' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
