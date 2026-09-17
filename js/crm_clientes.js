document.addEventListener("DOMContentLoaded", async () => {
  const rows = document.querySelector("#clientRows");
  const count = document.querySelector("#clientCount");
  const message = document.querySelector("#clientMsg");
  const formCard = document.querySelector("#clientFormCard");
  const form = document.querySelector("#clientForm");
  const formTitle = document.querySelector("#clientFormTitle");
  const addButton = document.querySelector("#addClient");
  const saveButton = document.querySelector("#saveClient");
  const q = document.querySelector("#q");
  const status = document.querySelector("#statusFilter");
  const stage = document.querySelector("#stageFilter");

  let user;
  let clients = [];
  let editingId = null;
  let debounce;
  let requestedEditHandled = false;

  function stageClass(value) {
    return `stage-${String(value).toLowerCase()}`;
  }

  function stageOptions(selected) {
    return ["Prospecto", "Activo", "Frecuente", "Inactivo"]
      .map(value => `<option value="${value}"${value === selected ? " selected" : ""}>${value}</option>`)
      .join("");
  }

  function resetForm() {
    editingId = null;
    form.reset();
    document.querySelector("#clientStatus").value = "activo";
    document.querySelector("#clientStage").value = "Prospecto";
    formTitle.textContent = "Agregar cliente";
  }

  function openForm(client = null) {
    resetForm();
    if (client) {
      editingId = client.id;
      formTitle.textContent = "Editar cliente";
      document.querySelector("#clientName").value = client.nombre;
      document.querySelector("#clientEmail").value = client.correo;
      document.querySelector("#clientPhone").value = client.telefono;
      document.querySelector("#clientCompany").value = client.empresa;
      document.querySelector("#clientStatus").value = client.estado;
      document.querySelector("#clientStage").value = client.etapa_crm;
    }
    formCard.hidden = false;
    document.querySelector("#clientName").focus();
    formCard.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function closeForm() {
    formCard.hidden = true;
    resetForm();
  }

  function render() {
    count.textContent = `${clients.length} de ${count.dataset.total || 0} clientes`;
    if (!clients.length) {
      rows.innerHTML = '<tr><td colspan="6" class="small">No hay clientes con estos filtros.</td></tr>';
      return;
    }

    rows.innerHTML = clients.map(client => `
      <tr>
        <td><div class="crm-person"><b>${UI.escape(client.nombre)}</b><small>${UI.escape(client.correo)}</small></div></td>
        <td><div class="crm-person"><span>${UI.escape(client.empresa || "—")}</span><small>${UI.escape(client.telefono || "Sin teléfono")}</small></div></td>
        <td><span class="pill">${UI.escape(client.estado)}</span></td>
        <td>
          <select class="crm-stage-select ${stageClass(client.etapa_crm)}" data-stage="${client.id}" aria-label="Etapa CRM de ${UI.escape(client.nombre)}">
            ${stageOptions(client.etapa_crm)}
          </select>
        </td>
        <td class="small">${new Date(client.fecha_registro).toLocaleDateString("es-MX")}</td>
        <td class="right">
          <div class="crm-inline-actions">
            <a class="btn" href="cliente.html?id=${client.id}">Ver</a>
            ${user.role === "admin" ? `<button class="btn" data-edit="${client.id}">Editar</button><button class="btn danger outline" data-delete="${client.id}">Eliminar</button>` : ""}
          </div>
        </td>
      </tr>`).join("");
  }

  async function loadClients() {
    const params = new URLSearchParams({ limit: "100" });
    if (q.value.trim()) params.set("q", q.value.trim());
    if (status.value) params.set("estado", status.value);
    if (stage.value) params.set("etapa", stage.value);

    try {
      const result = await CRM.request(`/clientes?${params}`);
      clients = result.items;
      count.dataset.total = result.pagination.total;
      render();
      message.hidden = true;
      if (!requestedEditHandled && user.role === "admin") {
        const requestedId = Number(new URLSearchParams(location.search).get("edit"));
        const requestedClient = clients.find(client => client.id === requestedId);
        if (requestedClient) openForm(requestedClient);
        requestedEditHandled = true;
      }
    } catch (error) {
      CRM.showMessage(message, error.message, true);
    }
  }

  try {
    user = await CRM.requireUser();
    if (user.role !== "admin") addButton.hidden = true;
    await loadClients();
  } catch (error) {
    if (error.message !== "Sesión requerida.") CRM.showMessage(message, error.message, true);
    return;
  }

  addButton.addEventListener("click", () => openForm());
  document.querySelector("#cancelClient").addEventListener("click", closeForm);

  form.addEventListener("submit", async event => {
    event.preventDefault();
    saveButton.disabled = true;
    const payload = {
      nombre: document.querySelector("#clientName").value,
      correo: document.querySelector("#clientEmail").value,
      telefono: document.querySelector("#clientPhone").value,
      empresa: document.querySelector("#clientCompany").value,
      estado: document.querySelector("#clientStatus").value,
      etapa_crm: document.querySelector("#clientStage").value
    };

    try {
      await CRM.request(editingId ? `/clientes/${editingId}` : "/clientes", {
        method: editingId ? "PUT" : "POST",
        body: payload
      });
      UI.toast(editingId ? "Cliente actualizado" : "Cliente registrado");
      closeForm();
      await loadClients();
    } catch (error) {
      CRM.showMessage(message, error.message, true);
    } finally {
      saveButton.disabled = false;
    }
  });

  rows.addEventListener("click", async event => {
    const editButton = event.target.closest("[data-edit]");
    const deleteButton = event.target.closest("[data-delete]");

    if (editButton) {
      openForm(clients.find(client => client.id === Number(editButton.dataset.edit)));
    }

    if (deleteButton) {
      const client = clients.find(item => item.id === Number(deleteButton.dataset.delete));
      if (!client || !confirm(`¿Dar de baja a ${client.nombre}?`)) return;
      try {
        await CRM.request(`/clientes/${client.id}`, { method: "DELETE" });
        UI.toast("Cliente dado de baja");
        await loadClients();
      } catch (error) {
        CRM.showMessage(message, error.message, true);
      }
    }
  });

  rows.addEventListener("change", async event => {
    const select = event.target.closest("[data-stage]");
    if (!select) return;
    try {
      await CRM.request(`/clientes/${select.dataset.stage}/etapa`, {
        method: "PUT",
        body: { etapa_crm: select.value }
      });
      select.className = `crm-stage-select ${stageClass(select.value)}`;
      UI.toast("Etapa CRM actualizada");
    } catch (error) {
      CRM.showMessage(message, error.message, true);
      await loadClients();
    }
  });

  q.addEventListener("input", () => {
    clearTimeout(debounce);
    debounce = setTimeout(loadClients, 250);
  });
  [status, stage].forEach(element => element.addEventListener("change", loadClients));
});
