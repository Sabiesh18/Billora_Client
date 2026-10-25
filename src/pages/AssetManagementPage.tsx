import React, { useState, useEffect, useMemo } from 'react';
import { useSettings } from '../context/SettingsContext';
import { vendorApi, assetApi, purchaseApi, assetSummaryApi } from '../api/client';
import { Vendor, Asset, Purchase, AssetSummary } from '../types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBoxesStacked,
  faScrewdriverWrench,
  faFileInvoiceDollar,
  faHandshake,
  faPlus,
  faSearch,
  faPencil,
  faTrashCan,
  faSpinner,
  faBuilding,
  faReceipt,
  faCircleCheck,
  faTriangleExclamation,
  faFilter,
  faXmark,
  faRotateRight,
} from '@fortawesome/free-solid-svg-icons';

type ActiveTab = 'assets' | 'vendors' | 'purchases';

export const AssetManagementPage: React.FC = () => {
  const { settings } = useSettings();
  const currency = settings.currency_symbol || '₹';

  // State
  const [activeTab, setActiveTab] = useState<ActiveTab>('assets');
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Data
  const [summary, setSummary] = useState<AssetSummary | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Modal States
  const [assetModalOpen, setAssetModalOpen] = useState<boolean>(false);
  const [vendorModalOpen, setVendorModalOpen] = useState<boolean>(false);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState<boolean>(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);

  // Editing Entities
  const [currentAsset, setCurrentAsset] = useState<Partial<Asset>>({});
  const [currentVendor, setCurrentVendor] = useState<Partial<Vendor>>({});
  const [currentPurchase, setCurrentPurchase] = useState<Partial<Purchase>>({});
  const [deleteTarget, setDeleteTarget] = useState<{ type: ActiveTab; id: string; name: string } | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Load All Data
  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const [sumRes, astRes, venRes, purRes] = await Promise.all([
        assetSummaryApi.getSummary().catch(() => null),
        assetApi.getAll().catch(() => []),
        vendorApi.getAll().catch(() => []),
        purchaseApi.getAll().catch(() => []),
      ]);

      if (sumRes) setSummary(sumRes);
      setAssets(astRes || []);
      setVendors(venRes || []);
      setPurchases(purRes || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load asset management data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const notifySuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Asset Categories
  const assetCategories = useMemo(() => {
    const set = new Set<string>();
    assets.forEach(a => { if (a.category) set.add(a.category); });
    return Array.from(set);
  }, [assets]);

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    return assets.filter(item => {
      const matchSearch =
        (item.assetName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.assetCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.vendorName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.locationArea || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = categoryFilter === 'ALL' || item.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [assets, searchQuery, categoryFilter]);

  // Filtered Vendors
  const filteredVendors = useMemo(() => {
    return vendors.filter(item => {
      return (
        (item.vendorName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.contactPerson || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.phone || '').includes(searchQuery)
      );
    });
  }, [vendors, searchQuery]);

  // Filtered Purchases
  const filteredPurchases = useMemo(() => {
    return purchases.filter(item => {
      return (
        (item.invoiceNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.vendorName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.itemsDescription || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [purchases, searchQuery]);

  // ---------------- Handlers: Asset ----------------
  const handleOpenAssetModal = (asset?: Asset) => {
    if (asset) {
      setCurrentAsset({ ...asset });
    } else {
      setCurrentAsset({
        assetCode: `AST-${Math.floor(100 + Math.random() * 900)}`,
        assetName: '',
        category: 'Kitchen Equipment',
        vendorId: vendors[0]?.vendorId || '',
        vendorName: vendors[0]?.vendorName || '',
        purchaseDate: new Date().toISOString().split('T')[0],
        costPrice: 0,
        quantity: 1,
        locationArea: 'Kitchen',
        conditionStatus: 'OPERATIONAL',
        notes: '',
      });
    }
    setAssetModalOpen(true);
  };

  const handleSaveAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAsset.assetName?.trim()) return;
    try {
      setSubmitting(true);
      // match vendor name if vendorId selected
      const selectedVen = vendors.find(v => v.vendorId === currentAsset.vendorId);
      const payload = {
        ...currentAsset,
        vendorName: selectedVen ? selectedVen.vendorName : currentAsset.vendorName,
      };
      await assetApi.save(payload);
      notifySuccess(`Asset "${currentAsset.assetName}" saved successfully`);
      setAssetModalOpen(false);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save asset');
    } finally {
      setSubmitting(false);
    }
  };

  // ---------------- Handlers: Vendor ----------------
  const handleOpenVendorModal = (vendor?: Vendor) => {
    if (vendor) {
      setCurrentVendor({ ...vendor });
    } else {
      setCurrentVendor({
        vendorName: '',
        contactPerson: '',
        phone: '',
        email: '',
        address: '',
        gstin: '',
        category: 'Provisions',
        status: 'ACTIVE',
      });
    }
    setVendorModalOpen(true);
  };

  const handleSaveVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentVendor.vendorName?.trim()) return;
    try {
      setSubmitting(true);
      await vendorApi.save(currentVendor);
      notifySuccess(`Vendor "${currentVendor.vendorName}" saved successfully`);
      setVendorModalOpen(false);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save vendor');
    } finally {
      setSubmitting(false);
    }
  };

  // ---------------- Handlers: Purchase ----------------
  const handleOpenPurchaseModal = (purchase?: Purchase) => {
    if (purchase) {
      setCurrentPurchase({ ...purchase });
    } else {
      setCurrentPurchase({
        invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        vendorId: vendors[0]?.vendorId || '',
        vendorName: vendors[0]?.vendorName || '',
        purchaseDate: new Date().toISOString().split('T')[0],
        totalAmount: 0,
        taxAmount: 0,
        paymentStatus: 'PAID',
        paymentMode: 'CASH',
        itemsDescription: '',
        notes: '',
      });
    }
    setPurchaseModalOpen(true);
  };

  const handleSavePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPurchase.invoiceNumber?.trim()) return;
    try {
      setSubmitting(true);
      const selectedVen = vendors.find(v => v.vendorId === currentPurchase.vendorId);
      const payload = {
        ...currentPurchase,
        vendorName: selectedVen ? selectedVen.vendorName : currentPurchase.vendorName,
      };
      await purchaseApi.save(payload);
      notifySuccess(`Purchase Invoice "${currentPurchase.invoiceNumber}" recorded successfully`);
      setPurchaseModalOpen(false);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save purchase invoice');
    } finally {
      setSubmitting(false);
    }
  };

  // ---------------- Handlers: Delete ----------------
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setSubmitting(true);
      if (deleteTarget.type === 'assets') {
        await assetApi.delete(deleteTarget.id);
        notifySuccess(`Asset removed successfully`);
      } else if (deleteTarget.type === 'vendors') {
        await vendorApi.delete(deleteTarget.id);
        notifySuccess(`Vendor removed successfully`);
      } else if (deleteTarget.type === 'purchases') {
        await purchaseApi.delete(deleteTarget.id);
        notifySuccess(`Purchase invoice removed successfully`);
      }
      setDeleteModalOpen(false);
      setDeleteTarget(null);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete record');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-[#FFF9F6] p-6 font-sans">
      {/* Top Banner / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#F67009] to-[#F88D3A] text-white flex items-center justify-center text-sm shadow-md">
              <FontAwesomeIcon icon={faBoxesStacked} />
            </span>
            <span>Asset & Vendor Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Manage restaurant kitchen machinery, POS devices, furniture, vendors, and purchase procurement invoices.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            title="Refresh Data"
            className="p-2.5 bg-white border border-[#F3E5DC] hover:border-[#F67009] text-slate-600 hover:text-[#F67009] rounded-xl shadow-xs transition-colors"
          >
            <FontAwesomeIcon icon={faRotateRight} className={loading ? 'animate-spin' : ''} />
          </button>

          {activeTab === 'assets' && (
            <button
              onClick={() => handleOpenAssetModal()}
              className="bg-gradient-to-r from-[#F67009] to-[#F88D3A] hover:brightness-105 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 active:scale-95"
            >
              <FontAwesomeIcon icon={faPlus} />
              <span>Add New Asset</span>
            </button>
          )}

          {activeTab === 'vendors' && (
            <button
              onClick={() => handleOpenVendorModal()}
              className="bg-gradient-to-r from-[#F67009] to-[#F88D3A] hover:brightness-105 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 active:scale-95"
            >
              <FontAwesomeIcon icon={faPlus} />
              <span>Register Vendor</span>
            </button>
          )}

          {activeTab === 'purchases' && (
            <button
              onClick={() => handleOpenPurchaseModal()}
              className="bg-gradient-to-r from-[#F67009] to-[#F88D3A] hover:brightness-105 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 active:scale-95"
            >
              <FontAwesomeIcon icon={faPlus} />
              <span>Record Purchase</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
          <FontAwesomeIcon icon={faCircleCheck} className="text-emerald-500" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
          <FontAwesomeIcon icon={faTriangleExclamation} className="text-rose-500" />
          <span className="font-semibold">{errorMsg}</span>
        </div>
      )}

      {/* Metric KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Card 1: Asset Valuation */}
        <div className="bg-white border border-[#F3E5DC] rounded-2xl p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Asset Valuation</span>
            <span className="w-8 h-8 rounded-lg bg-[#FFF0E6] text-[#F67009] flex items-center justify-center text-xs">
              <FontAwesomeIcon icon={faBoxesStacked} />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-900">
              {currency} {Number(summary?.totalAssetValue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Across all registered restaurant assets</p>
          <div className="absolute -bottom-1 -right-1 w-16 h-16 bg-[#F67009]/5 rounded-full pointer-events-none" />
        </div>

        {/* Card 2: Active Equipment Units */}
        <div className="bg-white border border-[#F3E5DC] rounded-2xl p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Equipment Units</span>
            <span className="w-8 h-8 rounded-lg bg-[#FFF0E6] text-[#F67009] flex items-center justify-center text-xs">
              <FontAwesomeIcon icon={faScrewdriverWrench} />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{summary?.totalAssetsCount || 0}</span>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              {summary?.operationalAssetsCount || 0} Operational
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {summary?.maintenanceAssetsCount || 0} currently under service
          </p>
          <div className="absolute -bottom-1 -right-1 w-16 h-16 bg-[#F88D3A]/5 rounded-full pointer-events-none" />
        </div>

        {/* Card 3: Invoiced Purchases */}
        <div className="bg-white border border-[#F3E5DC] rounded-2xl p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Purchases</span>
            <span className="w-8 h-8 rounded-lg bg-[#FFF0E6] text-[#F67009] flex items-center justify-center text-xs">
              <FontAwesomeIcon icon={faFileInvoiceDollar} />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-900">
              {currency} {Number(summary?.totalPurchasesAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">{purchases.length} recorded supplier invoices</p>
          <div className="absolute -bottom-1 -right-1 w-16 h-16 bg-[#F67009]/5 rounded-full pointer-events-none" />
        </div>

        {/* Card 4: Registered Vendors */}
        <div className="bg-white border border-[#F3E5DC] rounded-2xl p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Vendors</span>
            <span className="w-8 h-8 rounded-lg bg-[#FFF0E6] text-[#F67009] flex items-center justify-center text-xs">
              <FontAwesomeIcon icon={faHandshake} />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{summary?.totalVendorsCount || vendors.length}</span>
            <span className="text-[11px] font-bold text-[#F67009] bg-[#FFF0E6] px-2 py-0.5 rounded-full">
              Partners
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Verified commercial suppliers</p>
          <div className="absolute -bottom-1 -right-1 w-16 h-16 bg-[#F88D3A]/5 rounded-full pointer-events-none" />
        </div>
      </div>

      {/* Main Content Card with Navigation Tabs */}
      <div className="bg-white border border-[#F3E5DC] rounded-2xl shadow-xs overflow-hidden flex-1 flex flex-col">
        {/* Navigation Tabs Bar */}
        <div className="border-b border-[#F3E5DC] px-4 pt-3 flex flex-wrap items-center justify-between gap-4 bg-[#FFF9F6]/40">
          <div className="flex gap-2">
            <button
              onClick={() => { setActiveTab('assets'); setSearchQuery(''); }}
              className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 border ${
                activeTab === 'assets'
                  ? 'bg-gradient-to-r from-[#F67009] to-[#F88D3A] text-white border-transparent shadow-sm'
                  : 'bg-white text-slate-600 hover:text-slate-900 border-[#F3E5DC]'
              }`}
            >
              <FontAwesomeIcon icon={faBoxesStacked} />
              <span>Equipment & Assets</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === 'assets' ? 'bg-white/30 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {assets.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('vendors'); setSearchQuery(''); }}
              className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 border ${
                activeTab === 'vendors'
                  ? 'bg-gradient-to-r from-[#F67009] to-[#F88D3A] text-white border-transparent shadow-sm'
                  : 'bg-white text-slate-600 hover:text-slate-900 border-[#F3E5DC]'
              }`}
            >
              <FontAwesomeIcon icon={faBuilding} />
              <span>Vendors & Suppliers</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === 'vendors' ? 'bg-white/30 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {vendors.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('purchases'); setSearchQuery(''); }}
              className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 border ${
                activeTab === 'purchases'
                  ? 'bg-gradient-to-r from-[#F67009] to-[#F88D3A] text-white border-transparent shadow-sm'
                  : 'bg-white text-slate-600 hover:text-slate-900 border-[#F3E5DC]'
              }`}
            >
              <FontAwesomeIcon icon={faReceipt} />
              <span>Purchases & Invoices</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === 'purchases' ? 'bg-white/30 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {purchases.length}
              </span>
            </button>
          </div>

          {/* Search Bar & Filters */}
          <div className="flex items-center gap-2 pb-3">
            <div className="relative">
              <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-[#F3E5DC] focus:outline-none focus:border-[#F67009] w-48 sm:w-64 bg-white"
              />
            </div>

            {activeTab === 'assets' && assetCategories.length > 0 && (
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="py-1.5 px-2.5 text-xs rounded-xl border border-[#F3E5DC] focus:outline-none focus:border-[#F67009] bg-white text-slate-700 font-medium"
              >
                <option value="ALL">All Categories</option>
                {assetCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Tab 1 Content: Equipment & Assets Table */}
        {activeTab === 'assets' && (
          <div className="overflow-x-auto flex-1">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                <FontAwesomeIcon icon={faSpinner} className="animate-spin text-2xl text-[#F67009] mb-2" />
                <span className="text-xs font-semibold">Loading assets directory...</span>
              </div>
            ) : filteredAssets.length === 0 ? (
              <div className="py-20 text-center text-slate-400">
                <FontAwesomeIcon icon={faBoxesStacked} className="text-4xl text-slate-200 mb-3" />
                <p className="text-sm font-bold text-slate-600">No assets found</p>
                <p className="text-xs text-slate-400 mt-1">Click "Add New Asset" to register your equipment.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#FFF9F6] border-b border-[#F3E5DC] text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Code & Item</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Supplier</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4 text-right">Qty</th>
                    <th className="py-3 px-4 text-right">Cost Price</th>
                    <th className="py-3 px-4 text-right">Total Value</th>
                    <th className="py-3 px-4 text-center">Condition</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3E5DC]">
                  {filteredAssets.map(item => {
                    const totalVal = (Number(item.costPrice || 0) * Number(item.quantity || 1));
                    return (
                      <tr key={item.assetId} className="hover:bg-[#FFF9F6]/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{item.assetName}</div>
                          <div className="text-[10px] font-mono text-slate-500">{item.assetCode || 'N/A'}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                            {item.category || 'General'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-medium">
                          {item.vendorName || '—'}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {item.locationArea || 'Kitchen'}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">
                          {item.quantity || 1}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-700">
                          {currency} {Number(item.costPrice || 0).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold font-mono text-slate-900">
                          {currency} {totalVal.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.conditionStatus === 'OPERATIONAL' || item.conditionStatus === 'Good'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : item.conditionStatus === 'MAINTENANCE'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {item.conditionStatus || 'OPERATIONAL'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenAssetModal(item)}
                              title="Edit Asset"
                              className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-[#FFF0E6] text-slate-600 hover:text-[#F67009] transition-colors flex items-center justify-center text-xs"
                            >
                              <FontAwesomeIcon icon={faPencil} />
                            </button>
                            <button
                              onClick={() => {
                                setDeleteTarget({ type: 'assets', id: item.assetId!, name: item.assetName });
                                setDeleteModalOpen(true);
                              }}
                              title="Delete Asset"
                              className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition-colors flex items-center justify-center text-xs"
                            >
                              <FontAwesomeIcon icon={faTrashCan} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 2 Content: Vendors & Suppliers Table */}
        {activeTab === 'vendors' && (
          <div className="overflow-x-auto flex-1">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                <FontAwesomeIcon icon={faSpinner} className="animate-spin text-2xl text-[#F67009] mb-2" />
                <span className="text-xs font-semibold">Loading vendors directory...</span>
              </div>
            ) : filteredVendors.length === 0 ? (
              <div className="py-20 text-center text-slate-400">
                <FontAwesomeIcon icon={faBuilding} className="text-4xl text-slate-200 mb-3" />
                <p className="text-sm font-bold text-slate-600">No vendors found</p>
                <p className="text-xs text-slate-400 mt-1">Click "Register Vendor" to onboard your suppliers.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#FFF9F6] border-b border-[#F3E5DC] text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Vendor / Supplier Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Contact Person</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">GSTIN</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3E5DC]">
                  {filteredVendors.map(item => (
                    <tr key={item.vendorId} className="hover:bg-[#FFF9F6]/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{item.vendorName}</div>
                        <div className="text-[10px] text-slate-500 truncate max-w-xs">{item.address || '—'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                          {item.category || 'General'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">{item.contactPerson || '—'}</td>
                      <td className="py-3 px-4 font-mono text-slate-700">{item.phone || '—'}</td>
                      <td className="py-3 px-4 text-slate-600">{item.email || '—'}</td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-700">{item.gstin || '—'}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {item.status || 'ACTIVE'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenVendorModal(item)}
                            title="Edit Vendor"
                            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-[#FFF0E6] text-slate-600 hover:text-[#F67009] transition-colors flex items-center justify-center text-xs"
                          >
                            <FontAwesomeIcon icon={faPencil} />
                          </button>
                          <button
                            onClick={() => {
                              setDeleteTarget({ type: 'vendors', id: item.vendorId!, name: item.vendorName });
                              setDeleteModalOpen(true);
                            }}
                            title="Delete Vendor"
                            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition-colors flex items-center justify-center text-xs"
                          >
                            <FontAwesomeIcon icon={faTrashCan} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 3 Content: Purchases & Invoices Table */}
        {activeTab === 'purchases' && (
          <div className="overflow-x-auto flex-1">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                <FontAwesomeIcon icon={faSpinner} className="animate-spin text-2xl text-[#F67009] mb-2" />
                <span className="text-xs font-semibold">Loading procurement invoices...</span>
              </div>
            ) : filteredPurchases.length === 0 ? (
              <div className="py-20 text-center text-slate-400">
                <FontAwesomeIcon icon={faFileInvoiceDollar} className="text-4xl text-slate-200 mb-3" />
                <p className="text-sm font-bold text-slate-600">No purchases found</p>
                <p className="text-xs text-slate-400 mt-1">Click "Record Purchase" to log vendor invoices.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#FFF9F6] border-b border-[#F3E5DC] text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Invoice # & Date</th>
                    <th className="py-3 px-4">Supplier / Vendor</th>
                    <th className="py-3 px-4">Items / Description</th>
                    <th className="py-3 px-4 text-right">Tax (GST)</th>
                    <th className="py-3 px-4 text-right">Total Amount</th>
                    <th className="py-3 px-4 text-center">Mode</th>
                    <th className="py-3 px-4 text-center">Payment Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3E5DC]">
                  {filteredPurchases.map(item => (
                    <tr key={item.purchaseId} className="hover:bg-[#FFF9F6]/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold font-mono text-slate-900">{item.invoiceNumber}</div>
                        <div className="text-[10px] text-slate-500">
                          {item.purchaseDate ? new Date(item.purchaseDate).toLocaleDateString('en-IN') : '—'}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800">
                        {item.vendorName || '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-sm truncate">
                        {item.itemsDescription || '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        {currency} {Number(item.taxAmount || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold font-mono text-slate-900">
                        {currency} {Number(item.totalAmount || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px] uppercase">
                          {item.paymentMode || 'CASH'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.paymentStatus === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {item.paymentStatus || 'PAID'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenPurchaseModal(item)}
                            title="Edit Purchase"
                            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-[#FFF0E6] text-slate-600 hover:text-[#F67009] transition-colors flex items-center justify-center text-xs"
                          >
                            <FontAwesomeIcon icon={faPencil} />
                          </button>
                          <button
                            onClick={() => {
                              setDeleteTarget({ type: 'purchases', id: item.purchaseId!, name: item.invoiceNumber });
                              setDeleteModalOpen(true);
                            }}
                            title="Delete Purchase"
                            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition-colors flex items-center justify-center text-xs"
                          >
                            <FontAwesomeIcon icon={faTrashCan} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* ---------------- MODAL 1: ADD / EDIT ASSET ---------------- */}
      {assetModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-[#F3E5DC] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-[#F3E5DC] flex items-center justify-between bg-[#FFF9F6]/50">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FontAwesomeIcon icon={faBoxesStacked} className="text-[#F67009]" />
                <span>{currentAsset.assetId ? 'Edit Equipment Asset' : 'Register New Asset'}</span>
              </h2>
              <button
                onClick={() => setAssetModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <form onSubmit={handleSaveAsset} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Asset Code</label>
                  <input
                    type="text"
                    required
                    value={currentAsset.assetCode || ''}
                    onChange={e => setCurrentAsset({ ...currentAsset, assetCode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#F3E5DC] focus:outline-none focus:border-[#F67009]"
                    placeholder="e.g. AST-101"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Category</label>
                  <select
                    value={currentAsset.category || 'Kitchen Equipment'}
                    onChange={e => setCurrentAsset({ ...currentAsset, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#F3E5DC] focus:outline-none focus:border-[#F67009]"
                  >
                    <option value="Kitchen Equipment">Kitchen Equipment</option>
                    <option value="Refrigeration">Refrigeration</option>
                    <option value="Electronics & POS">Electronics & POS</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Storage & Crockery">Storage & Crockery</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Asset / Equipment Name *</label>
                <input
                  type="text"
                  required
                  value={currentAsset.assetName || ''}
                  onChange={e => setCurrentAsset({ ...currentAsset, assetName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#F3E5DC] focus:outline-none focus:border-[#F67009]"
                  placeholder="e.g. Epson 80mm High-Speed Thermal Receipt Printer"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Supplier / Vendor</label>
                  <select
                    value={currentAsset.vendorId || ''}
                    onChange={e => {
                      const v = vendors.find(ven => ven.vendorId === e.target.value);
                      setCurrentAsset({
                        ...currentAsset,
                        vendorId: e.target.value,
                        vendorName: v ? v.vendorName : currentAsset.vendorName,
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-[#F3E5DC] focus:outline-none focus:border-[#F67009]"
                  >
                    <option value="">Select Vendor...</option>
                    {vendors.map(v => (
                      <option key={v.vendorId} value={v.vendorId}>
                        {v.vendorName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Location Area</label>
                  <input
                    type="text"
                    value={currentAsset.locationArea || 'Main Kitchen'}
                    onChange={e => setCurrentAsset({ ...currentAsset, locationArea: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#F3E5DC] focus:outline-none focus:border-[#F67009]"
                    placeholder="e.g. Billing Counter, Main Kitchen"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Cost Price ({currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={currentAsset.costPrice ?? 0}
                    onChange={e => setCurrentAsset({ ...currentAsset, costPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-[#F3E5DC] focus:outline-none focus:border-[#F67009]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={currentAsset.quantity ?? 1}
                    onChange={e => setCurrentAsset({ ...currentAsset, quantity: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 rounded-xl border border-[#F3E5DC] focus:outline-none focus:border-[#F67009]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Condition Status</label>
                  <select
                    value={currentAsset.conditionStatus || 'OPERATIONAL'}
                    onChange={e => setCurrentAsset({ ...currentAsset, conditionStatus: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#F3E5DC] focus:outline-none focus:border-[#F67009]"
                  >
                    <option value="OPERATIONAL">OPERATIONAL</option>
                    <option value="MAINTENANCE">MAINTENANCE</option>
                    <option value="REPAIR_NEEDED">REPAIR NEEDED</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Purchase Date</label>
                  <input
                    type="date"
                    value={currentAsset.purchaseDate ? currentAsset.purchaseDate.split('T')[0] : ''}
                    onChange={e => setCurrentAsset({ ...currentAsset, purchaseDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#F3E5DC] focus:outline-none focus:border-[#F67009]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Warranty Expiry</label>
                  <input
                    type="date"
                    value={currentAsset.warrantyExpiry ? currentAsset.warrantyExpiry.split('T')[0] : ''}
                    onChange={e => setCurrentAsset({ ...currentAsset, warrantyExpiry: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#F3E5DC] focus:outline-none focus:border-[#F67009]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Notes / Description</label>
                <textarea
                  rows={2}
                  value={currentAsset.notes || ''}
                  onChange={e => setCurrentAsset({ ...currentAsset, notes: e.target.value })}
                  placeholder="Enter specifications, serial numbers, or service notes..."
                  className="w-full px-3 py-2 rounded-xl border border-[#F3E5DC] focus:outline-none focus:border-[#F67009]"
                />
              </div>

              <div className="pt-3 border-t border-[#F3E5DC] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAssetModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-white font-bold bg-gradient-to-r from-[#F67009] to-[#F88D3A] hover:brightness-105 shadow-md flex items-center gap-1.5"
                >
                  {submitting && <FontAwesomeIcon icon={faSpinner} className="animate-spin" />}
                  <span>Save Asset</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- MODAL 2: ADD / EDIT VENDOR ---------------- */}
      {vendorModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-[#F3E5DC] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-[#F3E5DC] flex items-center justify-between bg-[#FFF9F6]/50">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FontAwesomeIcon icon={faBuilding} className="text-[#F67009]" />
                <span>{currentVendor.vendorId ? 'Edit Vendor Supplier' : 'Register New Vendor'}</span>
              </h2>
              <button
                onClick={() => setVendorModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <form onSubmit={handleSaveVendor} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Company / Vendor Name *</label>
                <input
                  type="text"
                  required
                  value={currentVendor.vendorName || ''}
                  onChange={e => setCurrentVendor({ ...currentVendor, vendorName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#F3E5DC] focus:outline-none focus:border-[#F67009]"
                  placeholder="e.g. Metro Cash & Carry Supplies"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Category</label>
                  <input
                    type="text"
                    value={currentVendor.category || 'Provisions & Groceries'}
                    onChange={e => setCurrentVendor({ ...currentVendor, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#F3E5DC] focus:outline-none focus:border-[#F67009]"
                    placeholder="e.g. Raw Materials, Kitchen Machinery"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={currentVendor.contactPerson || ''}
                    onChange={e => setCurrentVendor({ ...currentVendor, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#F3E5DC] focus:outline-none focus:border-[#F67009]"
                    placeholder="e.g. Ramesh Sharma"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={currentVendor.phone || ''}
                    onChange={e => setCurrentVendor({ ...currentVendor, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#F3E5DC] focus:outline-none focus:border-[#F67009]"
                    placeholder="+91 98410 00000"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Email Address</label>
                  <input
                    type="email"
                    value={currentVendor.email || ''}
                    onChange={e => setCurrentVendor({ ...currentVendor, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#F3E5DC] focus:outline-none focus:border-[#F67009]"
                    placeholder="orders@supplier.in"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">GSTIN Number</label>
                  <input
                    type="text"
                    value={currentVendor.gstin || ''}
                    onChange={e => setCurrentVendor({ ...currentVendor, gstin: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#F3E5DC] focus:outline-none focus:border-[#F67009]"
                    placeholder="33AABCM1234D1Z2"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Status</label>
                  <select
                    value={currentVendor.status || 'ACTIVE'}
                    onChange={e => setCurrentVendor({ ...currentVendor, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#F3E5DC] focus:outline-none focus:border-[#F67009]"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Address</label>
                <textarea
                  rows={2}
                  value={currentVendor.address || ''}
                  onChange={e => setCurrentVendor({ ...currentVendor, address: e.target.value })}
                  placeholder="Street, City, Postal Code..."
                  className="w-full px-3 py-2 rounded-xl border border-[#F3E5DC] focus:outline-none focus:border-[#F67009]"
                />
              </div>

              <div className="pt-3 border-t border-[#F3E5DC] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setVendorModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-white font-bold bg-gradient-to-r from-[#F67009] to-[#F88D3A] hover:brightness-105 shadow-md flex items-center gap-1.5"
                >
                  {submitting && <FontAwesomeIcon icon={faSpinner} className="animate-spin" />}
                  <span>Save Vendor</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- MODAL 3: RECORD PURCHASE INVOICE ---------------- */}
      {purchaseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-[#F3E5DC] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-[#F3E5DC] flex items-center justify-between bg-[#FFF9F6]/50">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FontAwesomeIcon icon={faReceipt} className="text-[#F67009]" />
                <span>{currentPurchase.purchaseId ? 'Edit Procurement Invoice' : 'Record Purchase Invoice'}</span>
              </h2>
              <button
                onClick={() => setPurchaseModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <form onSubmit={handleSavePurchase} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Invoice Number *</label>
                  <input
                    type="text"
                    required
                    value={currentPurchase.invoiceNumber || ''}
                    onChange={e => setCurrentPurchase({ ...currentPurchase, invoiceNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#F3E5DC] focus:outline-none focus:border-[#F67009]"
                    placeholder="e.g. INV-2026-0042"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Invoice Date</label>
                  <input
                    type="date"
                    value={currentPurchase.purchaseDate ? currentPurchase.purchaseDate.split('T')[0] : ''}
                    onChange={e => setCurrentPurchase({ ...currentPurchase, purchaseDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#F3E5DC] focus:outline-none focus:border-[#F67009]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Vendor / Supplier</label>
                <select
                  value={currentPurchase.vendorId || ''}
                  onChange={e => {
                    const v = vendors.find(ven => ven.vendorId === e.target.value);
                    setCurrentPurchase({
                      ...currentPurchase,
                      vendorId: e.target.value,
                      vendorName: v ? v.vendorName : currentPurchase.vendorName,
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-[#F3E5DC] focus:outline-none focus:border-[#F67009]"
                >
                  <option value="">Select Vendor...</option>
                  {vendors.map(v => (
                    <option key={v.vendorId} value={v.vendorId}>
                      {v.vendorName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Total Amount ({currency}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={currentPurchase.totalAmount ?? 0}
                    onChange={e => setCurrentPurchase({ ...currentPurchase, totalAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-[#F3E5DC] focus:outline-none focus:border-[#F67009]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Tax Amount ({currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={currentPurchase.taxAmount ?? 0}
                    onChange={e => setCurrentPurchase({ ...currentPurchase, taxAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-[#F3E5DC] focus:outline-none focus:border-[#F67009]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Payment Mode</label>
                  <select
                    value={currentPurchase.paymentMode || 'CASH'}
                    onChange={e => setCurrentPurchase({ ...currentPurchase, paymentMode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#F3E5DC] focus:outline-none focus:border-[#F67009]"
                  >
                    <option value="CASH">CASH</option>
                    <option value="UPI">UPI / QR</option>
                    <option value="BANK_TRANSFER">BANK TRANSFER</option>
                    <option value="CARD">CARD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Payment Status</label>
                  <select
                    value={currentPurchase.paymentStatus || 'PAID'}
                    onChange={e => setCurrentPurchase({ ...currentPurchase, paymentStatus: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#F3E5DC] focus:outline-none focus:border-[#F67009]"
                  >
                    <option value="PAID">PAID</option>
                    <option value="PENDING">PENDING</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Items / Service Description</label>
                <textarea
                  rows={2}
                  value={currentPurchase.itemsDescription || ''}
                  onChange={e => setCurrentPurchase({ ...currentPurchase, itemsDescription: e.target.value })}
                  placeholder="e.g. 2x Commercial Burners, 100kg Basmati Rice..."
                  className="w-full px-3 py-2 rounded-xl border border-[#F3E5DC] focus:outline-none focus:border-[#F67009]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Notes</label>
                <input
                  type="text"
                  value={currentPurchase.notes || ''}
                  onChange={e => setCurrentPurchase({ ...currentPurchase, notes: e.target.value })}
                  placeholder="e.g. Received at back pantry door"
                  className="w-full px-3 py-2 rounded-xl border border-[#F3E5DC] focus:outline-none focus:border-[#F67009]"
                />
              </div>

              <div className="pt-3 border-t border-[#F3E5DC] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPurchaseModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-white font-bold bg-gradient-to-r from-[#F67009] to-[#F88D3A] hover:brightness-105 shadow-md flex items-center gap-1.5"
                >
                  {submitting && <FontAwesomeIcon icon={faSpinner} className="animate-spin" />}
                  <span>Save Invoice</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- MODAL 4: DELETE CONFIRMATION ---------------- */}
      {deleteModalOpen && deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-[#F3E5DC] p-5 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center text-xl mx-auto mb-3">
              <FontAwesomeIcon icon={faTrashCan} />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Confirm Deletion</h3>
            <p className="text-xs text-slate-500 mb-4">
              Are you sure you want to permanently remove <strong className="text-slate-800">"{deleteTarget.name}"</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmDelete}
                className="flex-1 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs"
              >
                {submitting ? 'Removing...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetManagementPage;
