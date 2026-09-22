const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

async function request(path, options = {}) {
  const token = localStorage.getItem("access_token");
  const headers = {
    "Content-Type": "application/json",
    "Bypass-Tunnel-Reminder": "true",
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });
  if (!res.ok) {
    let errorDetail = "";
    try {
      const errorJson = await res.json();
      errorDetail = errorJson.detail || JSON.stringify(errorJson);
    } catch {
      errorDetail = await res.text();
    }
    const err = new Error(errorDetail || `${options.method || "GET"} ${path} failed: ${res.status}`);
    err.status = res.status;
    err.detail = errorDetail;
    throw err;
  }
  return res.json();
}

export const api = {
  // Auth API
  login: (credentials) =>
    request("/api/auth/login", { method: "POST", body: JSON.stringify(credentials) }),
  register: (payload) =>
    request("/api/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  verifyOtp: (payload) =>
    request("/api/auth/verify-otp", { method: "POST", body: JSON.stringify(payload) }),
  getMe: () => request("/api/auth/me"),

  bootstrap: () => request("/api/data/bootstrap"),
  prioritize: (tasks) =>
    request("/api/system1/prioritize", { method: "POST", body: JSON.stringify({ tasks }) }),
  optimizeWeekly: (tasks, corridors, week_start) =>
    request("/api/system2/optimize-weekly", {
      method: "POST",
      body: JSON.stringify({ tasks, corridors, week_start }),
    }),
  simulateMonthly: (tasks, corridors, month_label) =>
    request("/api/system3/simulate-monthly", {
      method: "POST",
      body: JSON.stringify({ tasks, corridors, month_label }),
    }),
  getBlocks: (status) => request(`/api/blocks${status ? `?status=${status}` : ""}`),
  decideBlock: (payload) =>
    request("/api/blocks/decide", { method: "POST", body: JSON.stringify(payload) }),
};
