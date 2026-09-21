const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 
      "Content-Type": "application/json",
      "Bypass-Tunnel-Reminder": "true" 
    },
    ...options,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${options.method || "GET"} ${path} failed: ${res.status} ${body}`);
  }
  return res.json();
}

export const api = {
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
