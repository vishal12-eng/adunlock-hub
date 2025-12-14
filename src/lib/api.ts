const BASE_URL = "";

async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    credentials: "include",
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || "Request failed");
  }

  return res.json();
}

export const api = {
  getContents: () => fetchApi<Content[]>("/api/contents"),
  getContent: (id: string) => fetchApi<Content>(`/api/contents/${id}`),
  incrementViews: (id: string) => fetchApi<void>(`/api/contents/${id}/view`, { method: "POST" }),
  incrementUnlocks: (id: string) => fetchApi<void>(`/api/contents/${id}/unlock`, { method: "POST" }),

  getSession: (sessionId: string, contentId: string) =>
    fetchApi<UserSession | null>(`/api/sessions/${sessionId}/${contentId}`),
  createSession: (data: CreateSessionData) =>
    fetchApi<UserSession>("/api/sessions", { method: "POST", body: JSON.stringify(data) }),
  updateSession: (id: string, data: UpdateSessionData) =>
    fetchApi<UserSession>(`/api/sessions/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  getSettings: () => fetchApi<Record<string, string>>("/api/settings"),
  getSetting: (key: string) => fetchApi<{ value: string }>(`/api/settings/${key}`),

  startAd: (data: AdStartData) =>
    fetchApi<AdStartResponse>("/api/ad/start", { method: "POST", body: JSON.stringify(data) }),
  completeAd: (token: string) =>
    fetchApi<AdCompleteResponse>("/api/ad/complete", { method: "POST", body: JSON.stringify({ token }) }),

  login: (email: string, password: string) =>
    fetchApi<AdminUser>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  logout: () => fetchApi<void>("/api/auth/logout", { method: "POST" }),
  getMe: () => fetchApi<{ loggedIn: boolean; user: AdminUser }>("/api/auth/me"),

  admin: {
    getContents: () => fetchApi<Content[]>("/api/admin/contents"),
    createContent: (data: ContentFormData) =>
      fetchApi<Content>("/api/admin/contents", { method: "POST", body: JSON.stringify(data) }),
    updateContent: (id: string, data: ContentFormData) =>
      fetchApi<Content>(`/api/admin/contents/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    deleteContent: (id: string) =>
      fetchApi<void>(`/api/admin/contents/${id}`, { method: "DELETE" }),
    getSettings: () => fetchApi<Record<string, string>>("/api/admin/settings"),
    updateSettings: (settings: Record<string, string>) =>
      fetchApi<void>("/api/admin/settings/bulk", { method: "POST", body: JSON.stringify(settings) }),
  },
};

export interface Content {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  file_url: string | null;
  redirect_url: string | null;
  required_ads: number;
  status: string;
  views: number;
  unlocks: number;
  created_at: string;
  updated_at: string;
}

export interface UserSession {
  id: string;
  session_id: string;
  content_id: string;
  ads_required: number;
  ads_watched: number;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
}

export interface CreateSessionData {
  session_id: string;
  content_id: string;
  ads_required: number;
  ads_watched?: number;
  completed?: boolean;
}

export interface UpdateSessionData {
  ads_watched?: number;
  completed?: boolean;
}

export interface ContentFormData {
  title: string;
  description?: string | null;
  thumbnail_url?: string | null;
  file_url?: string | null;
  redirect_url?: string | null;
  required_ads?: number;
  status?: string;
}

export interface AdStartData {
  session_id: string;
  content_id: string;
  user_session_id: string;
}

export interface AdStartResponse {
  token: string;
  started_at: string;
  min_time_seconds: number;
}

export interface AdCompleteResponse {
  success: boolean;
  session: UserSession;
  completed: boolean;
}
