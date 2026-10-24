import React, { useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const { showToast } = useToast();

  const [formData, setFormData] = useState<Record<string, string>>({
    restaurant_name: settings.restaurant_name || '',
    restaurant_tagline: settings.restaurant_tagline || '',
    restaurant_address: settings.restaurant_address || '',
    restaurant_phone: settings.restaurant_phone || '',
    restaurant_email: settings.restaurant_email || '',
    restaurant_gstin: settings.restaurant_gstin || '',
    fssai_license: settings.fssai_license || '',
    currency_symbol: settings.currency_symbol || '₹',
    currency_code: settings.currency_code || 'INR',
    default_tax_rate: settings.default_tax_rate || '5.00',
    thermal_printer_width: settings.thermal_printer_width || '80mm',
    receipt_footer: settings.receipt_footer || 'Thank You! Visit Again!',
  });
  const [saving, setSaving] = useState<boolean>(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettings(formData);
      showToast('Business settings saved successfully!', 'success');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save settings';
      showToast('Failed to save settings: ' + errorMsg, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-100">Restaurant & Billing Preferences</h2>
          <p className="text-xs text-slate-400">
            Configure business information, GSTIN, thermal printer widths (58mm/80mm), and offline defaults
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-sm">
        {/* Section 1: Business Profile */}
        <div>
          <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
            1. Restaurant Profile
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Restaurant Legal Name
              </label>
              <input
                type="text"
                name="restaurant_name"
                value={formData.restaurant_name || ''}
                onChange={handleChange}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Tagline / Slogan
              </label>
              <input
                type="text"
                name="restaurant_tagline"
                value={formData.restaurant_tagline || ''}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Complete Address (Printed on Receipts)
              </label>
              <input
                type="text"
                name="restaurant_address"
                value={formData.restaurant_address || ''}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Phone Contact Number
              </label>
              <input
                type="text"
                name="restaurant_phone"
                value={formData.restaurant_phone || ''}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Billing Support Email
              </label>
              <input
                type="email"
                name="restaurant_email"
                value={formData.restaurant_email || ''}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Taxation, Currency & Thermal Printer */}
        <div>
          <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
            2. Taxation, Currency & Thermal Printer Settings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                GSTIN / Tax ID
              </label>
              <input
                type="text"
                name="restaurant_gstin"
                value={formData.restaurant_gstin || ''}
                onChange={handleChange}
                placeholder="e.g. 33ABCDE1234F1Z5"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                FSSAI License No.
              </label>
              <input
                type="text"
                name="fssai_license"
                value={formData.fssai_license || ''}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Currency Symbol
              </label>
              <input
                type="text"
                name="currency_symbol"
                value={formData.currency_symbol || '₹'}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Default GST Tax Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                name="default_tax_rate"
                value={formData.default_tax_rate || '5.00'}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Default Thermal Printer Format
              </label>
              <select
                name="thermal_printer_width"
                value={formData.thermal_printer_width || '80mm'}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="80mm">80mm (Standard POS Thermal Roll)</option>
                <option value="58mm">58mm (Compact Mobile POS Thermal Roll)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Receipt Footer */}
        <div>
          <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
            3. Thermal Receipt Customization
          </h3>
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Receipt Footer Courtesy Message
            </label>
            <input
              type="text"
              name="receipt_footer"
              value={formData.receipt_footer || ''}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4 border-t border-slate-800">
          <button
            type="submit"
            disabled={saving}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-6 py-2.5 rounded-lg shadow-lg flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving Changes...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;
