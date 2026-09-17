document.addEventListener("DOMContentLoaded", async () => {
  const message = document.querySelector("#evaluationMsg");
  const rows = document.querySelector("#evaluationRows");
  try {
    await CRM.requireUser();
    const result = await CRM.request("/evaluaciones");
    document.querySelector("#evaluationCount").textContent = `${result.items.length} ${result.items.length === 1 ? "evaluación" : "evaluaciones"}`;
    rows.innerHTML = result.items.length
      ? result.items.map(item => `
        <tr>
          <td class="small">${UI.escape(CRM.formatDateTime(item.fecha))}</td>
          <td><b>${UI.escape(item.cliente_nombre)}</b></td>
          <td><span class="crm-score" aria-label="${item.calificacion} de 5">${"★".repeat(item.calificacion)}${"☆".repeat(5 - item.calificacion)}</span></td>
          <td>${UI.escape(item.comentario || "Sin comentario")}</td>
          <td>${UI.escape(item.responsable_nombre)}</td>
          <td class="right"><a class="btn" href="cliente.html?id=${item.cliente_id}">Ver cliente</a></td>
        </tr>`).join("")
      : '<tr><td colspan="6" class="small">Todavía no hay evaluaciones registradas.</td></tr>';
  } catch (error) {
    if (error.message !== "Sesión requerida.") CRM.showMessage(message, error.message, true);
  }
});
