/**
 * Client-side API helper untuk komunikasi dengan backend.
 * Otomatis tambah JWT token dan handle error 401 (auto-logout).
 */

const TOKEN_KEY = 'token_majegan';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
}

export interface ApiError {
  error: string;
  status: number;
}

/**
 * Fetch wrapper dengan otomatis Authorization header + error handling.
 */
export async function apiFetch<T = any>(
  url: string,
  opts: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(opts.headers as Record<string, string>),
  };

  // Tidak set Content-Type untuk FormData (biarkan browser set boundary)
  if (!(opts.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...opts, headers });

  // Handle 401: token invalid/expired -> auto-logout
  if (res.status === 401) {
    clearToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
    throw new Error('Sesi Anda telah berakhir. Silakan login kembali.');
  }

  // Parse response
  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await res.json() : await res.text();

  if (!res.ok) {
    const message = (data && typeof data === 'object' && (data as any).error) || 'Permintaan gagal';
    const error: ApiError = { error: message, status: res.status };
    throw error;
  }

  return data as T;
}

/**
 * Upload file via FormData (khusus untuk upload dokumen).
 */
export async function apiUpload(
  url: string,
  formData: FormData
): Promise<any> {
  return apiFetch(url, {
    method: 'POST',
    body: formData,
  });
}
