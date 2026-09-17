document.addEventListener("DOMContentLoaded", async () => {
  try {
    const user = await CRM.requireUser();
    document.querySelector("#crmUserName").textContent = user.name;
    document.querySelector("#crmUserRole").textContent = user.role === "admin"
      ? "Administrador"
      : "Usuario CRM";

    const metrics = await CRM.request("/metricas");
    const summary = metrics.resumen;
    const total = summary.total_clientes;
    const activePercent = total ? Math.round(summary.clientes_activos * 100 / total) : 0;

    document.querySelector("#totalClients").textContent = total;
    document.querySelector("#activeClients").textContent = summary.clientes_activos;
    document.querySelector("#monthInteractions").textContent = summary.interacciones_periodo;
    document.querySelector("#riskClients").textContent = summary.clientes_sin_interaccion_reciente;
    document.querySelector("#activePercent").textContent = `${activePercent}% del total`;
    document.querySelector("#riskDaysLabel").textContent = `Últimos ${metrics.dias_riesgo} días`;
    document.querySelector("#statusPercent").textContent = `${activePercent}%`;
    document.querySelector("#legendActive").textContent = summary.clientes_activos;
    document.querySelector("#legendInactive").textContent = summary.clientes_inactivos;
    document.querySelector("#statusDonut").style.background = total
      ? `conic-gradient(var(--forest) 0 ${activePercent}%, #ee873f ${activePercent}% 100%)`
      : "#e6ece2";

    const riskList = document.querySelector("#riskList");
    riskList.innerHTML = metrics.clientes_en_riesgo.length
      ? metrics.clientes_en_riesgo.map(client => `
        <a class="crm-risk-item" href="cliente.html?id=${client.id}">
          <div>
            <b>${UI.escape(client.nombre)}</b>
            <p>${client.ultima_interaccion
              ? `${client.dias_sin_interaccion} días desde el último contacto`
              : "Sin interacciones registradas"}</p>
          </div>
          <span class="crm-stage-badge stage-${client.etapa_crm.toLowerCase()}">${UI.escape(client.etapa_crm)}</span>
        </a>`).join("")
      : `<div class="crm-empty">No hay clientes que requieran seguimiento con el umbral actual de ${metrics.dias_riesgo} días.</div>`;
  } catch (error) {
    if (error.message !== "Sesión requerida.") {
      CRM.showMessage(document.querySelector("#dashboardMsg"), error.message, true);
    }
  }
});
