const CRM = (() => {
  async function request(path, options = {}) {
    const config = {
      credentials: "same-origin",
      ...options,
      headers: { ...(options.headers || {}) }
    };

    if (options.body && typeof options.body !== "string") {
      config.headers["Content-Type"] = "application/json";
      config.body = JSON.stringify(options.body);
    }

    const response = await fetch(path, config);
    const contentType = response.headers.get("content-type") || "";
    const data = response.status === 204
      ? null
      : (contentType.includes("application/json") ? await response.json() : await response.text());

    if (!response.ok) {
      const error = new Error(data?.error || "No fue posible completar la solicitud.");
      error.status = response.status;
      error.details = data?.details;
      throw error;
    }

    return data;
  }

  async function currentUser() {
    const result = await request("/api/auth/me");
    return result.user;
  }

  async function requireUser() {
    const user = await currentUser();
    if (!user) {
      const next = encodeURIComponent(location.pathname + location.search);
      location.href = `login.html?next=${next}`;
      throw new Error("Sesión requerida.");
    }
    return user;
  }

  function showMessage(element, message, danger = false) {
    if (!element) return;
    element.hidden = false;
    element.textContent = message;
    element.classList.toggle("danger", danger);
  }

  return { request, currentUser, requireUser, showMessage };
})();

