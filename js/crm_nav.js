document.addEventListener("DOMContentLoaded", async () => {
  const header = document.querySelector("header");
  if (!header) return;

  let user = null;
  try { user = await CRM.currentUser(); } catch { }

  const current = location.pathname.split("/").pop() || "index.html";
  const isCurrent = href => current === href || (href === "clientes.html" && current === "cliente.html");
  const link = (href, label) =>
    `<a href="${href}"${isCurrent(href) ? ' aria-current="page"' : ""}>${label}</a>`;
  const secondaryPages = ["evaluaciones.html", "actividad.html", "usuarios.html", "configuracion.html"];
  const secondaryActive = secondaryPages.includes(current);

  header.innerHTML = `
    <div class="nav">
      <a class="brand" href="../index.html"><span class="brand-mark">ca.</span>campusamigo</a>
      <button class="nav-toggle" id="nav-toggle" aria-label="Abrir menú" aria-expanded="false" aria-controls="nav-panel">${UI.icon("menu")}</button>
      <div class="nav-panel" id="nav-panel">
        <nav class="links" aria-label="Navegación CRM">
          ${link("index.html", "Resumen")}
          ${link("clientes.html", "Clientes")}
          ${link("interacciones.html", "Interacciones")}
          ${link("reportes.html", "Reportes")}
          <details class="nav-more">
            <summary${secondaryActive ? ' aria-current="page"' : ""}>Más ${UI.icon("chevron")}</summary>
            <div class="nav-more-menu">
              ${link("evaluaciones.html", "Evaluaciones")}
              ${link("actividad.html", "Mi actividad")}
              ${user?.role === "admin" ? link("usuarios.html", "Usuarios") : ""}
              ${user?.role === "admin" ? link("configuracion.html", "Configuración") : ""}
              <a href="../index.html">Ver marketplace</a>
            </div>
          </details>
        </nav>
        <div class="actions">
          ${user
            ? `<span class="nav-user"><span class="avatar">${UI.escape(user.name.slice(0, 2).toUpperCase())}</span>${UI.escape(user.name.split(" ")[0])}</span><button class="nav-logout" id="crm-logout" aria-label="Cerrar sesión">${UI.icon("exit")}</button>`
            : '<a class="btn" href="login.html">Ingresar al CRM</a>'}
        </div>
      </div>
    </div>`;

  const toggle = header.querySelector("#nav-toggle");
  const nav = header.querySelector(".nav");
  toggle?.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
    toggle.innerHTML = UI.icon(open ? "close" : "menu");
  });

  document.querySelector("#crm-logout")?.addEventListener("click", async () => {
    await CRM.request("/api/auth/logout", { method: "POST" });
    location.href = "login.html";
  });
});
