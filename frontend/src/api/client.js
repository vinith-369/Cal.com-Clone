/**
 * API client — centralizes all HTTP communication with the FastAPI backend.
 */

const BASE_URL = "http://localhost:8000/api";

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const config = {
    headers: { "Content-Type": "application/json" },
    ...options,
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  // Handle 204 No Content
  if (response.status === 204) return null;

  return response.json();
}

// ── Event Types ────────────────────────────────────────────────────

export const eventTypesApi = {
  list: () => request("/event-types"),
  getById: (id) => request(`/event-types/${id}`),
  getBySlug: (slug) => request(`/event-types/slug/${slug}/public`),
  create: (data) => request("/event-types", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) => request(`/event-types/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id) => request(`/event-types/${id}`, { method: "DELETE" }),
};

// ── Availability ───────────────────────────────────────────────────

export const availabilityApi = {
  list: () => request("/availability"),
  getById: (id) => request(`/availability/${id}`),
  create: (data) => request("/availability", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) => request(`/availability/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id) => request(`/availability/${id}`, { method: "DELETE" }),
  addOverride: (scheduleId, data) =>
    request(`/availability/${scheduleId}/overrides`, { method: "POST", body: JSON.stringify(data) }),
  removeOverride: (scheduleId, overrideId) =>
    request(`/availability/${scheduleId}/overrides/${overrideId}`, { method: "DELETE" }),
};

// ── Bookings ───────────────────────────────────────────────────────

export const bookingsApi = {
  list: (tab = "upcoming") => request(`/bookings?tab=${tab}`),
  getById: (id) => request(`/bookings/${id}`),
  create: (data) => request("/bookings", { method: "POST", body: JSON.stringify(data) }),
  cancel: (id) => request(`/bookings/${id}/cancel`, { method: "PATCH" }),
  reschedule: (id, data) =>
    request(`/bookings/${id}/reschedule`, { method: "PATCH", body: JSON.stringify(data) }),
  getSlots: (slug, date, excludeBooking) => {
    let url = `/bookings/slots/${slug}?date=${date}`;
    if (excludeBooking) url += `&exclude_booking=${excludeBooking}`;
    return request(url);
  },
};
