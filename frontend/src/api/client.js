/**
 * Satu pintu untuk semua panggilan ke backend.
 * Token JWT ditempel otomatis; kalau token kedaluwarsa, sesi dibersihkan
 * dan halaman dialihkan ke login.
 */
const TOKEN_KEY = 'cardiosync.token';
const USER_KEY = 'cardiosync.user';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

export const userStore = {
  get: () => {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY));
    } catch {
      return null;
    }
  },
  set: (user) => localStorage.setItem(USER_KEY, JSON.stringify(user)),
};

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request(path, { method = 'GET', body, isForm = false, signal } = {}) {
  const headers = {};
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body && !isForm) headers['Content-Type'] = 'application/json';

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    signal,
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && !path.startsWith('/auth/login')) {
    tokenStore.clear();
    if (window.location.pathname !== '/login') window.location.replace('/login?expired=1');
    throw new ApiError(401, 'Sesi habis. Silakan login ulang.');
  }

  const isJson = (res.headers.get('content-type') || '').includes('application/json');
  const payload = isJson ? await res.json() : null;

  if (!res.ok) {
    throw new ApiError(res.status, payload?.error || `Permintaan gagal (${res.status}).`, payload?.details);
  }
  return payload;
}

export const api = {
  // Autentikasi
  login: (staffCode, password, role) => request('/auth/login', { method: 'POST', body: { staffCode, password, role } }),
  me: () => request('/auth/me'),
  logout: () => request('/auth/logout', { method: 'POST' }),
  changePassword: (data) => request('/auth/change-password', { method: 'POST', body: data }),

  // Dashboard
  summary: () => request('/dashboard/summary'),
  trend: (days = 7) => request(`/dashboard/trend?days=${days}`),

  // Pasien
  patients: (q = '', limit = 25, offset = 0) =>
    request(`/patients?q=${encodeURIComponent(q)}&limit=${limit}&offset=${offset}`),
  patient: (id) => request(`/patients/${id}`),
  createPatient: (data) => request('/patients', { method: 'POST', body: data }),
  patientRecords: (id) => request(`/patients/${id}/records`),
  updatePatient: (id, data) => request(`/patients/${id}`, { method: 'PUT', body: data }),

  // ECG
  records: (query = '') => request(`/ecg${query}`),
  record: (id) => request(`/ecg/${id}`),
  uploadEcg: (formData) => request('/ecg/upload', { method: 'POST', body: formData, isForm: true }),
  updateRecord: (id, data) => request(`/ecg/${id}`, { method: 'PATCH', body: data }),
  confirmRecord: (id, data) => request(`/ecg/${id}/confirm`, { method: 'POST', body: data }),
  reviewRecord: (id, data) => request(`/ecg/${id}/review`, { method: 'POST', body: data }),
  verifyDoctor: (id, data) => request(`/ecg/${id}/verify-doctor`, { method: 'POST', body: data }),
  markPrinted: (id) => request(`/ecg/${id}/print-status`, { method: 'PATCH' }),
  deleteRecord: (id) => request(`/ecg/${id}`, { method: 'DELETE' }),
  /**
   * Berkas asli butuh header Authorization, sedangkan <iframe>/<a download>
   * tidak bisa mengirim header. Jadi berkas diambil sebagai blob lalu
   * dibuatkan object URL sementara. Panggil URL.revokeObjectURL saat selesai.
   */
  fileBlobUrl: async (id) => {
    const res = await fetch(`/api/ecg/${id}/file`, {
      headers: { Authorization: `Bearer ${tokenStore.get()}` },
    });
    if (!res.ok) throw new ApiError(res.status, 'Berkas asli tidak bisa dibuka.');
    return URL.createObjectURL(await res.blob());
  },

  /** Ringkasan PDF siap cetak; kembalikan Blob supaya bisa diserahkan ke saveBlob(). */
  reportBlob: async (id) => {
    const res = await fetch(`/api/ecg/${id}/report`, {
      headers: { Authorization: `Bearer ${tokenStore.get()}` },
    });
    if (!res.ok) throw new ApiError(res.status, 'Ringkasan PDF gagal dibuat.');
    return res.blob();
  },

  // Admin
  health: () => request('/admin/health'),
  logs: (limit = 25) => request(`/admin/logs?limit=${limit}`),
  users: () => request('/admin/users'),
  createUser: (data) => request('/admin/users', { method: 'POST', body: data }),
  updateUser: (id, data) => request(`/admin/users/${id}`, { method: 'PATCH', body: data }),
};
