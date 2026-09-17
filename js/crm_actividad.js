document.addEventListener("DOMContentLoaded", async () => {
  const message = document.querySelector("#activityMsg");
  const rows = document.querySelector("#activityRows");
  const from = document.querySelector("#activityFrom");
  const until = document.querySelector("#activityUntil");
  const type = document.querySelector("#activityType");

  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  from.value = CRM.localDateTimeInput(monthStart).slice(0, 10);
  until.value = CRM.localDateTimeInput(today).slice(0, 10);

  function render(items) {
    document.querySelector("#activityCount").textContent = `${items.length} ${items.length === 1 ? "actividad" : "actividades"}`;
    rows.innerHTML = items.length
      ? items.map(item => `
        <tr>
          <td class="small">${UI.escape(CRM.formatDateTime(item.fecha))}</td>
          <td><b>${UI.escape(item.cliente_nombre)}</b></td>
          <td>${UI.escape(CRM.interactionLabel(item.tipo))}</td>
          <td>${UI.escape(item.descripcion)}</td>
          <td class="right"><a class="btn" href="cliente.html?id=${item.cliente_id}">Ver cliente</a></td>
        </tr>`).join("")
      : '<tr><td colspan="5" class="small">No registraste actividad en este periodo.</td></tr>';
  }

  async function load() {
    const params = new URLSearchParams({ mias: "1", desde: from.value, hasta: until.value, limit: "100" });
    if (type.value) params.set("tipo", type.value);
    try {
      const result = await CRM.request(`/interacciones?${params}`);
      render(result.items);
      message.hidden = true;
    } catch (error) {
      CRM.showMessage(message, error.message, true);
    }
  }

  try {
    const user = await CRM.requireUser();
    document.querySelector("#activityUser").textContent = user.name;
    await load();
  } catch (error) {
    if (error.message !== "Sesión requerida.") CRM.showMessage(message, error.message, true);
    return;
  }

  [from, until, type].forEach(element => element.addEventListener("change", load));
});
