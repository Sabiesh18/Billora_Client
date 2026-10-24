import React, { useState, useEffect } from 'react';
import { categoryApi, menuApi } from '../api/client';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { Category, MenuItem, FoodType } from '../types';

export const MenuManagementPage: React.FC = () => {
  const { settings } = useSettings();
  const { showToast } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCat, setSelectedCat] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);

  // Category Modal
  const [catModalOpen, setCatModalOpen] = useState<boolean>(false);
  const [newCatName, setNewCatName] = useState<string>('');
  const [newCatDesc, setNewCatDesc] = useState<string>('');

  // Item Modal
  const [itemModalOpen, setItemModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemCategoryId, setItemCategoryId] = useState<string>('');
  const [itemCode, setItemCode] = useState<string>('');
  const [itemName, setItemName] = useState<string>('');
  const [itemDesc, setItemDesc] = useState<string>('');
  const [itemPrice, setItemPrice] = useState<string | number>('');
  const [itemFoodType, setItemFoodType] = useState<FoodType>('VEG');
  const [itemTaxRate, setItemTaxRate] = useState<string | number>('5.00');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cats, items] = await Promise.all([
        categoryApi.getAll(true),
        menuApi.getAll({ pageSize: 300 }),
      ]);
      setCategories(cats || []);
      setMenuItems(items || []);
      if (cats && cats.length > 0 && !itemCategoryId) {
        setItemCategoryId(cats[0].categoryId);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error loading menu';
      showToast('Error loading menu: ' + errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      await categoryApi.create({
        categoryName: newCatName.trim(),
        description: newCatDesc.trim(),
        displayOrder: categories.length + 1,
      });
      showToast('Category created successfully', 'success');
      setCatModalOpen(false);
      setNewCatName('');
      setNewCatDesc('');
      fetchData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create category';
      showToast('Failed to create category: ' + errorMsg, 'error');
    }
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim() || !itemPrice) {
      showToast('Item name and price are required', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        categoryId: itemCategoryId,
        itemCode: itemCode.trim() || undefined,
        itemName: itemName.trim(),
        description: itemDesc.trim() || undefined,
        price: Number(itemPrice),
        foodType: itemFoodType,
        taxRate: Number(itemTaxRate) || 5,
        isAvailable: true,
      };

      if (editingItem) {
        await menuApi.update(editingItem.itemId, payload);
        showToast('Menu item updated', 'success');
      } else {
        await menuApi.create(payload);
        showToast('Menu item added', 'success');
      }

      setItemModalOpen(false);
      resetItemForm();
      fetchData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save menu item';
      showToast('Failed to save menu item: ' + errorMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setItemCategoryId(item.categoryId);
    setItemCode(item.itemCode || '');
    setItemName(item.itemName);
    setItemDesc(item.description || '');
    setItemPrice(item.price);
    setItemFoodType(item.foodType);
    setItemTaxRate(item.taxRate || '5.00');
    setItemModalOpen(true);
  };

  const resetItemForm = () => {
    setEditingItem(null);
    setItemCode('');
    setItemName('');
    setItemDesc('');
    setItemPrice('');
    setItemFoodType('VEG');
    setItemTaxRate('5.00');
  };

  const handleToggleAvailability = async (item: MenuItem) => {
    try {
      await menuApi.update(item.itemId, {
        ...item,
        isAvailable: !item.isAvailable,
      });
      showToast(`${item.itemName} marked as ${!item.isAvailable ? 'Available' : 'Unavailable'}`, 'info');
      fetchData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Toggle failed';
      showToast('Toggle failed: ' + errorMsg, 'error');
    }
  };

  const filteredItems = menuItems.filter(
    (item) => selectedCat === 'ALL' || item.categoryId === selectedCat
  );

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Top Action Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-100">Menu & Price Management</h2>
          <p className="text-xs text-slate-400">Configure food items, categories, pricing, and availability</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setCatModalOpen(true)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-700 transition-colors"
          >
            + Add Category
          </button>
          <button
            onClick={() => {
              resetItemForm();
              setItemModalOpen(true);
            }}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-3.5 py-2 rounded-lg shadow transition-colors"
          >
            + Add Menu Item
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedCat('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            selectedCat === 'ALL'
              ? 'bg-amber-500 text-slate-950 font-bold'
              : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800'
          }`}
        >
          All Items ({menuItems.length})
        </button>
        {categories.map((c) => (
          <button
            key={c.categoryId}
            onClick={() => setSelectedCat(c.categoryId)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedCat === c.categoryId
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800'
            }`}
          >
            {c.categoryName} ({c.itemCount || 0})
          </button>
        ))}
      </div>

      {/* Items Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3.5">Code</th>
                <th className="p-3.5">Item Name</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Type</th>
                <th className="p-3.5 text-right">Price</th>
                <th className="p-3.5 text-center">Tax %</th>
                <th className="p-3.5 text-center">Availability</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    Loading menu items...
                  </td>
                </tr>
              ) : filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <tr key={item.itemId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-mono text-slate-400 font-bold">
                      {item.itemCode || '---'}
                    </td>
                    <td className="p-3.5 font-bold text-slate-100">
                      {item.itemName}
                      {item.description && (
                        <p className="text-[10px] text-slate-400 font-normal mt-0.5 line-clamp-1">{item.description}</p>
                      )}
                    </td>
                    <td className="p-3.5 text-slate-400">{item.categoryName}</td>
                    <td className="p-3.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          item.foodType === 'VEG'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : item.foodType === 'NON_VEG'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                        }`}
                      >
                        {item.foodType}
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-black text-amber-400">
                      {settings.currency_symbol || '₹'} {Number(item.price).toFixed(2)}
                    </td>
                    <td className="p-3.5 text-center text-slate-400">{item.taxRate}%</td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => handleToggleAvailability(item)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider transition-colors ${
                          item.isAvailable
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {item.isAvailable ? 'In Stock' : 'Out of Stock'}
                      </button>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => openEditItem(item)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 font-medium transition-colors"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    No menu items in this category.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Item Modal */}
      {itemModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider mb-4">
              {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
            </h3>

            <form onSubmit={handleSaveItem} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={itemCategoryId}
                    onChange={(e) => setItemCategoryId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    {categories.map((c) => (
                      <option key={c.categoryId} value={c.categoryId}>
                        {c.categoryName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Item Code / SKU
                  </label>
                  <input
                    type="text"
                    value={itemCode}
                    onChange={(e) => setItemCode(e.target.value)}
                    placeholder="e.g. STR-105"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Item Name
                </label>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="e.g. Kadai Paneer"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Price ({settings.currency_symbol || '₹'})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Food Type
                  </label>
                  <select
                    value={itemFoodType}
                    onChange={(e) => setItemFoodType(e.target.value as FoodType)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="VEG">VEG</option>
                    <option value="NON_VEG">NON-VEG</option>
                    <option value="BEVERAGE">BEVERAGE</option>
                    <option value="DESSERT">DESSERT</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Tax Rate %
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={itemTaxRate}
                    onChange={(e) => setItemTaxRate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Description / Ingredients
                </label>
                <textarea
                  rows={2}
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                ></textarea>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setItemModalOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold transition-colors"
                >
                  {submitting ? 'Saving...' : 'Save Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {catModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider mb-4">
              Add Food Category
            </h3>
            <form onSubmit={handleCreateCategory} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Seafood Specialties"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="Optional notes"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                ></textarea>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setCatModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold transition-colors"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManagementPage;
