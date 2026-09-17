document.addEventListener("DOMContentLoaded", async () => {
  const clientId = Number(new URLSearchParams(location.search).get("id"));
  const message = document.querySelector("#clientDetailMsg");
  const dialog = document.querySelector("#interactionDialog");
  let user;
  let client;
  let interactions = [];
  let evaluations = [];

  function stageClass(value) {
    return `stage-${String(value).toLowerCase()}`;
  }

  function renderClient() {
    document.title = `CampusAmigo CRM | ${client.nombre}`;
    document.querySelector("#clientAvatar").textContent = CRM.initials(client.nombre);
    document.querySelector("#clientTitle").textContent = client.nombre;
    document.querySelector("#clientStatus").textContent = client.estado;
    document.querySelector("#clientSubtitle").textContent = client.empresa || "Cliente sin empresa registrada";
    const badge = document.querySelector("#clientStageBadge");
    badge.textContent = client.etapa_crm;
    badge.className = `crm-stage-badge ${stageClass(client.etapa_crm)}`;
    const stage = document.querySelector("#detailStage");
    stage.value = client.etapa_crm;
    stage.className = `crm-stage-select ${stageClass(client.etapa_crm)}`;
    const edit = document.querySelector("#editClient");
    edit.href = `clientes.html?edit=${client.id}`;
    edit.hidden = user.role !== "admin";

    const fields = [
      ["Correo", client.correo],
      ["Teléfono", client.telefono || "No registrado"],
      ["Empresa / institución", client.empresa || "No registrada"],
      ["Fecha de registro", CRM.formatDateTime(client.fecha_registro)],
      ["Estado", client.estado],
      ["Etapa CRM", client.etapa_crm]
    ];
    document.querySelector("#clientInfo").innerHTML = fields.map(([label, value]) => `
      <div class="crm-detail-field">
        <small>${UI.escape(label)}</small>
        <b>${UI.escape(value)}</b>
      </div>`).join("");
  }

  function renderInteractions() {
    const timeline = document.querySelector("#interactionTimeline");
    timeline.innerHTML = interactions.length
      ? interactions.map(item => `
        <article class="crm-timeline-item">
          <span class="crm-type-dot type-${item.tipo}">${UI.escape(CRM.interactionLabel(item.tipo).slice(0, 1))}</span>
          <div class="crm-timeline-body">
            <b>${UI.escape(CRM.interactionLabel(item.tipo))}</b>
            <p>${UI.escape(item.descripcion)}</p>
            <span class="crm-timeline-meta">Responsable: ${UI.escape(item.responsable_nombre)}</span>
          </div>
          <time class="crm-timeline-date" datetime="${UI.escape(item.fecha)}">${UI.escape(CRM.formatDateTime(item.fecha))}</time>
        </article>`).join("")
      : '<div class="crm-empty">Todavía no hay interacciones. Registra el primer contacto para iniciar el historial.</div>';
  }

  function renderEvaluations() {
    const list = document.querySelector("#evaluationList");
    list.innerHTML = evaluations.length
      ? evaluations.map(item => `
        <article class="crm-evaluation-item">
          <b class="crm-score" aria-label="${item.calificacion} de 5">${"★".repeat(item.calificacion)}${"☆".repeat(5 - item.calificacion)}</b>
          <div>
            <b>${UI.escape(item.responsable_nombre)}</b>
            <p>${UI.escape(item.comentario || "Sin comentario")}</p>
          </div>
          <time class="crm-timeline-date" datetime="${UI.escape(item.fecha)}">${UI.escape(CRM.formatDateTime(item.fecha))}</time>
        </article>`).join("")
      : '<div class="crm-empty">Este cliente aún no tiene evaluaciones de relación.</div>';
  }

  async function loadInteractions() {
    const result = await CRM.request(`/clientes/${clientId}/interacciones`);
    interactions = result.items;
    renderInteractions();
  }

  async function loadEvaluations() {
    const result = await CRM.request(`/clientes/${clientId}/evaluaciones`);
    evaluations = result.items;
    renderEvaluations();
  }

  if (!Number.isInteger(clientId) || clientId < 1) {
    CRM.showMessage(message, "Selecciona un cliente válido desde el directorio.", true);
    return;
  }

  try {
    user = await CRM.requireUser();
    const [clientResult, userResult] = await Promise.all([
      CRM.request(`/clientes/${clientId}`),
      CRM.request("/usuarios?activos=1")
    ]);
    client = clientResult.client;
    renderClient();
    const responsible = document.querySelector("#interactionResponsible");
    responsible.innerHTML = userResult.items.map(item =>
      `<option value="${item.id}"${item.id === user.id ? " selected" : ""}>${UI.escape(item.nombre)}</option>`
    ).join("");
    responsible.disabled = user.role !== "admin";
    document.querySelector("#interactionDate").value = CRM.localDateTimeInput();
    document.querySelector("#evaluationDate").value = CRM.localDateTimeInput();
    await Promise.all([loadInteractions(), loadEvaluations()]);
  } catch (error) {
    if (error.message !== "Sesión requerida.") CRM.showMessage(message, error.message, true);
    return;
  }

  document.querySelectorAll("[data-tab]").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll("[data-tab]").forEach(item =>
        item.setAttribute("aria-selected", String(item === tab))
      );
      document.querySelectorAll("[role='tabpanel']").forEach(panel => {
        panel.hidden = panel.id !== tab.dataset.tab;
      });
    });
  });

  document.querySelector("#detailStage").addEventListener("change", async event => {
    const select = event.currentTarget;
    try {
      const result = await CRM.request(`/clientes/${clientId}/etapa`, {
        method: "PUT",
        body: { etapa_crm: select.value }
      });
      client = result.client;
      renderClient();
      UI.toast("Etapa CRM actualizada");
    } catch (error) {
      select.value = client.etapa_crm;
      CRM.showMessage(message, error.message, true);
    }
  });

  const closeDialog = () => dialog.close();
  document.querySelector("#openInteraction").addEventListener("click", () => {
    document.querySelector("#interactionDate").value = CRM.localDateTimeInput();
    dialog.showModal();
    document.querySelector("#interactionType").focus();
  });
  document.querySelector("#closeInteraction").addEventListener("click", closeDialog);
  document.querySelector("#cancelInteraction").addEventListener("click", closeDialog);
  dialog.addEventListener("click", event => {
    if (event.target === dialog) closeDialog();
  });

  document.querySelector("#interactionForm").addEventListener("submit", async event => {
    event.preventDefault();
    const button = document.querySelector("#saveInteraction");
    button.disabled = true;
    try {
      await CRM.request("/interacciones", {
        method: "POST",
        body: {
          cliente_id: clientId,
          tipo: document.querySelector("#interactionType").value,
          descripcion: document.querySelector("#interactionDescription").value,
          fecha: new Date(document.querySelector("#interactionDate").value).toISOString(),
          usuario_id: Number(document.querySelector("#interactionResponsible").value)
        }
      });
      event.currentTarget.reset();
      document.querySelector("#interactionDate").value = CRM.localDateTimeInput();
      closeDialog();
      UI.toast("Interacción registrada");
      await loadInteractions();
    } catch (error) {
      CRM.showMessage(message, error.message, true);
    } finally {
      button.disabled = false;
    }
  });

  document.querySelector("#evaluationForm").addEventListener("submit", async event => {
    event.preventDefault();
    const button = document.querySelector("#saveEvaluation");
    button.disabled = true;
    try {
      await CRM.request("/evaluaciones", {
        method: "POST",
        body: {
          cliente_id: clientId,
          calificacion: Number(document.querySelector("#evaluationScore").value),
          comentario: document.querySelector("#evaluationComment").value,
          fecha: new Date(document.querySelector("#evaluationDate").value).toISOString()
        }
      });
      document.querySelector("#evaluationComment").value = "";
      document.querySelector("#evaluationDate").value = CRM.localDateTimeInput();
      UI.toast("Evaluación registrada");
      await loadEvaluations();
    } catch (error) {
      CRM.showMessage(message, error.message, true);
    } finally {
      button.disabled = false;
    }
  });
});
