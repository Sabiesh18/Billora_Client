import React, { useState, useEffect, useMemo } from 'react';
import { categoryApi, menuApi, tableApi, billApi } from '../api/client';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import PaymentModal from '../components/billing/PaymentModal';
import ThermalReceiptModal from '../components/billing/ThermalReceiptModal';
import KOTModal from '../components/billing/KOTModal';
import { Category, MenuItem, Table, Bill, CartItem } from '../types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMagnifyingGlass,
  faXmark,
  faUtensils,
  faBagShopping,
  faMotorcycle,
  faMinus,
  faPlus,
  faTrashCan,
  faCartShopping,
  faKitchenSet,
  faFloppyDisk,
  faMoneyBillWave,
} from '@fortawesome/free-solid-svg-icons';

export const BillingPage: React.FC = () => {
  const { settings } = useSettings();
  const { showToast } = useToast();

  // State
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Bill & Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<string>('DINE_IN');
  const [selectedTableId, setSelectedTableId] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [discountType, setDiscountType] = useState<'NONE' | 'PERCENT' | 'FLAT'>('NONE');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');

  // Modals state
  const [settleModalOpen, setSettleModalOpen] = useState<boolean>(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState<boolean>(false);
  const [kotModalOpen, setKotModalOpen] = useState<boolean>(false);
  const [currentBillData, setCurrentBillData] = useState<Bill | null>(null);
  const [processing, setProcessing] = useState<boolean>(false);

  // Initial load
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [cats, items, tbls] = await Promise.all([
          categoryApi.getAll(),
          menuApi.getAll({ pageSize: 200, onlyAvailable: true }),
          tableApi.getAll(),
        ]);
        setCategories(cats || []);
        setMenuItems(items || []);
        setTables(tbls || []);

        // Default to first available table if dine-in
        const firstAvail = (tbls || []).find((t) => t.status === 'AVAILABLE');
        if (firstAvail) setSelectedTableId(firstAvail.tableId);
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        showToast('Error loading menu catalog: ' + errorMsg, 'error');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [showToast]);

  // Cart operations
  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.itemId === item.itemId);
      if (existing) {
        return prev.map((i) =>
          i.itemId === item.itemId ? { ...i, quantity: i.quantity + 1 } : i
        );
      } else {
        return [
          ...prev,
          {
            itemId: item.itemId,
            itemName: item.itemName,
            unitPrice: Number(item.price),
            taxRate: Number(item.taxRate || settings.default_tax_rate || 5),
            quantity: 1,
            notes: '',
          },
        ];
      }
    });
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.itemId === itemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter((i): i is CartItem => i !== null)
    );
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((i) => i.itemId !== itemId));
  };

  const clearCart = () => {
    setCart([]);
    setCurrentBillData(null);
    setNotes('');
    setDiscountValue(0);
    setDiscountType('NONE');
    setCustomerName('');
    setCustomerPhone('');
  };

  // Financial Computations matching C# FinancialCalculator.cs logic
  const financialTotals = useMemo(() => {
    const subTotal = cart.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);

    let discountAmount = 0;
    if (discountType === 'PERCENT') {
      discountAmount = (subTotal * Math.min(Math.max(discountValue, 0), 100)) / 100;
    } else if (discountType === 'FLAT') {
      discountAmount = Math.min(Math.max(discountValue, 0), subTotal);
    }

    const taxableAmount = Math.max(subTotal - discountAmount, 0);
    const taxRate = Number(settings.default_tax_rate || 5);
    const taxAmount = (taxableAmount * taxRate) / 100;

    const rawGrandTotal = taxableAmount + taxAmount;
    const roundedGrandTotal = Math.round(rawGrandTotal);
    const roundOff = Number((roundedGrandTotal - rawGrandTotal).toFixed(2));

    return {
      subTotal: Number(subTotal.toFixed(2)),
      discountAmount: Number(discountAmount.toFixed(2)),
      taxableAmount: Number(taxableAmount.toFixed(2)),
      taxRate,
      taxAmount: Number(taxAmount.toFixed(2)),
      roundOff,
      grandTotal: roundedGrandTotal,
    };
  }, [cart, discountType, discountValue, settings.default_tax_rate]);

  // Filtered Menu Items
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCategory =
        selectedCategory === 'ALL' || item.categoryId === selectedCategory;
      const matchesSearch =
        !searchQuery ||
        item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.itemCode && item.itemCode.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  // Bill Creation
  const handleCreateBill = async (): Promise<Bill | null> => {
    if (cart.length === 0) {
      showToast('Cannot save empty bill. Please add items.', 'warning');
      return null;
    }

    if (orderType === 'DINE_IN' && !selectedTableId) {
      showToast('Please select a dining table for Dine-In orders', 'warning');
      return null;
    }

    setProcessing(true);
    try {
      const payload = {
        orderType,
        tableId: orderType === 'DINE_IN' ? selectedTableId : null,
        customerName: customerName.trim() || (orderType === 'DINE_IN' ? 'Dine-In Guest' : 'Takeaway Customer'),
        customerPhone: customerPhone.trim() || null,
        items: cart.map((i) => ({
          itemId: i.itemId,
          itemName: i.itemName,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          taxRate: i.taxRate,
          notes: i.notes || '',
        })),
        discountType,
        discountValue,
        notes: notes.trim() || null,
      };

      const billRes: any = await billApi.create(payload as any);
      showToast(`Bill #${billRes.billNumber} created successfully!`, 'success');

      // Populate full bill details including items and calculations for printing receipt
      const fullBill: Bill = {
        ...billRes,
        items: cart.map((c) => ({
          itemName: c.itemName,
          quantity: c.quantity,
          unitPrice: c.unitPrice,
          totalPrice: c.unitPrice * c.quantity,
          notes: c.notes,
        })),
        tableNumber: tables.find((t) => t.tableId === selectedTableId)?.tableNumber || 'WALK-IN',
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        subTotal: financialTotals.subTotal,
        discountAmount: financialTotals.discountAmount,
        taxAmount: financialTotals.taxAmount,
        taxRate: financialTotals.taxRate,
        grandTotal: financialTotals.grandTotal,
      };
      setCurrentBillData(fullBill);

      // Refresh tables to reflect OCCUPIED status
      const tbls = await tableApi.getAll();
      setTables(tbls || []);

      return billRes;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create bill';
      showToast('Bill creation failed: ' + errorMsg, 'error');
      throw err;
    } finally {
      setProcessing(false);
    }
  };

  // Pay & Settle flow
  const handleProceedToPayment = async () => {
    try {
      let billData = currentBillData;
      if (!billData) {
        billData = await handleCreateBill();
      }
      if (billData) {
        setSettleModalOpen(true);
      }
    } catch {
      // Handled in handleCreateBill
    }
  };

  const handleSettleConfirm = async ({ paymentMode, amountPaid, notes: payNotes }: { paymentMode: string; amountPaid: number; notes?: string }) => {
    if (!currentBillData?.billId) return;
    setProcessing(true);
    try {
      await billApi.settle(currentBillData.billId, {
        paymentMode,
        amountPaid,
        notes: payNotes,
      });

      showToast('Bill settled and payment collected via ' + paymentMode + '!', 'success');

      // Update bill record with settled state
      const updated: Bill = {
        ...currentBillData,
        paymentMode: paymentMode as any,
        paymentStatus: 'PAID',
        billStatus: 'SETTLED',
        status: 'PAID',
      };
      setCurrentBillData(updated);
      setSettleModalOpen(false);
      setReceiptModalOpen(true);

      // Reset cart and customer fields, but retain currentBillData for thermal receipt
      setCart([]);
      setNotes('');
      setDiscountValue(0);
      setDiscountType('NONE');
      setCustomerName('');
      setCustomerPhone('');
      const tbls = await tableApi.getAll();
      setTables(tbls || []);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Settlement failed';
      showToast('Settlement failed: ' + errorMsg, 'error');
    } finally {
      setProcessing(false);
    }
  };

  const selectedTableObj = tables.find((t) => t.tableId === selectedTableId);

  return (
    <div className="h-[calc(100vh-5.5rem)] flex flex-col lg:flex-row gap-4 overflow-hidden font-sans">
      {/* LEFT: Menu Catalog & Categories */}
      <div className="flex-1 flex flex-col bg-white border border-[#F3E5DC] rounded-2xl overflow-hidden shadow-sm">
        {/* Search & Order Mode Bar */}
        <div className="p-3 border-b border-[#F3E5DC] bg-[#FFF9F6] flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <span className="absolute left-3 top-2.5 text-slate-400 text-xs">
              <FontAwesomeIcon icon={faMagnifyingGlass} />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes or item code..."
              className="w-full bg-white border border-[#E5D7CE] rounded-xl pl-9 pr-8 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#F67009] focus:ring-1 focus:ring-[#F67009]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-700 text-xs"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            )}
          </div>

          {/* Quick Categories count */}
          <span className="text-xs text-slate-500 hidden sm:inline">
            Showing <strong className="text-[#F67009] font-bold">{filteredMenuItems.length}</strong> items
          </span>
        </div>

        {/* Category Horizontal Filter Pills */}
        <div className="px-3 py-2 border-b border-[#F3E5DC] flex gap-1.5 overflow-x-auto select-none bg-white">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === 'ALL'
                ? 'bg-gradient-to-r from-[#F67009] to-[#F88D3A] text-white shadow-sm'
                : 'bg-[#FFF9F6] text-slate-700 hover:bg-[#FFF0E6] hover:text-[#F67009] border border-[#F3E5DC]'
            }`}
          >
            All Items
          </button>
          {categories.map((cat) => (
            <button
              key={cat.categoryId}
              onClick={() => setSelectedCategory(cat.categoryId)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat.categoryId
                  ? 'bg-gradient-to-r from-[#F67009] to-[#F88D3A] text-white shadow-sm'
                  : 'bg-[#FFF9F6] text-slate-700 hover:bg-[#FFF0E6] hover:text-[#F67009] border border-[#F3E5DC]'
              }`}
            >
              {cat.categoryName}
            </button>
          ))}
        </div>

        {/* Menu Items Grid */}
        <div className="flex-1 overflow-y-auto p-3.5 bg-[#FFF9F6]">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-slate-400 text-xs">
              <span className="w-5 h-5 border-2 border-[#F67009] border-t-transparent rounded-full animate-spin mr-2"></span>
              Loading menu catalog...
            </div>
          ) : filteredMenuItems.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredMenuItems.map((item) => {
                const inCart = cart.find((i) => i.itemId === item.itemId);
                const isVeg = item.foodType === 'VEG';
                const isNonVeg = item.foodType === 'NON_VEG';

                return (
                  <button
                    key={item.itemId}
                    onClick={() => addToCart(item)}
                    className="group relative flex flex-col justify-between text-left p-3.5 rounded-2xl bg-white hover:bg-[#FFF9F6] border border-[#F3E5DC] hover:border-[#F88D3A] transition-all shadow-xs hover:shadow-md active:scale-[0.98]"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        {/* Food Type Indicator */}
                        <span
                          className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center p-0.5 ${
                            isVeg
                              ? 'border-emerald-500 text-emerald-500'
                              : isNonVeg
                              ? 'border-rose-500 text-rose-500'
                              : 'border-blue-500 text-blue-500'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isVeg ? 'bg-emerald-500' : isNonVeg ? 'bg-rose-500' : 'bg-blue-500'
                            }`}
                          ></span>
                        </span>

                        {item.itemCode && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {item.itemCode}
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs font-bold text-slate-800 group-hover:text-[#F67009] line-clamp-2 leading-snug">
                        {item.itemName}
                      </h4>
                    </div>

                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-[#F3E5DC]">
                      <span className="text-xs font-black text-[#F67009]">
                        {settings.currency_symbol || '₹'} {Number(item.price).toFixed(2)}
                      </span>

                      {inCart ? (
                        <span className="text-[11px] font-bold bg-gradient-to-r from-[#F67009] to-[#F88D3A] text-white px-2 py-0.5 rounded-full shadow-xs">
                          {inCart.quantity} in cart
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500 group-hover:text-[#F67009] font-bold">
                          + Add
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 text-slate-400 text-xs">
              No matching items found. Try another search or category.
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Live Bill & Cart Summary */}
      <div className="w-full lg:w-[420px] bg-white border border-[#F3E5DC] rounded-2xl flex flex-col justify-between overflow-hidden shadow-md shrink-0">
        {/* Cart Header & Order Type Selector */}
        <div className="p-3 border-b border-[#F3E5DC] bg-[#FFF9F6] space-y-2.5">
          {/* Order Type Tabs */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-white rounded-xl border border-[#F3E5DC] text-xs font-semibold">
            {[
              { id: 'DINE_IN', label: 'Dine-In', icon: faUtensils },
              { id: 'TAKEAWAY', label: 'Takeaway', icon: faBagShopping },
              { id: 'DELIVERY', label: 'Delivery', icon: faMotorcycle },
            ].map((ot) => (
              <button
                key={ot.id}
                type="button"
                onClick={() => setOrderType(ot.id)}
                className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  orderType === ot.id
                    ? 'bg-gradient-to-r from-[#F67009] to-[#F88D3A] text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-[#F67009]'
                }`}
              >
                <FontAwesomeIcon icon={ot.icon} className="text-[11px]" />
                <span>{ot.label}</span>
              </button>
            ))}
          </div>

          {/* Table / Customer Details Inputs */}
          <div className="grid grid-cols-2 gap-2">
            {orderType === 'DINE_IN' ? (
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Table
                </label>
                <select
                  value={selectedTableId}
                  onChange={(e) => setSelectedTableId(e.target.value)}
                  className="w-full bg-white border border-[#E5D7CE] rounded-lg px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#F67009]"
                >
                  <option value="">Select Table</option>
                  {tables.map((t) => (
                    <option key={t.tableId} value={t.tableId}>
                      {t.tableNumber} ({t.status})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Guest Name"
                  className="w-full bg-white border border-[#E5D7CE] rounded-lg px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#F67009]"
                />
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Optional"
                className="w-full bg-white border border-[#E5D7CE] rounded-lg px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#F67009]"
              />
            </div>
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-[#FFF9F6]">
          {cart.length > 0 ? (
            cart.map((item) => (
              <div key={item.itemId} className="p-2.5 rounded-xl bg-white border border-[#F3E5DC] flex items-center justify-between gap-2 shadow-xs">
                <div className="flex-1 min-w-0 pr-1">
                  <h5 className="text-xs font-bold text-slate-800 truncate">{item.itemName}</h5>
                  <p className="text-[11px] text-slate-500">
                    {settings.currency_symbol || '₹'} {item.unitPrice.toFixed(2)} each
                  </p>
                </div>

                {/* Qty Stepper */}
                <div className="flex items-center gap-1.5 bg-[#FFF9F6] border border-[#F3E5DC] rounded-lg px-1.5 py-1">
                  <button
                    onClick={() => updateQuantity(item.itemId, -1)}
                    className="w-5 h-5 rounded bg-white hover:bg-[#FFF0E6] text-slate-700 hover:text-[#F67009] text-xs font-bold flex items-center justify-center border border-[#E5D7CE]"
                  >
                    <FontAwesomeIcon icon={faMinus} className="text-[9px]" />
                  </button>
                  <span className="w-5 text-center text-xs font-black text-slate-900">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.itemId, 1)}
                    className="w-5 h-5 rounded bg-white hover:bg-[#FFF0E6] text-slate-700 hover:text-[#F67009] text-xs font-bold flex items-center justify-center border border-[#E5D7CE]"
                  >
                    <FontAwesomeIcon icon={faPlus} className="text-[9px]" />
                  </button>
                </div>

                {/* Line Total & Delete */}
                <div className="text-right w-16">
                  <p className="text-xs font-black text-[#F67009]">
                    {settings.currency_symbol || '₹'} {(item.quantity * item.unitPrice).toFixed(2)}
                  </p>
                  <button
                    onClick={() => removeFromCart(item.itemId)}
                    className="text-[10px] text-rose-500 hover:text-rose-700 font-semibold flex items-center justify-end gap-1 w-full mt-0.5"
                  >
                    <FontAwesomeIcon icon={faTrashCan} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs py-12">
              <span className="w-12 h-12 rounded-2xl bg-[#FFF0E6] text-[#F67009] flex items-center justify-center text-xl mb-2">
                <FontAwesomeIcon icon={faCartShopping} />
              </span>
              <p className="font-bold text-slate-600">Cart is currently empty</p>
              <p className="text-[10px] text-slate-400">Select dishes from the menu catalog to begin</p>
            </div>
          )}
        </div>

        {/* Financial Summary & Bottom Settlement Toolbar */}
        <div className="p-3.5 border-t border-[#F3E5DC] bg-white space-y-2.5">
          {/* Subtotal & Discount row */}
          <div className="space-y-1 text-xs text-slate-500">
            <div className="flex justify-between">
              <span>Items Subtotal:</span>
              <span className="font-bold text-slate-800">
                {settings.currency_symbol || '₹'} {financialTotals.subTotal.toFixed(2)}
              </span>
            </div>

            {/* Discount selector */}
            <div className="flex items-center justify-between text-xs py-0.5">
              <span className="flex items-center gap-1.5">
                <span>Discount:</span>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as 'NONE' | 'PERCENT' | 'FLAT')}
                  className="bg-[#FFF9F6] border border-[#E5D7CE] rounded px-1.5 py-0.5 text-[11px] text-slate-700 font-medium"
                >
                  <option value="NONE">None</option>
                  <option value="PERCENT">%</option>
                  <option value="FLAT">{settings.currency_symbol || '₹'}</option>
                </select>
                {discountType !== 'NONE' && (
                  <input
                    type="number"
                    min="0"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-12 bg-[#FFF9F6] border border-[#E5D7CE] rounded px-1 text-[11px] text-slate-800 text-right font-bold"
                  />
                )}
              </span>
              <span className="text-rose-600 font-bold">
                - {settings.currency_symbol || '₹'} {financialTotals.discountAmount.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between">
              <span>GST ({financialTotals.taxRate}%):</span>
              <span className="font-bold text-slate-800">
                {settings.currency_symbol || '₹'} {financialTotals.taxAmount.toFixed(2)}
              </span>
            </div>

            {financialTotals.roundOff !== 0 && (
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Round Off:</span>
                <span>{financialTotals.roundOff > 0 ? `+${financialTotals.roundOff}` : financialTotals.roundOff}</span>
              </div>
            )}
          </div>

          {/* Grand Total */}
          <div className="pt-2 border-t border-[#F3E5DC] flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700">Grand Total:</span>
            <span className="text-2xl font-black text-[#F67009]">
              {settings.currency_symbol || '₹'} {financialTotals.grandTotal.toFixed(2)}
            </span>
          </div>

          {/* Action Button Grid */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              type="button"
              disabled={cart.length === 0}
              onClick={() => setKotModalOpen(true)}
              className="py-2.5 px-2 bg-[#FFF0E6] hover:bg-[#FED7AA] text-[#F67009] rounded-xl text-xs font-bold border border-[#FED7AA] disabled:opacity-50 transition-colors shadow-xs flex items-center justify-center gap-1.5"
            >
              <FontAwesomeIcon icon={faKitchenSet} />
              <span>Kitchen Slip</span>
            </button>

            <button
              type="button"
              disabled={cart.length === 0 || processing}
              onClick={handleCreateBill}
              className="py-2.5 px-2 bg-white border-2 border-[#F67009] text-[#F67009] hover:bg-[#FFF0E6] rounded-xl text-xs font-bold disabled:opacity-50 transition-colors shadow-xs flex items-center justify-center gap-1.5"
            >
              <FontAwesomeIcon icon={faFloppyDisk} />
              <span>Hold Bill</span>
            </button>

            <button
              type="button"
              disabled={cart.length === 0 || processing}
              onClick={handleProceedToPayment}
              className="py-2.5 px-2 bg-gradient-to-r from-[#F67009] to-[#F88D3A] hover:opacity-95 text-white rounded-xl text-xs font-black shadow-md disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
            >
              <FontAwesomeIcon icon={faMoneyBillWave} />
              <span>Settle Bill</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODALS */}
      {settleModalOpen && currentBillData && (
        <PaymentModal
          bill={currentBillData}
          onSettle={handleSettleConfirm}
          onClose={() => setSettleModalOpen(false)}
          loading={processing}
        />
      )}

      {receiptModalOpen && currentBillData && (
        <ThermalReceiptModal
          bill={currentBillData}
          onClose={() => {
            setReceiptModalOpen(false);
            setCurrentBillData(null);
          }}
        />
      )}

      {kotModalOpen && (
        <KOTModal
          items={cart}
          tableNumber={selectedTableObj?.tableNumber}
          orderType={orderType}
          billNumber={currentBillData?.billNumber}
          onClose={() => setKotModalOpen(false)}
        />
      )}
    </div>
  );
};

export default BillingPage;
