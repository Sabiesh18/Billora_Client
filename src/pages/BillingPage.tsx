import React, { useState, useEffect, useMemo } from 'react';
import { categoryApi, menuApi, tableApi, billApi } from '../api/client';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import PaymentModal from '../components/billing/PaymentModal';
import ThermalReceiptModal from '../components/billing/ThermalReceiptModal';
import KOTModal from '../components/billing/KOTModal';
import { Category, MenuItem, Table, Bill, CartItem } from '../types';

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
    setDiscountType('NONE');
    setDiscountValue(0);
    setNotes('');
  };

  // Filtered menu items
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchCat =
        selectedCategory === 'ALL' || item.categoryId === selectedCategory;
      const matchSearch =
        !searchQuery ||
        item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.itemCode &&
          item.itemCode.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  // Financial Calculations matching backend engine
  const financialTotals = useMemo(() => {
    const subTotal = cart.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );

    let discountAmount = 0;
    if (discountType === 'PERCENT') {
      discountAmount = (subTotal * Math.min(Math.max(Number(discountValue) || 0, 0), 100)) / 100;
    } else if (discountType === 'FLAT') {
      discountAmount = Math.min(Number(discountValue) || 0, subTotal);
    }

    const taxableAmount = Math.max(0, subTotal - discountAmount);
    const taxRate = Number(settings.default_tax_rate || 5);
    const taxAmount = (taxableAmount * taxRate) / 100;

    const unroundedTotal = taxableAmount + taxAmount;
    const grandTotal = Math.round(unroundedTotal);
    const roundOff = Number((grandTotal - unroundedTotal).toFixed(2));

    return {
      subTotal: Number(subTotal.toFixed(2)),
      discountAmount: Number(discountAmount.toFixed(2)),
      taxRate,
      taxAmount: Number(taxAmount.toFixed(2)),
      roundOff,
      grandTotal,
    };
  }, [cart, discountType, discountValue, settings.default_tax_rate]);

  // Handle Create / Save Bill
  const handleCreateBill = async (): Promise<Bill | undefined> => {
    if (cart.length === 0) {
      showToast('Please add items to cart before creating bill', 'warning');
      return;
    }

    if (orderType === 'DINE_IN' && !selectedTableId) {
      showToast('Please select a dining table for Dine-in orders', 'warning');
      return;
    }

    setProcessing(true);
    try {
      const payload = {
        orderType,
        tableId: orderType === 'DINE_IN' ? selectedTableId : undefined,
        customerName: customerName.trim() || 'Walk-in Guest',
        customerPhone: customerPhone.trim() || undefined,
        items: cart,
        discountType,
        discountValue: Number(discountValue) || 0,
        notes: notes.trim() || undefined,
      };

      const result = await billApi.create(payload);
      showToast('Bill #' + result.billNumber + ' created successfully!', 'success');

      // Fetch full bill details for printing/settling
      const fullDetails = await billApi.getDetails(result.billId);
      setCurrentBillData(fullDetails);

      // Refresh tables to reflect occupancy
      const tbls = await tableApi.getAll();
      setTables(tbls || []);

      return fullDetails;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Bill creation failed';
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
        paymentMode,
        paymentStatus: 'PAID',
        status: 'PAID',
      };
      setCurrentBillData(updated);
      setSettleModalOpen(false);
      setReceiptModalOpen(true);

      // Reset cart and refresh tables
      clearCart();
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
    <div className="h-[calc(100vh-5.5rem)] flex flex-col lg:flex-row gap-4 overflow-hidden">
      {/* LEFT: Menu Catalog & Categories */}
      <div className="flex-1 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {/* Search & Order Mode Bar */}
        <div className="p-3 border-b border-slate-800 bg-slate-950/40 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <span className="absolute left-3 top-2.5 text-slate-500 text-sm">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes or item code..."
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-white text-xs"
              >
                &times;
              </button>
            )}
          </div>

          {/* Quick Categories count */}
          <span className="text-xs text-slate-400 hidden sm:inline">
            Showing <strong className="text-slate-200">{filteredMenuItems.length}</strong> items
          </span>
        </div>

        {/* Category Horizontal Filter Pills */}
        <div className="px-3 py-2 border-b border-slate-800 flex gap-1.5 overflow-x-auto select-none bg-slate-900/80">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === 'ALL'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            All Items
          </button>
          {categories.map((cat) => (
            <button
              key={cat.categoryId}
              onClick={() => setSelectedCategory(cat.categoryId)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat.categoryId
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {cat.categoryName}
            </button>
          ))}
        </div>

        {/* Menu Items Grid */}
        <div className="flex-1 overflow-y-auto p-3.5">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-slate-400 text-xs">
              <span className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mr-2"></span>
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
                    className="group relative flex flex-col justify-between text-left p-3 rounded-xl bg-slate-950/70 hover:bg-slate-800/90 border border-slate-800 hover:border-amber-500/50 transition-all shadow-sm active:scale-[0.98]"
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

                      <h4 className="text-xs font-bold text-slate-100 group-hover:text-amber-400 line-clamp-2 leading-snug">
                        {item.itemName}
                      </h4>
                    </div>

                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/60">
                      <span className="text-xs font-black text-amber-400">
                        {settings.currency_symbol || '₹'} {Number(item.price).toFixed(2)}
                      </span>

                      {inCart ? (
                        <span className="text-[11px] font-bold bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full">
                          {inCart.quantity} in cart
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 group-hover:text-white font-bold">
                          + Add
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 text-slate-500 text-xs">
              No matching items found. Try another search or category.
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Live Bill & Cart Summary */}
      <div className="w-full lg:w-[420px] bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between overflow-hidden shadow-xl shrink-0">
        {/* Cart Header & Order Type Selector */}
        <div className="p-3 border-b border-slate-800 bg-slate-950/60 space-y-2.5">
          {/* Order Type Tabs */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs font-semibold">
            {[
              { id: 'DINE_IN', label: '🍽️ Dine-In' },
              { id: 'TAKEAWAY', label: '🛍️ Takeaway' },
              { id: 'DELIVERY', label: '🛵 Delivery' },
            ].map((ot) => (
              <button
                key={ot.id}
                type="button"
                onClick={() => setOrderType(ot.id)}
                className={`py-1.5 rounded-md transition-all ${
                  orderType === ot.id
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {ot.label}
              </button>
            ))}
          </div>

          {/* Table / Customer Details Inputs */}
          <div className="grid grid-cols-2 gap-2">
            {orderType === 'DINE_IN' ? (
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Table
                </label>
                <select
                  value={selectedTableId}
                  onChange={(e) => setSelectedTableId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
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
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Guest Name"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>
            )}

            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Optional"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 divide-y divide-slate-800/60">
          {cart.length > 0 ? (
            cart.map((item) => (
              <div key={item.itemId} className="pt-2 first:pt-0 flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0 pr-1">
                  <h5 className="text-xs font-semibold text-slate-200 truncate">{item.itemName}</h5>
                  <p className="text-[11px] text-slate-400">
                    {settings.currency_symbol || '₹'} {item.unitPrice.toFixed(2)} each
                  </p>
                </div>

                {/* Qty Stepper */}
                <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-1.5 py-1">
                  <button
                    onClick={() => updateQuantity(item.itemId, -1)}
                    className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="w-5 text-center text-xs font-bold text-slate-100">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.itemId, 1)}
                    className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center"
                  >
                    +
                  </button>
                </div>

                {/* Line Total & Delete */}
                <div className="text-right w-16">
                  <p className="text-xs font-bold text-slate-100">
                    {settings.currency_symbol || '₹'} {(item.quantity * item.unitPrice).toFixed(2)}
                  </p>
                  <button
                    onClick={() => removeFromCart(item.itemId)}
                    className="text-[10px] text-rose-400 hover:text-rose-300"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs py-12">
              <span className="text-3xl mb-2 opacity-50">🛒</span>
              <p>Cart is currently empty</p>
              <p className="text-[10px] text-slate-600">Select dishes from the menu catalog to begin</p>
            </div>
          )}
        </div>

        {/* Financial Summary & Bottom Settlement Toolbar */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950/80 space-y-2.5">
          {/* Subtotal & Discount row */}
          <div className="space-y-1 text-xs text-slate-400">
            <div className="flex justify-between">
              <span>Items Subtotal:</span>
              <span className="font-medium text-slate-200">
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
                  className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-[11px] text-slate-300"
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
                    className="w-12 bg-slate-900 border border-slate-700 rounded px-1 text-[11px] text-slate-200 text-right"
                  />
                )}
              </span>
              <span className="text-rose-400 font-medium">
                - {settings.currency_symbol || '₹'} {financialTotals.discountAmount.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between">
              <span>GST ({financialTotals.taxRate}%):</span>
              <span className="text-slate-200">
                {settings.currency_symbol || '₹'} {financialTotals.taxAmount.toFixed(2)}
              </span>
            </div>

            {financialTotals.roundOff !== 0 && (
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>Round Off:</span>
                <span>{financialTotals.roundOff > 0 ? `+${financialTotals.roundOff}` : financialTotals.roundOff}</span>
              </div>
            )}
          </div>

          {/* Grand Total */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <span className="text-sm font-bold text-slate-200">Grand Total:</span>
            <span className="text-xl font-black text-amber-400">
              {settings.currency_symbol || '₹'} {financialTotals.grandTotal.toFixed(2)}
            </span>
          </div>

          {/* Action Button Grid */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              type="button"
              disabled={cart.length === 0}
              onClick={() => setKotModalOpen(true)}
              className="py-2.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold border border-slate-700 disabled:opacity-50 transition-colors"
            >
              🍳 Print KOT
            </button>

            <button
              type="button"
              disabled={cart.length === 0 || processing}
              onClick={handleCreateBill}
              className="py-2.5 px-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow disabled:opacity-50 transition-colors"
            >
              💾 Hold Bill
            </button>

            <button
              type="button"
              disabled={cart.length === 0 || processing}
              onClick={handleProceedToPayment}
              className="py-2.5 px-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-black shadow-lg disabled:opacity-50 transition-colors"
            >
              💰 Settle Bill
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
          onClose={() => setReceiptModalOpen(false)}
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
