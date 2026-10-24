import React, { useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/common/ThemeToggle';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFloppyDisk,
  faStore,
  faPrint,
  faReceipt,
  faCircleHalfStroke,
} from '@fortawesome/free-solid-svg-icons';

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
    default_tax_rate: String(settings.default_tax_rate ?? '5.00'),
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
    <div className="max-w-4xl mx-auto space-y-6 font-sans">
      <div className="bg-white border border-[#F3E5DC] p-5 rounded-2xl flex items-center justify-between shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900">Restaurant & Billing Preferences</h2>
          <p className="text-xs text-slate-500">
            Configure business information, GSTIN, thermal printer widths (58mm/80mm), and offline defaults
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white border border-[#F3E5DC] rounded-3xl p-6 space-y-6 shadow-sm">
        {/* Section 1: Business Profile */}
        <div>
          <h3 className="text-xs font-bold text-[#F67009] uppercase tracking-wider mb-4 border-b border-[#F3E5DC] pb-2 flex items-center gap-2">
            <FontAwesomeIcon icon={faStore} />
            <span>1. Restaurant Profile</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Restaurant Legal Name
              </label>
              <input
                type="text"
                name="restaurant_name"
                value={formData.restaurant_name || ''}
                onChange={handleChange}
                required
                className="w-full bg-white border border-[#E5D7CE] rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#F67009]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Tagline / Slogan
              </label>
              <input
                type="text"
                name="restaurant_tagline"
                value={formData.restaurant_tagline || ''}
                onChange={handleChange}
                className="w-full bg-white border border-[#E5D7CE] rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#F67009]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Complete Address (Printed on Receipts)
              </label>
              <input
                type="text"
                name="restaurant_address"
                value={formData.restaurant_address || ''}
                onChange={handleChange}
                className="w-full bg-white border border-[#E5D7CE] rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#F67009]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Phone Contact Number
              </label>
              <input
                type="text"
                name="restaurant_phone"
                value={formData.restaurant_phone || ''}
                onChange={handleChange}
                className="w-full bg-white border border-[#E5D7CE] rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#F67009]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Billing Support Email
              </label>
              <input
                type="email"
                name="restaurant_email"
                value={formData.restaurant_email || ''}
                onChange={handleChange}
                className="w-full bg-white border border-[#E5D7CE] rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#F67009]"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Taxation, Currency & Thermal Printer */}
        <div>
          <h3 className="text-xs font-bold text-[#F67009] uppercase tracking-wider mb-4 border-b border-[#F3E5DC] pb-2 flex items-center gap-2">
            <FontAwesomeIcon icon={faPrint} />
            <span>2. Taxation, Currency & Thermal Printer Settings</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                GSTIN / Tax ID
              </label>
              <input
                type="text"
                name="restaurant_gstin"
                value={formData.restaurant_gstin || ''}
                onChange={handleChange}
                placeholder="e.g. 33ABCDE1234F1Z5"
                className="w-full bg-white border border-[#E5D7CE] rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#F67009]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                FSSAI License No.
              </label>
              <input
                type="text"
                name="fssai_license"
                value={formData.fssai_license || ''}
                onChange={handleChange}
                className="w-full bg-white border border-[#E5D7CE] rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#F67009]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Currency Symbol
              </label>
              <input
                type="text"
                name="currency_symbol"
                value={formData.currency_symbol || '₹'}
                onChange={handleChange}
                className="w-full bg-white border border-[#E5D7CE] rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#F67009]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Default GST Tax Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                name="default_tax_rate"
                value={formData.default_tax_rate || '5.00'}
                onChange={handleChange}
                className="w-full bg-white border border-[#E5D7CE] rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#F67009]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Default Thermal Printer Format
              </label>
              <select
                name="thermal_printer_width"
                value={formData.thermal_printer_width || '80mm'}
                onChange={handleChange}
                className="w-full bg-white border border-[#E5D7CE] rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#F67009]"
              >
                <option value="80mm">80mm (Standard POS Thermal Roll)</option>
                <option value="58mm">58mm (Compact Mobile POS Thermal Roll)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Receipt Footer */}
        <div>
          <h3 className="text-xs font-bold text-[#F67009] uppercase tracking-wider mb-4 border-b border-[#F3E5DC] pb-2 flex items-center gap-2">
            <FontAwesomeIcon icon={faReceipt} />
            <span>3. Thermal Receipt Customization</span>
          </h3>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Receipt Footer Courtesy Message
            </label>
            <input
              type="text"
              name="receipt_footer"
              value={formData.receipt_footer || ''}
              onChange={handleChange}
              className="w-full bg-white border border-[#E5D7CE] rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#F67009]"
            />
          </div>
        </div>

        {/* Section 4: Visual Theme & Appearance */}
        <div>
          <h3 className="text-xs font-bold text-[#F67009] uppercase tracking-wider mb-4 border-b border-[#F3E5DC] pb-2 flex items-center gap-2">
            <FontAwesomeIcon icon={faCircleHalfStroke} />
            <span>4. Visual Theme & Display Mode</span>
          </h3>
          <div className="flex items-center justify-between p-4 rounded-2xl bg-[#FFF9F6] border border-[#F3E5DC]">
            <div>
              <p className="text-xs font-bold text-slate-800">Interface Theme</p>
              <p className="text-[11px] text-slate-500">Toggle between Light mode (warm cream) and Dark mode (deep slate)</p>
            </div>
            <ThemeToggle showLabel={true} />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4 border-t border-[#F3E5DC]">
          <button
            type="submit"
            disabled={saving}
            className="bg-gradient-to-r from-[#F67009] to-[#F88D3A] hover:opacity-95 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faFloppyDisk} />
            <span>{saving ? 'Saving Changes...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;
