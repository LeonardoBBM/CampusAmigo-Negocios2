document.addEventListener("DOMContentLoaded", async () => {
  const form = document.querySelector("#setupForm");
  const message = document.querySelector("#setupMsg");
  const submit = document.querySelector("#setupSubmit");
  const params = new URLSearchParams(location.search);
  const setupToken = params.get("token") || "";
  history.replaceState({}, "", location.pathname);

  try {
    const status = await CRM.request("/api/setup/status");
    if (!status.needsSetup) {
      location.replace("login.html");
      return;
    }
  } catch (error) {
    CRM.showMessage(message, error.message, true);
    return;
  }

  if (!setupToken) {
    CRM.showMessage(
      message,
      "Falta el token temporal mostrado al iniciar el servidor.",
      true
    );
    submit.disabled = true;
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    const password = document.querySelector("#password").value;
    const confirmation = document.querySelector("#passwordConfirm").value;

    if (password !== confirmation) {
      CRM.showMessage(message, "Las contraseñas no coinciden.", true);
      return;
    }

    submit.disabled = true;
    try {
      await CRM.request("/api/setup/admin", {
        method: "POST",
        headers: { "X-Setup-Token": setupToken },
        body: {
          name: document.querySelector("#name").value,
          email: document.querySelector("#email").value,
          password
        }
      });
      location.replace("clientes.html");
    } catch (error) {
      CRM.showMessage(message, error.message, true);
      submit.disabled = false;
    }
  });
});

