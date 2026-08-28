// js/auth.js
document.addEventListener("DOMContentLoaded", () => {

  // ═══════════════════════════════════════════
  //  REGISTRO
  // ═══════════════════════════════════════════
  if (location.pathname.endsWith("registro.html")) {
    const btn     = document.querySelector("#btn");
    const nameEl  = document.querySelector("#name");
    const emailEl = document.querySelector("#email");
    const passEl  = document.querySelector("#pass");
    const msg     = document.querySelector("#msg");

    btn?.addEventListener("click", () => {
      const name  = nameEl.value.trim();
      const email = emailEl.value.trim().toLowerCase();
      const pass  = passEl.value.trim();

      // Validación básica
      if (!name || !email || !pass) {
        showMsg(msg, "Completa todos los campos.", true);
        return;
      }
      if (pass.length < 3) {
        showMsg(msg, "La contraseña debe tener al menos 3 caracteres.", true);
        return;
      }

      // Verificar si el correo ya existe
      const users = getUsers();
      if (users.find(u => u.email === email)) {
        showMsg(msg, "Ya existe una cuenta con ese correo.", true);
        return;
      }

      // Crear usuario
      const newUser = {
        id:    "u_" + Date.now().toString(36),
        name,
        email,
        pass,
        role:  "user",
        createdAt: new Date().toISOString()
      };
      users.push(newUser);
      saveUsers(users);

      // Iniciar sesión automáticamente
      _saveSession(newUser);

      showMsg(msg, "Registro exitoso. ¡Bienvenido/a!");
      setTimeout(() => {
        location.href = _getRedirectAfterLogin() || "perfil.html";
      }, 700);
    });
  }

  // ═══════════════════════════════════════════
  //  LOGIN
  // ═══════════════════════════════════════════
  if (location.pathname.endsWith("login.html")) {
    const btn     = document.querySelector("#btn");
    const emailEl = document.querySelector("#email");
    const passEl  = document.querySelector("#pass");
    const msg     = document.querySelector("#msg");

    btn?.addEventListener("click", () => {
      const email = emailEl.value.trim().toLowerCase();
      const pass  = passEl.value.trim();

      if (!email || !pass) {
        showMsg(msg, "Ingresa correo y contraseña.", true);
        return;
      }

      // ── Cuenta admin ──────────────────────
      if (email === "admin@admin.com" && pass === "123") {
        _saveSession({ id: "admin", name: "Administrador", email: "admin@admin.com", role: "admin" });
        location.href = _getRedirectAfterLogin() || "perfil.html";
        return;
      }

      // ── Usuarios registrados ───────────────
      const users = getUsers();
      const found = users.find(u => u.email === email && u.pass === pass);

      if (!found) {
        showMsg(msg, "Correo o contraseña incorrectos.", true);
        return;
      }

      _saveSession(found);
      location.href = _getRedirectAfterLogin() || "perfil.html";
    });

    // Permitir Enter en el campo de contraseña
    passEl?.addEventListener("keydown", e => {
      if (e.key === "Enter") btn?.click();
    });
  }
});

// ═══════════════════════════════════════════
//  PERFIL  (llamado desde perfil.html)
// ═══════════════════════════════════════════
function renderProfile() {
  const out = document.querySelector("#loggedOut");
  const inn = document.querySelector("#loggedIn");
  if (!out || !inn) return;

  const u = currentUser();

  if (!u) {
    out.hidden = false;
    inn.hidden = true;
    return;
  }

  out.hidden = true;
  inn.hidden = false;

  const pName  = document.querySelector("#pName");
  const pEmail = document.querySelector("#pEmail");
  if (pName)  pName.textContent  = u.name;
  if (pEmail) pEmail.textContent = u.email;

  // Mostrar badge de rol si es admin
  const rolEl = document.querySelector("#pRole");
  if (rolEl) rolEl.textContent = u.role === "admin" ? "Administrador" : "Usuario";

  // Cerrar sesión
  document.querySelector("#logout")?.addEventListener("click", () => {
    LS.set(KEYS.session, null);
    location.href = "index.html";
  });
}

// ═══════════════════════════════════════════
//  HELPERS PRIVADOS
// ═══════════════════════════════════════════
function _saveSession(user) {
  LS.set(KEYS.session, {
    id:    user.id,
    name:  user.name,
    email: user.email,
    role:  user.role || "user"
  });
}

function showMsg(el, text, danger = false) {
  el.hidden = false;
  el.classList.toggle("danger", danger);
  el.classList.toggle("danger", danger); // asegura el toggle
  if (!danger) el.classList.remove("danger");
  el.textContent = text;
}
