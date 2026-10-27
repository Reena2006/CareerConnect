// Central API helper for the CareerConnect frontend (Module 2: JSON request/response payloads)
export const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export async function api(path, { token, body, method = "GET", formData } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  let response;
  try {
    response = await fetch(API + path, {
      method,
      headers,
      body: formData || (body !== undefined ? JSON.stringify(body) : undefined),
    });
  } catch {
    throw new Error("Cannot reach the API. Is the backend running on port 5000?");
  }

  let data = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }
  if (!response.ok) throw new Error(data.message || `Request failed (HTTP ${response.status}).`);
  return data;
}
