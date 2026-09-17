document.addEventListener("DOMContentLoaded", async () => {
  const message = document.querySelector("#settingsMsg");
  const content = document.querySelector("#settingsContent");
  const input = document.querySelector("#riskDays");
  try {
    const user = await CRM.requireUser();
    if (user.role !== "admin") {
      content.hidden = true;
      CRM.showMessage(message, "Esta vista está restringida a administradores.", true);
      return;
    }
    const result = await CRM.request("/configuracion");
    input.value = result.settings.dias_riesgo;
  } catch (error) {
    if (error.message !== "Sesión requerida.") CRM.showMessage(message, error.message, true);
    return;
  }

  document.querySelector("#settingsForm").addEventListener("submit", async event => {
    event.preventDefault();
    const button = document.querySelector("#saveSettings");
    button.disabled = true;
    try {
      const result = await CRM.request("/configuracion", {
        method: "PUT",
        body: { dias_riesgo: Number(input.value) }
      });
      input.value = result.settings.dias_riesgo;
      message.hidden = true;
      UI.toast("Configuración guardada");
    } catch (error) {
      CRM.showMessage(message, error.message, true);
    } finally {
      button.disabled = false;
    }
  });
});
