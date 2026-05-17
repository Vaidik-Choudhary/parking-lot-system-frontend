// =====================================================
//  API Configuration
//  All requests go through the API Gateway
//  Change GATEWAY_URL to match your gateway port
// =====================================================

export const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL || '';

// ── Token helpers ─────────────────────────────────────
export const getToken    = () => localStorage.getItem('accessToken');
export const getRole     = () => localStorage.getItem('role');
export const getEmail    = () => localStorage.getItem('email');
export const getUserName = () => localStorage.getItem('fullName');

export const saveAuth = (data) => {
  localStorage.setItem('accessToken',  data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  localStorage.setItem('role',         data.role);
  localStorage.setItem('email',        data.email);
  localStorage.setItem('fullName',     data.fullName);
  localStorage.setItem('userId',       data.userId);
};

export const clearAuth = () => {
  ['accessToken','refreshToken','role','email','fullName','userId']
    .forEach(k => localStorage.removeItem(k));
};

export const isLoggedIn = () => !!getToken();

// ── Core fetch wrapper ────────────────────────────────
// Automatically adds Authorization header + handles JSON
export const apiFetch = async (path, options = {}) => {
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${GATEWAY_URL}${path}`, {
    ...options,
    headers,
  });

  // For file downloads (receipts) return the raw response
  if (options.raw) return response;

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    const message = data.message || `Request failed: ${response.status}`;
    throw new Error(message);
  }

  return data;
};

// ── Convenience methods ───────────────────────────────
export const api = {
  get:    (path)         => apiFetch(path),
  post:   (path, body)   => apiFetch(path, { method: 'POST',   body: JSON.stringify(body) }),
  put:    (path, body)   => apiFetch(path, { method: 'PUT',    body: JSON.stringify(body) }),
  patch:  (path, body)   => apiFetch(path, { method: 'PATCH',  body: JSON.stringify(body) }),
  delete: (path)         => apiFetch(path, { method: 'DELETE' }),
  // For file downloads
  download: (path) => apiFetch(path, { raw: true }),
};
