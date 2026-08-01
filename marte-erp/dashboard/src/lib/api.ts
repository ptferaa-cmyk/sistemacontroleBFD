const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

function authHeaders(token: string | null): HeadersInit {
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
}

async function request<T>(
  path: string,
  token: string | null,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...authHeaders(token),
      ...(options.headers ?? {}),
    },
  });

  if (res.status === 401) {
    // Token expirado ou inválido — força novo login
    if (typeof window !== 'undefined') {
      localStorage.removeItem('marte_auth_token');
      window.location.href = '/login';
    }
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `Erro ${res.status}`);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string, token: string | null) =>
    request<T>(path, token),

  post: <T>(path: string, token: string | null, body: unknown) =>
    request<T>(path, token, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  patch: <T>(path: string, token: string | null, body: unknown) =>
    request<T>(path, token, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  delete: <T>(path: string, token: string | null) =>
    request<T>(path, token, { method: 'DELETE' }),

  upload: async <T>(path: string, token: string | null, formData: FormData): Promise<T> => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error((body as { error?: string }).error ?? `Erro ${res.status}`);
    }
    return res.json() as Promise<T>;
  },

  imageUrl: (path: string | null) =>
    path ? `${API_BASE}${path}` : null,
};
