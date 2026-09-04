document.addEventListener("DOMContentLoaded", async () => {
  try {
    const user = await CRM.requireUser();
    document.querySelector("#crmUserName").textContent = user.name;
    document.querySelector("#crmUserRole").textContent = user.role === "admin"
      ? "Administrador"
      : "Usuario CRM";

    const [all, active, inactive] = await Promise.all([
      CRM.request("/clientes?limit=1"),
      CRM.request("/clientes?estado=activo&limit=1"),
      CRM.request("/clientes?estado=inactivo&limit=1")
    ]);

    document.querySelector("#totalClients").textContent = all.pagination.total;
    document.querySelector("#activeClients").textContent = active.pagination.total;
    document.querySelector("#inactiveClients").textContent = inactive.pagination.total;
  } catch (error) {
    if (error.message !== "Sesión requerida.") {
      CRM.showMessage(document.querySelector("#dashboardMsg"), error.message, true);
    }
  }
});

