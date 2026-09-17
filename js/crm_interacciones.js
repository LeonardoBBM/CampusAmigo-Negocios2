document.addEventListener("DOMContentLoaded", async () => {
  const message = document.querySelector("#interactionMsg");
  const rows = document.querySelector("#interactionRows");
  const count = document.querySelector("#interactionCount");
  const search = document.querySelector("#interactionSearch");
  const type = document.querySelector("#interactionTypeFilter");
  const responsible = document.querySelector("#responsibleFilter");
  let debounce;

  function render(items, total) {
    count.textContent = `${total} ${total === 1 ? "interacción" : "interacciones"}`;
    rows.innerHTML = items.length
      ? items.map(item => `
        <tr>
          <td class="small">${UI.escape(CRM.formatDateTime(item.fecha))}</td>
          <td><b>${UI.escape(item.cliente_nombre)}</b></td>
          <td><span class="crm-type-dot type-${item.tipo}" style="width:32px;height:32px">${UI.escape(CRM.interactionLabel(item.tipo).slice(0, 1))}</span><span class="sr-only">${UI.escape(CRM.interactionLabel(item.tipo))}</span></td>
          <td>${UI.escape(item.descripcion)}</td>
          <td>${UI.escape(item.responsable_nombre)}</td>
          <td class="right"><a class="btn" href="cliente.html?id=${item.cliente_id}">Ver cliente</a></td>
        </tr>`).join("")
      : '<tr><td colspan="6" class="small">No hay interacciones con estos filtros.</td></tr>';
  }

  async function load() {
    const params = new URLSearchParams({ limit: "100" });
    if (search.value.trim()) params.set("q", search.value.trim());
    if (type.value) params.set("tipo", type.value);
    if (!responsible.hidden && responsible.value) params.set("usuario_id", responsible.value);
    try {
      const result = await CRM.request(`/interacciones?${params}`);
      render(result.items, result.pagination.total);
      message.hidden = true;
    } catch (error) {
      CRM.showMessage(message, error.message, true);
    }
  }

  try {
    const user = await CRM.requireUser();
    if (user.role === "admin") {
      const users = await CRM.request("/usuarios?activos=1");
      responsible.innerHTML += users.items.map(item =>
        `<option value="${item.id}">${UI.escape(item.nombre)}</option>`
      ).join("");
    } else {
      responsible.hidden = true;
    }
    await load();
  } catch (error) {
    if (error.message !== "Sesión requerida.") CRM.showMessage(message, error.message, true);
    return;
  }

  search.addEventListener("input", () => {
    clearTimeout(debounce);
    debounce = setTimeout(load, 250);
  });
  [type, responsible].forEach(element => element.addEventListener("change", load));
});
