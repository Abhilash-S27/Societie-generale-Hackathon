import axios from 'axios';

// In dev, Vite proxies /api -> http://localhost:4000 (see vite.config.js).
// Override with VITE_API_BASE if you run the backend elsewhere.
const baseURL = import.meta.env.VITE_API_BASE || '/api';

const client = axios.create({ baseURL, timeout: 15000 });

export const api = {
  health: () => client.get('/health').then((r) => r.data),

  getDashboard: () => client.get('/dashboard').then((r) => r.data),

  getExceptions: (params = {}) => client.get('/exceptions', { params }).then((r) => r.data),
  getException: (id) => client.get(`/exceptions/${id}`).then((r) => r.data),
  createException: (payload) => client.post('/exceptions', payload).then((r) => r.data),
  updateStatus: (id, body) => client.patch(`/exceptions/${id}/status`, body).then((r) => r.data),
  reviewException: (id, body) => client.post(`/exceptions/${id}/review`, body).then((r) => r.data),
  approveException: (id, body) => client.post(`/exceptions/${id}/approve`, body).then((r) => r.data),
  rejectException: (id, body) => client.post(`/exceptions/${id}/reject`, body).then((r) => r.data),
  renewException: (id, body) => client.post(`/exceptions/${id}/renew`, body).then((r) => r.data),
  revokeException: (id, body) => client.post(`/exceptions/${id}/revoke`, body).then((r) => r.data),

  getAlerts: (params = {}) => client.get('/alerts', { params }).then((r) => r.data),
  getAuditReport: () => client.get('/audit-report').then((r) => r.data),
  getLookups: () => client.get('/lookups').then((r) => r.data),

  // Conflict / overlap detection
  getConflicts: (params = {}) => client.get('/conflicts', { params }).then((r) => r.data),
  getExceptionConflicts: (id) => client.get(`/exceptions/${id}/conflicts`).then((r) => r.data),

  // CSV import / export
  bulkImport: (rows) => client.post('/exceptions/bulk-import', { rows }).then((r) => r.data),
  downloadCsv: async (kind) => {
    // kind: 'export-csv' | 'csv-template'
    const res = await client.get(`/exceptions/${kind}`, { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = kind === 'csv-template' ? 'riskwaiver360-template.csv' : 'riskwaiver360-exceptions.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};

export default api;
