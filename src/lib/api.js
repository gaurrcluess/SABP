/**
 * RailSync API layer
 * ───────────────────
 * Every fetch() call in the app goes through this file — pages never call
 * fetch() directly. This is deliberate: it's the one place that needs to
 * change if the backend URL, auth scheme, or response shape ever changes.
 *
 * The frontend does not calculate priorities, schedules, or block times.
 * It only sends requests and renders whatever the backend/AI engine returns.
 */

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

/**
 * ApiError carries the HTTP status and the backend's own message (if any)
 * so pages can show it verbatim instead of a generic "something went wrong".
 */
export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

const DEFAULT_ERROR_MESSAGES = {
  400: "Invalid input. Please check the form and try again.",
  401: "You need to sign in to do that.",
  403: "You don't have permission to do that.",
  404: "That data could not be found.",
  409: "This conflicts with an existing schedule.",
  500: "The server ran into a problem. Please try again.",
};

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
    });
  } catch (networkError) {
    throw new ApiError(
      "Unable to reach the RailSync backend. Check that the API server is running and reachable.",
      0,
      networkError
    );
  }

  if (!response.ok) {
    let body = null;
    try {
      body = await response.json();
    } catch {
      /* backend didn't return JSON — fall back to the default message */
    }
    const message =
      body?.message ||
      body?.detail ||
      DEFAULT_ERROR_MESSAGES[response.status] ||
      `Request failed with status ${response.status}.`;
    throw new ApiError(message, response.status, body);
  }

  if (response.status === 204) return null;
  return response.json();
}

/* ---------------------------------------------------------------------- */
/* Dashboard                                                               */
/* ---------------------------------------------------------------------- */

// GET /api/dashboard/metrics?division=&horizon=
export async function getDashboardMetrics(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return request(`/dashboard/metrics${qs ? `?${qs}` : ""}`);
}

/* ---------------------------------------------------------------------- */
/* Maintenance requests                                                    */
/* ---------------------------------------------------------------------- */

// GET /api/maintenance-requests?department=&status=&priority=&date=
export async function getMaintenanceRequests(filters = {}) {
  const cleaned = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v && v !== "all")
  );
  const qs = new URLSearchParams(cleaned).toString();
  return request(`/maintenance-requests${qs ? `?${qs}` : ""}`);
}

// GET /api/maintenance-requests/{taskId}
export async function getMaintenanceTask(taskId) {
  return request(`/maintenance-requests/${encodeURIComponent(taskId)}`);
}

// POST /api/maintenance-requests
export async function createMaintenanceRequest(data) {
  return request("/maintenance-requests", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/* ---------------------------------------------------------------------- */
/* Optimization / Block Planner                                            */
/* ---------------------------------------------------------------------- */

// POST /api/optimization/generate
export async function generateOptimization(data) {
  return request("/optimization/generate", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// GET /api/plans/{planId}
export async function getPlan(planId) {
  return request(`/plans/${encodeURIComponent(planId)}`);
}

// GET /api/blocks
export async function getBlocks(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return request(`/blocks${qs ? `?${qs}` : ""}`);
}

// GET /api/blocks/{blockId}
export async function getBlockDetails(blockId) {
  return request(`/blocks/${encodeURIComponent(blockId)}`);
}

/* ---------------------------------------------------------------------- */
/* Weekly / Monthly plans                                                  */
/* ---------------------------------------------------------------------- */

// GET /api/plans/weekly?start_date=&corridor_id=
export async function getWeeklyPlan(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return request(`/plans/weekly${qs ? `?${qs}` : ""}`);
}

// GET /api/plans/monthly?month=&year=
export async function getMonthlyPlan(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return request(`/plans/monthly${qs ? `?${qs}` : ""}`);
}

/* ---------------------------------------------------------------------- */
/* Railway map                                                             */
/* ---------------------------------------------------------------------- */

// GET /api/map/corridors
export async function getMapData(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return request(`/map/corridors${qs ? `?${qs}` : ""}`);
}
