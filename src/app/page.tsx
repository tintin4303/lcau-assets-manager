'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AssetTable from '@/components/AssetTable';
import AssetModal from '@/components/AssetModal';
import DeleteModal from '@/components/DeleteModal';
import RequestModal from '@/components/RequestModal';
import { supabase } from '@/lib/supabase';
import { Asset } from '@/types/asset';
import type { User, Session } from '@supabase/supabase-js';
import { AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Success toast
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Create / Edit modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  // Delete modal
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);

  // Request modal (public)
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [assetToRequest, setAssetToRequest] = useState<Asset | null>(null);

  // Inline status toggle tracking
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Fetch assets
  const fetchAssets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/assets', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load assets');
      setAssets(data.assets || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error fetching inventory');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAssets(); }, [fetchAssets]);

  // Show success toast briefly
  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  // Auth
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  // CRUD handlers
  const handleAddClick = () => {
    setModalMode('create');
    setSelectedAsset(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (asset: Asset) => {
    setModalMode('edit');
    setSelectedAsset(asset);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (asset: Asset) => {
    setAssetToDelete(asset);
    setIsDeleteOpen(true);
  };

  const handleRequestClick = (asset: Asset) => {
    setAssetToRequest(asset);
    setIsRequestOpen(true);
  };

  // Inline quick toggle for admins
  const handleStatusToggle = useCallback(async (asset: Asset) => {
    const key = `${asset.category}-${asset.rowIndex}`;
    setTogglingId(key);
    const newStatus = asset.status === 'OUT' ? 'IN' : 'OUT';

    // Optimistic update
    setAssets((prev) =>
      prev.map((a) =>
        a.category === asset.category && a.rowIndex === asset.rowIndex
          ? { ...a, status: newStatus }
          : a
      )
    );

    try {
      const res = await fetch(`/api/assets/${asset.category}/${asset.rowIndex}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update status');
      showSuccess(`${asset.name} marked as ${newStatus}.`);
    } catch (err: unknown) {
      // Revert on failure
      setAssets((prev) =>
        prev.map((a) =>
          a.category === asset.category && a.rowIndex === asset.rowIndex
            ? { ...a, status: asset.status }
            : a
        )
      );
      setError(err instanceof Error ? err.message : 'Status update failed');
    } finally {
      setTogglingId(null);
    }
  }, [session]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar user={user} onLogout={handleLogout} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-7 space-y-6">

        {/* Page Header — clean, no gradient */}
        <div className="border-b border-slate-200 pb-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-[#037ef3] uppercase tracking-widest mb-1">
                AIESEC in Assumption University · LCAU 26.27
              </p>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Asset Inventory
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {user
                  ? 'Admin mode active. Click any status badge to toggle, or use the Edit/Delete controls.'
                  : 'Browse available assets and submit a request directly from this page.'}
              </p>
            </div>
          </div>
        </div>

        {/* Toasts */}
        {error && (
          <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchAssets}
                className="inline-flex items-center gap-1 font-semibold text-rose-800 hover:underline text-[11px]"
              >
                <RefreshCw className="w-3 h-3" /> Retry
              </button>
              <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-600 font-bold text-base leading-none">×</button>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        {/* Asset Table / Grid */}
        <AssetTable
          assets={assets}
          loading={loading}
          isAdmin={!!user}
          onRefresh={fetchAssets}
          onAddClick={handleAddClick}
          onEditClick={handleEditClick}
          onDeleteClick={handleDeleteClick}
          onRequestClick={handleRequestClick}
          onStatusToggle={handleStatusToggle}
          togglingId={togglingId}
        />
      </main>

      <Footer />

      {/* Admin CRUD Modals */}
      {user && session && (
        <>
          <AssetModal
            isOpen={isModalOpen}
            mode={modalMode}
            asset={selectedAsset}
            onClose={() => setIsModalOpen(false)}
            onSuccess={() => { fetchAssets(); showSuccess(modalMode === 'create' ? 'Asset added successfully.' : 'Asset updated.'); }}
            accessToken={session.access_token}
          />
          <DeleteModal
            isOpen={isDeleteOpen}
            asset={assetToDelete}
            onClose={() => setIsDeleteOpen(false)}
            onSuccess={() => { fetchAssets(); showSuccess('Asset deleted.'); }}
            accessToken={session.access_token}
          />
        </>
      )}

      {/* Public Request Modal */}
      <RequestModal
        isOpen={isRequestOpen}
        asset={assetToRequest}
        onClose={() => setIsRequestOpen(false)}
        onSuccess={(id) => { fetchAssets(); showSuccess(`Request submitted for ${id}.`); }}
      />
    </div>
  );
}
