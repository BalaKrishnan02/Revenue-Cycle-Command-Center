import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Dashboard & Analytics
export const getDashboardMetrics = () => api.get('/dashboard/metrics');
export const getDenialAnalytics = () => api.get('/analytics/denials');
export const getPayerAnalytics = () => api.get('/analytics/payers');
export const getRevenueAnalytics = () => api.get('/analytics/revenue');

// Smart Billing Priority Queue
export const getBillingPriorityQueue = () => api.get('/billing-priority');

// Claims CRUD & Lifecycle
export const getClaims = () => api.get('/claims');
export const getClaim = (id) => api.get(`/claims/${id}`);
export const getClaimHistory = (id) => api.get(`/claims/${id}/history`);
export const createClaim = (claimData) => api.post('/claims', claimData);
export const updateClaim = (id, claimData) => api.put(`/claims/${id}`, claimData);
export const deleteClaim = (id) => api.delete(`/claims/${id}`);

// Claim Actions & Payments
export const predictClaimRisk = (id) => api.post(`/claims/${id}/predict`);
export const submitClaim = (id) => api.post(`/claims/${id}/submit`);
export const correctClaim = (id, claimData) => api.post(`/claims/${id}/correct`, claimData);
export const resubmitClaim = (id) => api.post(`/claims/${id}/resubmit`);
export const acceptClaim = (id) => api.post(`/claims/${id}/accept`);
export const denyClaim = (id, reason) => api.post(`/claims/${id}/deny`, { reason });
export const setPendingClaim = (id) => api.post(`/claims/${id}/pending`);
export const payClaim = (id, paymentData = {}) => api.post(`/claims/${id}/pay`, paymentData);
export const recordPartialPayment = (id, paymentData = {}) => api.post(`/claims/${id}/partial-payment`, paymentData);
export const recordFollowUp = (id, notes = '') => api.post(`/claims/${id}/follow-up`, { notes });

// Alerts
export const getAlerts = () => api.get('/alerts');
export const getActiveAlerts = () => api.get('/alerts/active');
export const resolveAlert = (id) => api.put(`/alerts/${id}/resolve`);
export const resolveAllAlerts = () => api.put('/alerts/resolve-all');

// Payments Ledger
export const getPayments = () => api.get('/payments');

export default api;
