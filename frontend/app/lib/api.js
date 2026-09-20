const API_URL = process.env.NEXT_PUBLIC_API_URL;

function formatApiDetail(detail) {
  if (!detail) {
    return "";
  }

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        if (item?.msg) {
          const field = Array.isArray(item.loc) ? item.loc[item.loc.length - 1] : "";
          return field ? `${field}: ${item.msg}` : item.msg;
        }

        return "";
      })
      .filter(Boolean)
      .join(" ");
  }

  if (typeof detail === "object" && detail.msg) {
    return detail.msg;
  }

  return "";
}

export function getApiErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  return formatApiDetail(error?.details?.detail) || error?.message || fallback;
}

function getApiUrl() {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  }

  if (!API_URL.startsWith("https://") && !API_URL.includes("localhost")) {
    throw new Error("NEXT_PUBLIC_API_URL must use HTTPS outside local development.");
  }

  return API_URL.replace(/\/$/, "");
}

function emitLoadingEvent(type) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(`elega:loading-${type}`));
  }
}

async function request(path, options = {}) {
  const showLoading = options.showLoading === true;
  if (showLoading) {
    emitLoadingEvent("start");
  }

  const headers = {
    "Content-Type": "application/json",
    ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    ...options.headers
  };

  try {
    const response = await fetch(`${getApiUrl()}${path}`, {
      method: options.method || "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      cache: options.cache || "no-store"
    });

    if (response.status === 204) {
      return null;
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const fallbackMessage =
        response.status === 429
          ? "Too many requests. Please pause for a moment and try again."
          : "Something went wrong. Please try again.";
      const message = formatApiDetail(data?.detail) || fallbackMessage;
      const error = new Error(message);
      error.status = response.status;
      error.details = data;
      throw error;
    }

    return data;
  } finally {
    if (showLoading) {
      emitLoadingEvent("end");
    }
  }
}

export function listProducts(includeInactive = false) {
  return request(`/products${includeInactive ? "?include_inactive=true" : ""}`);
}

export function getBootstrapStatus() {
  return request("/auth/bootstrap-status");
}

export function bootstrapAdmin(payload) {
  return request("/auth/bootstrap-admin", {
    method: "POST",
    body: payload,
    showLoading: true
  });
}

export function loginUser(payload) {
  return request("/auth/login", {
    method: "POST",
    body: payload,
    showLoading: true
  });
}

export function refreshSession(refreshToken) {
  return request("/auth/refresh", {
    method: "POST",
    body: { refresh_token: refreshToken },
    showLoading: false
  });
}

export function registerUser(payload) {
  return request("/auth/register", {
    method: "POST",
    body: payload,
    showLoading: true
  });
}

export function getCart(userId, token) {
  return request(`/cart/${userId}`, { token });
}

export function upsertCartItem(userId, token, payload) {
  return request(`/cart/${userId}/items`, {
    method: "POST",
    token,
    body: payload,
    showLoading: true
  });
}

export function removeCartItem(userId, token, productId) {
  return request(`/cart/${userId}/items/${productId}`, {
    method: "DELETE",
    token,
    showLoading: true
  });
}

export function listOrders(userId, token) {
  return request(`/orders/${userId}`, { token });
}

export function createOrder(token, payload) {
  return request("/orders", {
    method: "POST",
    token,
    body: payload,
    showLoading: true
  });
}

export function createProduct(token, payload) {
  return request("/products", {
    method: "POST",
    token,
    body: payload,
    showLoading: true
  });
}

export function updateProduct(productId, token, payload) {
  return request(`/products/${productId}`, {
    method: "PATCH",
    token,
    body: payload,
    showLoading: true
  });
}

export function deleteProduct(productId, token) {
  return request(`/products/${productId}`, {
    method: "DELETE",
    token,
    showLoading: true
  });
}

export async function uploadProductImage(file, token) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  }
  const cleanApiUrl = API_URL.replace(/\/$/, "");
  const formData = new FormData();
  formData.append("file", file);
  emitLoadingEvent("start");
  try {
    const response = await fetch(`${cleanApiUrl}/products/upload-image`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      const error = new Error(formatApiDetail(data?.detail) || "Failed to upload image.");
      error.status = response.status;
      error.details = data;
      throw error;
    }

    return response.json();
  } finally {
    emitLoadingEvent("end");
  }
}

export function getPaymentQr() {
  return request("/payment-qr");
}

export async function uploadPaymentQr(file, token) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  }

  const formData = new FormData();
  formData.append("file", file);
  emitLoadingEvent("start");
  try {
    const response = await fetch(`${apiUrl.replace(/\/$/, "")}/admin/payment-qr`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData,
      cache: "no-store"
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const error = new Error(formatApiDetail(data?.detail) || "Unable to upload the payment QR code.");
      error.status = response.status;
      error.details = data;
      throw error;
    }

    return data;
  } finally {
    emitLoadingEvent("end");
  }
}

export async function deletePaymentQr(token) {
  return request("/admin/payment-qr", {
    method: "DELETE",
    token,
    showLoading: true
  });
}

export function listUsers(token) {
  return request("/users", { token });
}

export function createUser(token, payload) {
  return request("/users", {
    method: "POST",
    token,
    body: payload,
    showLoading: true
  });
}

export function updateUser(userId, token, payload) {
  return request(`/users/${userId}`, {
    method: "PATCH",
    token,
    body: payload,
    showLoading: true
  });
}

export function updateUserRole(userId, token, role) {
  return request(`/users/${userId}/role`, {
    method: "PATCH",
    token,
    body: { role },
    showLoading: true
  });
}

export async function reverseGeocode(latitude, longitude) {
  const query = new URLSearchParams({
    format: "jsonv2",
    lat: String(latitude),
    lon: String(longitude),
    zoom: "18"
  });
  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${query}`, {
    headers: { Accept: "application/json" },
    cache: "no-store"
  });
  if (!response.ok) {
    throw new Error("We could not look up that location. Please type your address.");
  }
  return response.json();
}

export function getAdminDashboard(token) {
  return request("/admin/dashboard", { token });
}

export function listStaffHistory(token) {
  return request("/admin/history/staff", { token });
}

export function listUserHistory(token) {
  return request("/admin/history/users", { token });
}
