document.addEventListener("DOMContentLoaded", async () => {
  const form = document.querySelector("#loginForm");
  const message = document.querySelector("#loginMsg");
  const submit = document.querySelector("#loginSubmit");

  try {
    if (await CRM.currentUser()) {
      location.replace("index.html");
      return;
    }

    const setup = await CRM.request("/api/setup/status");
    if (setup.needsSetup) {
      CRM.showMessage(
        message,
        "Primero debes crear la cuenta administradora desde el enlace temporal del servidor.",
        true
      );
    }
  } catch (error) {
    CRM.showMessage(message, error.message, true);
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    submit.disabled = true;

    try {
      await CRM.request("/api/auth/login", {
        method: "POST",
        body: {
          email: document.querySelector("#email").value,
          password: document.querySelector("#password").value
        }
      });

      const next = new URLSearchParams(location.search).get("next");
      location.replace(next && next.startsWith("/crm/") ? next : "index.html");
    } catch (error) {
      CRM.showMessage(message, error.message, true);
      submit.disabled = false;
    }
  });
});

