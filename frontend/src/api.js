const API_URL = "http://localhost:5000/api";

async function request(endpoint, options = {}) {
  let response;

  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  } catch {
    const error = new Error(
      "Cannot connect to the backend. Check that your server is running on port 5000."
    );
    throw error;
  }

  const text = await response.text();

  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!response.ok) {
    const error = new Error(
      data.message || `Request failed with status ${response.status}`
    );

    error.response = {
      status: response.status,
      data,
    };

    throw error;
  }

  // Match the { data } response format expected by JobPost.jsx
  return { data };
}

export const api = {
  get(endpoint) {
    return request(endpoint);
  },

  post(endpoint, body) {
    return request(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  put(endpoint, body) {
    return request(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  delete(endpoint) {
    return request(endpoint, {
      method: "DELETE",
    });
  },
};