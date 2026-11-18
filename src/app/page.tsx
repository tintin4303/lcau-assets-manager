'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AssetTable from '@/components/AssetTable';
import AssetModal from '@/components/AssetModal';
import DeleteModal from '@/components/DeleteModal';
import RequestModal from '@/components/RequestModal';
import RequestCartModal from '@/components/RequestCartModal';
import { supabase } from '@/lib/supabase';
import { Asset, CartItem } from '@/types/asset';
import { useRBAC } from '@/hooks/useRBAC';
import { AlertCircle, RefreshCw, CheckCircle2, ShoppingBag } from 'lucide-react';

export default function Home() {
  const { user, session, role, isAdmin, isHolder, logout } = useRBAC();
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

  // Request Basket / Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Load basket from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('lcau_request_cart');
      if (saved) {
        setCartItems(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  // Save basket to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('lcau_request_cart', JSON.stringify(cartItems));
    } catch {
      // ignore
    }
  }, [cartItems]);

  const handleAddToCart = useCallback((asset: Asset) => {
    setCartItems((prev) => {
      const existing = prev.find(
        (item) => item.asset.category === asset.category && item.asset.rowIndex === asset.rowIndex
      );
      const isNumeric = typeof asset.remainingQty === 'number';
      const maxQty = isNumeric && (asset.remainingQty as number) > 0 ? (asset.remainingQty as number) : 999;

      if (existing) {
        if (existing.reqQty >= maxQty) return prev;
        return prev.map((item) =>
          item.asset.category === asset.category && item.asset.rowIndex === asset.rowIndex
            ? { ...item, reqQty: item.reqQty + 1 }
            : item
        );
      }
      return [...prev, { asset, reqQty: 1 }];
    });
  }, []);

  const handleUpdateCartQty = useCallback((category: string, rowIndex: number, qty: number) => {
    if (qty <= 0) {
      setCartItems((prev) =>
        prev.filter((item) => !(item.asset.category === category && item.asset.rowIndex === rowIndex))
      );
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.asset.category === category && item.asset.rowIndex === rowIndex
          ? { ...item, reqQty: qty }
          : item
      )
    );
  }, []);

  const handleRemoveCartItem = useCallback((category: string, rowIndex: number) => {
    setCartItems((prev) =>
      prev.filter((item) => !(item.asset.category === category && item.asset.rowIndex === rowIndex))
    );
  }, []);

  const handleClearCart = useCallback(() => {
    setCartItems([]);
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

  const handleBatchSuccess = useCallback((count: number) => {
    fetchAssets();
    setSuccessMessage(`Bulk request for ${count} items submitted! The asset holder will hand them over.`);
    setTimeout(() => setSuccessMessage(null), 4000);
  }, [fetchAssets]);

  useEffect(() => { fetchAssets(); }, [fetchAssets]);

  // Show success toast briefly
  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3500);
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

  // Inline quick toggle for admins (Handover vs Return)
  const handleStatusToggle = useCallback(async (asset: Asset) => {
    if (!isHolder) {
      setError('LCVP Audit Restriction: Physical handovers and returns must be executed by Asset Holders.');
      setTimeout(() => setError(null), 4000);
      return;
    }

    const key = `${asset.category}-${asset.rowIndex}`;
    setTogglingId(key);
    const isOut = asset.status === 'OUT';
    const newStatus: 'IN' | 'OUT' = isOut ? 'IN' : 'OUT';

    // When marking IN (returned), clear requester info. When marking OUT (handover), keep existing requester.
    const payload: Partial<Asset> = isOut
      ? { status: 'IN', reqBy: '', reqQty: 0 }
      : { status: 'OUT' };

    // Optimistic update
    setAssets((prev) =>
      prev.map((a) =>
        a.category === asset.category && a.rowIndex === asset.rowIndex
          ? {
              ...a,
              status: newStatus,
              ...(isOut ? { reqBy: '', reqQty: 0 } : {}),
            }
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
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update status');
      showSuccess(
        isOut
          ? `${asset.name} marked as returned (IN).`
          : `${asset.name} handed over and marked as OUT.`
      );
    } catch (err: unknown) {
      // Revert on failure
      setAssets((prev) =>
        prev.map((a) =>
          a.category === asset.category && a.rowIndex === asset.rowIndex
            ? { ...a, status: asset.status, reqBy: asset.reqBy, reqQty: asset.reqQty }
            : a
        )
      );
      setError(err instanceof Error ? err.message : 'Status update failed');
    } finally {
      setTogglingId(null);
    }
  }, [session]);

  const totalCartUnits = cartItems.reduce((acc, i) => acc + i.reqQty, 0);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 relative">
      <Navbar
        user={user}
        role={role}
        onLogout={logout}
      />

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
                  : 'Browse available assets, add them to your request basket, and submit a request in bulk.'}
              </p>
            </div>

            {/* Quick Basket button on header for public users */}
            {!user && (
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className={`hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition shadow-2xs ${
                  totalCartUnits > 0
                    ? 'bg-[#037ef3] text-white border-[#037ef3] hover:bg-[#0263c2]'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Request Basket ({totalCartUnits})</span>
              </button>
            )}
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

        {/* Floating Success Toast (No layout shift) */}
        {successMessage && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 max-w-md w-11/12 animate-in fade-in-0 slide-in-from-top-4 duration-200">
            <div className="p-3.5 rounded-2xl bg-slate-950 text-white shadow-2xl border border-slate-800 text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-medium text-slate-100">{successMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setSuccessMessage(null)}
                className="text-slate-400 hover:text-white font-bold text-base leading-none p-1 shrink-0"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Asset Table / Grid */}
        <AssetTable
          assets={assets}
          loading={loading}
          isAdmin={isAdmin}
          onRefresh={fetchAssets}
          onAddClick={handleAddClick}
          onEditClick={handleEditClick}
          onDeleteClick={handleDeleteClick}
          onRequestClick={handleRequestClick}
          onStatusToggle={handleStatusToggle}
          cartItems={cartItems}
          onAddToCart={handleAddToCart}
          onUpdateCartQty={handleUpdateCartQty}
          onRemoveCartItem={handleRemoveCartItem}
          onOpenCart={() => setIsCartOpen(true)}
          togglingId={togglingId}
        />
      </main>

      <Footer />

      {/* Floating Request Basket Bar (Mobile-friendly sticky bar / Desktop pill) */}
      {!user && cartItems.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-40 animate-in fade-in-0 slide-in-from-bottom-4 duration-200">
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-3.5 px-4 sm:px-5 py-3 rounded-2xl bg-slate-950/95 text-white shadow-2xl hover:bg-slate-900 active:scale-98 transition border border-slate-800 backdrop-blur-md"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#037ef3] flex items-center justify-center font-black text-xs text-white shadow-xs">
                {cartItems.reduce((acc, i) => acc + i.reqQty, 0)}
              </div>
              <div className="text-left">
                <span className="text-xs font-bold block leading-tight">Request Basket</span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
                </span>
              </div>
            </div>
            <span className="text-xs font-bold text-[#037ef3] flex items-center gap-1 sm:ml-2">
              View Basket &rarr;
            </span>
          </button>
        </div>
      )}

      {/* Bulk Request Cart Modal */}
      <RequestCartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQty={handleUpdateCartQty}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        onSuccess={handleBatchSuccess}
      />

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

      {/* Public Single Item Request Modal (Fallback) */}
      <RequestModal
        isOpen={isRequestOpen}
        asset={assetToRequest}
        onClose={() => setIsRequestOpen(false)}
        onSuccess={(id) => {
          fetchAssets();
          showSuccess(`Request submitted for ${id}. The asset holder will hand over the item.`);
        }}
      />
    </div>
  );
}
