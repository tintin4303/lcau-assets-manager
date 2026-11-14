'use client';

import React, { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Asset } from '@/types/asset';

interface DeleteModalProps {
  isOpen: boolean;
  asset: Asset | null;
  onClose: () => void;
  onSuccess: () => void;
  accessToken: string;
}

export default function DeleteModal({
  isOpen,
  asset,
  onClose,
  onSuccess,
  accessToken,
}: DeleteModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !asset) return null;

  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/assets/${asset.category}/${asset.rowIndex}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete asset');
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
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
        <div className="flex items-center space-x-3 text-rose-600">
          <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center border border-rose-100">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Delete Asset</h3>
            <p className="text-xs text-slate-500">This action will remove the row from Google Sheets.</p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
          <p><span className="font-semibold text-slate-700">Category:</span> {asset.category}</p>
          <p><span className="font-semibold text-slate-700">Asset ID:</span> {asset.id}</p>
          <p><span className="font-semibold text-slate-700">Asset Name:</span> {asset.name}</p>
          <p><span className="font-semibold text-slate-700">Total Quantity:</span> {asset.totalQty}</p>
        </div>

        <p className="text-xs text-slate-600">
          Are you sure you want to permanently delete this asset record?
        </p>

        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-md transition shadow-xs disabled:opacity-50"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Confirm Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}
