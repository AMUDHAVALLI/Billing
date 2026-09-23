import axios from 'axios';
import { getToken, clearToken } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// The backend and this app are separate origins, so its own cookie never
// reaches the API on its own — it has to go up as a header on every request.
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// An expired or otherwise-rejected token means the session is over
// regardless of which request noticed — clear it and send them back to
// sign in rather than leaving them looking at a page that will never load.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      clearToken();
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

// Auth API
export const authAPI = {
  status: () => api.get('/auth/status'),
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  updatePassword: (data) => api.put('/auth/password', data),
};

// Company API
export const companyAPI = {
  getAll: () => api.get('/companies'),
  getById: (id) => api.get(`/companies/${id}`),
  create: (data) => api.post('/companies', data),
  update: (id, data) => api.put(`/companies/${id}`, data),
  delete: (id) => api.delete(`/companies/${id}`),
};

// Customer API
export const customerAPI = {
  getAll: (params) => api.get('/customers', { params }),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
};

// Product API
export const productAPI = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

// Invoice API
export const invoiceAPI = {
  getAll: (params) => api.get('/invoices', { params }),
  getById: (id) => api.get(`/invoices/${id}`),
  create: (data) => api.post('/invoices', data),
  update: (id, data) => api.put(`/invoices/${id}`, data),
  delete: (id) => api.delete(`/invoices/${id}`),
  downloadPDF: (id) => api.get(`/invoices/${id}/pdf`, { responseType: 'blob' }),
  getDashboardStats: () => api.get('/invoices/dashboard/stats'),
  getMonthlyReport: (year) => api.get('/invoices/reports/monthly', { params: { year } }),
  getYearlyReport: () => api.get('/invoices/reports/yearly'),
  getHsnReport: (month, year) => api.get('/invoices/reports/hsn', { params: { month, year } }),
  getTaxReport: (month, year) => api.get('/invoices/reports/tax', { params: { month, year } }),
};

// Cash Bill API
export const cashBillAPI = {
  getAll: (params) => api.get('/cash-bills', { params }),
  getById: (id) => api.get(`/cash-bills/${id}`),
  create: (data) => api.post('/cash-bills', data),
  update: (id, data) => api.put(`/cash-bills/${id}`, data),
  delete: (id) => api.delete(`/cash-bills/${id}`),
  downloadPDF: (id) => api.get(`/cash-bills/${id}/pdf`, { responseType: 'blob' }),
};

export default api;

