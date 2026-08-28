// js/nav.js
document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector("header");
  if (!header) return;

  const isAdminArea = location.pathname.includes("/admin/");

  // ── Nav panel de administrador ─────────────────────────
  if (isAdminArea) {
    header.innerHTML = `
      <div class="nav">
        <div class="brand">
          <span style="width:12px;height:12px;border-radius:4px;background:var(--accent);display:inline-block"></span>
          <a href="../index.html">CampusAmigo</a>
          <span class="badge">admin</span>
        </div>
        <nav class="links">
          <a href="index.html">Inicio</a>
          <a href="publicaciones.html">Productos</a>
          <a href="../catalogo.html">Ver sitio</a>
        </nav>
        <div class="actions">
          <button id="nav-logout" class="btn">Cerrar sesión</button>
        </div>
      </div>
    `;
    document.querySelector("#nav-logout")?.addEventListener("click", () => {
      LS.set(KEYS.session, null);
      location.href = "../index.html";
    });
    return;
  }

  // ── Leer sesión ────────────────────────────────────────
  const u = (typeof currentUser === "function") ? currentUser() : null;

  // ── HTML de la sección de autenticación ───────────────
  let authHTML = "";
  if (u) {
    // Usuario logueado
    authHTML = `
      <span class="pill" style="border-color:rgba(36,200,219,.45);color:#bff3ff">
        👤 <b>${u.name.split(" ")[0]}</b>
      </span>
      <a class="pill" href="carrito.html">Carrito&nbsp;<b data-cart-count>0</b></a>
      <a class="btn" href="perfil.html">Mi perfil</a>
      <a class="btn" href="mis_pedidos.html">Mis pedidos</a>
      ${u.role === "admin"
        ? `<a class="pill" href="admin/index.html" style="border-color:rgba(217,29,100,.45);color:#ffd0e2">Admin</a>`
        : ""}
      <button id="nav-logout" class="btn">Salir</button>
    `;
  } else {
    // Sin sesión
    authHTML = `
      <a class="pill" href="carrito.html">Carrito&nbsp;<b data-cart-count>0</b></a>
      <a class="btn" href="login.html">Login</a>
      <a class="btn" href="registro.html">Registro</a>
      <a class="pill" href="admin/index.html">Admin</a>
    `;
  }

  header.innerHTML = `
    <div class="nav">
      <div class="brand">
        <a href="index.html">CampusAmigo</a>
      </div>

      <button class="btn nav-toggle" id="nav-toggle" aria-label="Abrir menú">☰</button>

      <div class="nav-panel" id="nav-panel">
        <nav class="links">
          <a href="index.html">Inicio</a>
          <a href="catalogo.html">Catálogo</a>
          <a href="subasta.html">Subasta</a>
          <a href="promociones.html">Promociones</a>
          <a href="escaparate.html">Escaparate</a>
          <a href="comunidad.html">Comunidad</a>
          <a href="nosotros.html">Nosotros</a>
          <a href="contacto.html">Contacto</a>
        </nav>

        <div class="actions" id="nav-auth">
          ${authHTML}
        </div>
      </div>
    </div>
  `;

  // Actualizar badge del carrito
  if (typeof updateCartBadge === "function") updateCartBadge();

  // Toggle menú hamburguesa
  const toggle = document.querySelector("#nav-toggle");
  const nav    = document.querySelector(".nav");
  toggle?.addEventListener("click", () => nav.classList.toggle("open"));

  // Cerrar sesión desde nav
  document.querySelector("#nav-logout")?.addEventListener("click", () => {
    LS.set(KEYS.session, null);
    location.href = "index.html";
  });
});
