
const API_BASE_URL = "http://127.0.0.1:3000/api";

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface ApiResponse {
  success: boolean;
  message?: string;
  user?: ApiUser;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  } catch {
    throw new Error(
      "ارتباط با سرور برقرار نشد. مطمئن شوید بک‌اند در حال اجراست."
    );
  }

  const data = (await response.json()) as ApiResponse;

  if (!response.ok || !data.success) {
    throw new Error(
      data.message || "درخواست ناموفق بود. دوباره تلاش کنید."
    );
  }

  return data as T;
}

export const api = {
  register(data: {
    name: string;
    email: string;
    password: string;
  }) {
    return request<ApiResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  login(data: {
    email: string;
    password: string;
  }) {
    return request<ApiResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  logout() {
    return request<ApiResponse>("/auth/logout", {
      method: "POST",
    });
  },

  me() {
    return request<ApiResponse>("/auth/me", {
      method: "GET",
    });
  },
};
