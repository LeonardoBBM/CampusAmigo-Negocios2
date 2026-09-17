document.addEventListener("DOMContentLoaded", async () => {
  const message = document.querySelector("#reportMsg");
  const from = document.querySelector("#reportFrom");
  const until = document.querySelector("#reportUntil");
  const today = new Date();
  from.value = CRM.localDateTimeInput(new Date(today.getFullYear(), today.getMonth(), 1)).slice(0, 10);
  until.value = CRM.localDateTimeInput(today).slice(0, 10);

  const typeOrder = ["llamada", "correo", "reunion", "otro"];
  const typeColors = { llamada: "#e6a329", correo: "#4b91c8", reunion: "#55a6a0", otro: "#86a74d" };
  const stageOrder = ["Prospecto", "Activo", "Frecuente", "Inactivo"];
  const stageColors = { Prospecto: "#4b91c8", Activo: "#3d8b4a", Frecuente: "#8966b0", Inactivo: "#ee873f" };

  function renderTypeChart(items) {
    const totals = Object.fromEntries(items.map(item => [item.tipo, item.total]));
    const max = Math.max(1, ...typeOrder.map(type => totals[type] || 0));
    document.querySelector("#typeChart").innerHTML = typeOrder.map(type => {
      const total = totals[type] || 0;
      const height = total ? Math.max(12, Math.round(total * 180 / max)) : 3;
      return `<div class="crm-bar-column"><b>${total}</b><div class="crm-bar" style="--bar-height:${height}px;--bar-color:${typeColors[type]}"></div><span>${UI.escape(CRM.interactionLabel(type))}</span></div>`;
    }).join("");
  }

  function renderStageChart(items) {
    const totals = Object.fromEntries(items.map(item => [item.etapa, item.total]));
    const totalClients = stageOrder.reduce((sum, stage) => sum + (totals[stage] || 0), 0);
    let cursor = 0;
    const segments = [];
    stageOrder.forEach(stage => {
      const end = totalClients ? cursor + (totals[stage] || 0) * 100 / totalClients : cursor;
      if (end > cursor) segments.push(`${stageColors[stage]} ${cursor}% ${end}%`);
      cursor = end;
    });
    document.querySelector("#stagePie").style.background = segments.length
      ? `conic-gradient(${segments.join(",")})`
      : "#e6ece2";
    document.querySelector("#stageLegend").innerHTML = stageOrder.map(stage => `
      <div class="crm-legend-item">
        <span class="crm-legend-dot" style="--legend-color:${stageColors[stage]}"></span>
        <span>${stage}</span><b>${totals[stage] || 0}</b>
      </div>`).join("");
  }

  function renderClientMetrics(items) {
    document.querySelector("#clientMetricRows").innerHTML = items.length
      ? items.map(client => `
        <tr>
          <td><b>${UI.escape(client.nombre)}</b></td>
          <td><span class="crm-stage-badge stage-${client.etapa_crm.toLowerCase()}">${UI.escape(client.etapa_crm)}</span></td>
          <td>${client.interacciones}</td>
          <td class="small">${client.ultima_interaccion ? UI.escape(CRM.formatDateTime(client.ultima_interaccion)) : "Sin contacto"}</td>
          <td class="right"><a class="btn" href="cliente.html?id=${client.id}">Ver cliente</a></td>
        </tr>`).join("")
      : '<tr><td colspan="5" class="small">Aún no hay clientes para calcular cobertura.</td></tr>';
  }

  async function load() {
    try {
      const params = new URLSearchParams({ desde: from.value, hasta: until.value });
      const metrics = await CRM.request(`/metricas?${params}`);
      const summary = metrics.resumen;
      const activePercent = summary.total_clientes
        ? Math.round(summary.clientes_activos * 100 / summary.total_clientes)
        : 0;
      document.querySelector("#reportTotal").textContent = summary.total_clientes;
      document.querySelector("#reportActive").textContent = summary.clientes_activos;
      document.querySelector("#reportActivePercent").textContent = `${activePercent}% del total`;
      document.querySelector("#reportInteractions").textContent = summary.interacciones_periodo;
      document.querySelector("#reportRisk").textContent = summary.clientes_sin_interaccion_reciente;
      document.querySelector("#reportRiskDays").textContent = `Umbral de ${metrics.dias_riesgo} días`;
      document.querySelector("#evaluationSummary").textContent = summary.evaluaciones_periodo
        ? `${summary.evaluaciones_periodo} evaluaciones · promedio ${summary.evaluacion_promedio}/5`
        : "Sin evaluaciones en el periodo";
      renderTypeChart(metrics.interacciones_por_tipo);
      renderStageChart(metrics.clientes_por_etapa);
      renderClientMetrics(metrics.interacciones_por_cliente);
      message.hidden = true;
    } catch (error) {
      CRM.showMessage(message, error.message, true);
    }
  }

  try {
    await CRM.requireUser();
    await load();
  } catch (error) {
    if (error.message !== "Sesión requerida.") CRM.showMessage(message, error.message, true);
    return;
  }

  [from, until].forEach(element => element.addEventListener("change", load));
});
