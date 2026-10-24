// Universal TypeScript HTTP Client for Restaurant Billing System
// Strongly-typed communications with Java Spring Boot backend via PostgreSQL functions

import {
  ApiResponse,
  User,
  LoginResponse,
  Category,
  MenuItem,
  RestaurantTable,
  Bill,
  BillCreatePayload,
  BillSettlePayload,
  DashboardMetrics,
  SalesReport,
  ActivityLog,
  RestaurantSettings,
} from '../types';

const API_BASE_URL = '/api';

export async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const result: ApiResponse<T> | null = await response.json().catch(() => null);

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('auth-expired'));
      }

      const errorMsg =
        result?.errorMessage?.map((e) => e.errorText).join(', ') ||
        result?.resultMessage ||
        `Server error (${response.status})`;
      throw new Error(errorMsg);
    }

    if (result && result.isSuccessful === false) {
      const errorMsg =
        result.errorMessage?.map((e) => e.errorText).join(', ') ||
        result.resultMessage ||
        'Operation was not successful';
      throw new Error(errorMsg);
    }

    // Unwrap standard ApiResponse payload
    const data: any = result?.data;
    if (data && typeof data === 'object' && 'result' in data) {
      return data.result as T;
    }
    return (data !== undefined ? data : result) as T;
  } catch (error: any) {
    console.error(`API Error on ${endpoint}:`, error);
    throw error;
  }
}

// Authentication API
export const authApi = {
  login: (credentials: { username: string; password: string }): Promise<LoginResponse> =>
    apiRequest<LoginResponse>('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  logout: (): Promise<any> =>
    apiRequest('/auth/logout', { method: 'POST' }),
};

// Users API (Mirrors C# UserController)
export const userApi = {
  add: (userData: any): Promise<User> =>
    apiRequest<User>('/User/add', { method: 'POST', body: JSON.stringify(userData) }),
  fetchAll: (query: { pageNumber?: number; pageSize?: number; search?: string } = {}): Promise<User[]> =>
    apiRequest<User[]>('/User/fetchAll', { method: 'POST', body: JSON.stringify(query) }),
  update: (userId: string, userData: Partial<User>): Promise<User> =>
    apiRequest<User>(`/User/${userId}`, { method: 'PUT', body: JSON.stringify(userData) }),
  changePassword: (userId: string, passwords: { currentPassword: string; newPassword: string }): Promise<any> =>
    apiRequest(`/User/${userId}/change-password`, { method: 'POST', body: JSON.stringify(passwords) }),
};

// Categories API
export const categoryApi = {
  getAll: (includeInactive: boolean = false): Promise<Category[]> =>
    apiRequest<Category[]>(`/categories?includeInactive=${includeInactive}`),
  create: (data: Partial<Category>): Promise<Category> =>
    apiRequest<Category>('/categories', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Category>): Promise<Category> =>
    apiRequest<Category>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

// Menu Items API
export const menuApi = {
  getAll: (params: Record<string, string | number | boolean> = {}): Promise<MenuItem[]> => {
    const searchParams = new URLSearchParams(params as Record<string, string>).toString();
    return apiRequest<MenuItem[]>(`/menu-items?${searchParams}`);
  },
  create: (data: Partial<MenuItem>): Promise<MenuItem> =>
    apiRequest<MenuItem>('/menu-items', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<MenuItem>): Promise<MenuItem> =>
    apiRequest<MenuItem>(`/menu-items/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

// Tables API
export const tableApi = {
  getAll: (): Promise<RestaurantTable[]> =>
    apiRequest<RestaurantTable[]>('/tables'),
  create: (data: Partial<RestaurantTable>): Promise<RestaurantTable> =>
    apiRequest<RestaurantTable>('/tables', { method: 'POST', body: JSON.stringify(data) }),
  updateStatus: (id: string, status: string, billId: string | null = null): Promise<RestaurantTable> =>
    apiRequest<RestaurantTable>(`/tables/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, billId }) }),
};

// Bills API
export const billApi = {
  create: (data: BillCreatePayload): Promise<Bill> =>
    apiRequest<Bill>('/bills', { method: 'POST', body: JSON.stringify(data) }),
  getDetails: (id: string): Promise<Bill> =>
    apiRequest<Bill>(`/bills/${id}`),
  settle: (id: string, data: BillSettlePayload): Promise<any> =>
    apiRequest(`/bills/${id}/settle`, { method: 'POST', body: JSON.stringify(data) }),
  cancel: (id: string, reason: string): Promise<any> =>
    apiRequest(`/bills/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),
  getList: (params: Record<string, string | number | boolean | undefined> = {}): Promise<Bill[]> => {
    const cleanedParams: Record<string, string> = {};
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') {
        cleanedParams[k] = String(v);
      }
    }
    const searchParams = new URLSearchParams(cleanedParams).toString();
    return apiRequest<Bill[]>(`/bills?${searchParams}`);
  },
};

// Dashboard & Reports API
export const reportApi = {
  getDashboardMetrics: (date: string = ''): Promise<DashboardMetrics> =>
    apiRequest<DashboardMetrics>(`/dashboard/metrics${date ? `?date=${date}` : ''}`),
  getSalesReport: (params: Record<string, string> = {}): Promise<SalesReport> => {
    const searchParams = new URLSearchParams(params).toString();
    return apiRequest<SalesReport>(`/reports/sales?${searchParams}`);
  },
};

// Unified Activity History Audit API
export const activityApi = {
  getHistory: (params: Record<string, string | number | undefined> = {}): Promise<ActivityLog[]> => {
    const cleanedParams: Record<string, string> = {};
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') {
        cleanedParams[k] = String(v);
      }
    }
    const searchParams = new URLSearchParams(cleanedParams).toString();
    return apiRequest<ActivityLog[]>(`/activity?${searchParams}`);
  },
};

// Settings API
export const settingsApi = {
  get: (): Promise<RestaurantSettings> =>
    apiRequest<RestaurantSettings>('/settings'),
  update: (settings: Partial<RestaurantSettings>): Promise<any> =>
    apiRequest('/settings', { method: 'PUT', body: JSON.stringify(settings) }),
};
