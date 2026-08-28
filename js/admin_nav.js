// js/admin_nav.js
document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector("header");
  if (!header) return;

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
    </div>
  `;
});