import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { settingsApi } from '../api/client';
import { RestaurantSettings, ThermalPaperWidth } from '../types';

interface SettingsContextType {
  settings: RestaurantSettings;
  updateSettings: (newSettings: Partial<RestaurantSettings>) => Promise<void>;
  refreshSettings: () => Promise<void>;
  loading: boolean;
}

const defaultSettings: RestaurantSettings = {
  restaurant_name: 'The Grand Pavilion Restaurant',
  restaurant_tagline: 'Exquisite Dining Experience',
  restaurant_address: '124, High Street, Gandhi Nagar, Chennai - 600020',
  restaurant_phone: '+91 98765 43210',
  restaurant_email: 'billing@grandpavilion.com',
  restaurant_gstin: '33ABCDE1234F1Z5',
  currency_symbol: '₹',
  currency_code: 'INR',
  default_tax_rate: '5.00',
  receipt_footer: 'Thank you for dining with us! Please visit again.',
  receipt_paper_width: '80mm',
};

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<RestaurantSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const data = await settingsApi.get();
      if (data && typeof data === 'object') {
        setSettings((prev) => ({ ...prev, ...data }));
      }
    } catch (e) {
      console.warn('Could not fetch settings, using local defaults:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateSettings = async (newSettings: Partial<RestaurantSettings>) => {
    await settingsApi.update(newSettings);
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, refreshSettings: fetchSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextType {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within SettingsProvider');
  return context;
}
