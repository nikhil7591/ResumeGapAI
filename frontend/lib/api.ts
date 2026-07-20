const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

interface FastApiValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

function extractErrorMessage(body: unknown, fallback: string): string {
  if (!body || typeof body !== "object" || !("detail" in body)) {
    return fallback;
  }
  const detail = (body as { detail: unknown }).detail;

  if (typeof detail === "string") {
    return detail;
  }
  if (Array.isArray(detail)) {
    // FastAPI/Pydantic validation errors: [{ loc, msg, type }, ...]
    return detail
      .map((item) => {
        const err = item as Partial<FastApiValidationError>;
        const field = Array.isArray(err.loc) ? err.loc[err.loc.length - 1] : undefined;
        return field ? `${field}: ${err.msg}` : err.msg;
      })
      .filter(Boolean)
      .join(", ") || fallback;
  }
  return fallback;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = extractErrorMessage(body, detail);
    } catch {
      // response had no JSON body
    }
    throw new ApiError(detail, res.status);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body && !(options.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...(typeof window !== "undefined" && localStorage.getItem("access_token")
        ? { Authorization: `Bearer ${localStorage.getItem("access_token")}` }
        : {}),
      ...options.headers,
    },
  });
  return handleResponse<T>(res);
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    }),
  postForm: <T>(path: string, formData: FormData) =>
    request<T>(path, { method: "POST", body: formData }),
};

export default api;
