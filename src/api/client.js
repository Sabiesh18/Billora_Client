// Universal HTTP Client for Restaurant Billing System
// Communicates with Java Spring Boot backend via PostgreSQL functions

const API_BASE_URL = '/api';

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const config = {
    ...options,
    headers
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const result = await response.json().catch(() => null);

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('auth-expired'));
      }
      
      const errorMsg = result?.errorMessage?.map(e => e.errorText).join(', ') 
        || result?.resultMessage 
        || `Server error (${response.status})`;
      throw new Error(errorMsg);
    }

    if (result && result.isSuccessful === false) {
      const errorMsg = result.errorMessage?.map(e => e.errorText).join(', ') 
        || result.resultMessage 
        || 'Operation was not successful';
      throw new Error(errorMsg);
    }

    // Unwrap standard ApiResponse payload
    return result?.data?.result !== undefined ? result.data.result : (result?.data || result);
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error);
    throw error;
  }
}

// Authentication API
export const authApi = {
  login: (credentials) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  logout: () => apiRequest('/auth/logout', { method: 'POST' }),
};

// Users API (Mirrors C# UserController)
export const userApi = {
  add: (userData) => apiRequest('/User/add', { method: 'POST', body: JSON.stringify(userData) }),
  fetchAll: (query = {}) => apiRequest('/User/fetchAll', { method: 'POST', body: JSON.stringify(query) }),
  update: (userId, userData) => apiRequest(`/User/${userId}`, { method: 'PUT', body: JSON.stringify(userData) }),
  changePassword: (userId, passwords) => apiRequest(`/User/${userId}/change-password`, { method: 'POST', body: JSON.stringify(passwords) }),
};

// Categories API
export const categoryApi = {
  getAll: (includeInactive = false) => apiRequest(`/categories?includeInactive=${includeInactive}`),
  create: (data) => apiRequest('/categories', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

// Menu Items API
export const menuApi = {
  getAll: (params = {}) => {
    const searchParams = new URLSearchParams(params).toString();
    return apiRequest(`/menu-items?${searchParams}`);
  },
  create: (data) => apiRequest('/menu-items', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/menu-items/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

// Tables API
export const tableApi = {
  getAll: () => apiRequest('/tables'),
  create: (data) => apiRequest('/tables', { method: 'POST', body: JSON.stringify(data) }),
  updateStatus: (id, status, billId = null) => apiRequest(`/tables/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, billId }) }),
};

// Bills API
export const billApi = {
  create: (data) => apiRequest('/bills', { method: 'POST', body: JSON.stringify(data) }),
  getDetails: (id) => apiRequest(`/bills/${id}`),
  settle: (id, data) => apiRequest(`/bills/${id}/settle`, { method: 'POST', body: JSON.stringify(data) }),
  cancel: (id, reason) => apiRequest(`/bills/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),
  getList: (params = {}) => {
    const searchParams = new URLSearchParams(params).toString();
    return apiRequest(`/bills?${searchParams}`);
  },
};

// Dashboard & Reports API
export const reportApi = {
  getDashboardMetrics: (date = '') => apiRequest(`/dashboard/metrics${date ? `?date=${date}` : ''}`),
  getSalesReport: (params = {}) => {
    const searchParams = new URLSearchParams(params).toString();
    return apiRequest(`/reports/sales?${searchParams}`);
  },
};

// Unified Activity History Audit API
export const activityApi = {
  getHistory: (params = {}) => {
    const searchParams = new URLSearchParams(params).toString();
    return apiRequest(`/activity?${searchParams}`);
  },
};

// Settings API
export const settingsApi = {
  get: () => apiRequest('/settings'),
  update: (settings) => apiRequest('/settings', { method: 'PUT', body: JSON.stringify(settings) }),
};
