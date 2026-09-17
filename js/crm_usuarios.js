document.addEventListener("DOMContentLoaded", async () => {
  const message = document.querySelector("#userMsg");
  const content = document.querySelector("#userAdminContent");
  const rows = document.querySelector("#userRows");
  const formCard = document.querySelector("#userFormCard");
  let currentUser;
  let users = [];

  function render() {
    document.querySelector("#userCount").textContent = `${users.length} ${users.length === 1 ? "usuario" : "usuarios"}`;
    rows.innerHTML = users.map(user => {
      const self = user.id === currentUser.id;
      return `
        <tr data-user-row="${user.id}">
          <td><input class="input" data-user-name value="${UI.escape(user.nombre)}" maxlength="100" aria-label="Nombre de ${UI.escape(user.nombre)}"></td>
          <td><input class="input" data-user-email type="email" value="${UI.escape(user.correo)}" aria-label="Correo de ${UI.escape(user.nombre)}"></td>
          <td><select data-user-role aria-label="Rol de ${UI.escape(user.nombre)}"${self ? " disabled" : ""}><option value="user"${user.rol === "user" ? " selected" : ""}>Usuario</option><option value="admin"${user.rol === "admin" ? " selected" : ""}>Administrador</option></select></td>
          <td><select data-user-active aria-label="Estado de ${UI.escape(user.nombre)}"${self ? " disabled" : ""}><option value="1"${user.activo ? " selected" : ""}>Activo</option><option value="0"${!user.activo ? " selected" : ""}>Inactivo</option></select></td>
          <td class="small">${UI.escape(new Date(user.fecha_registro).toLocaleDateString("es-MX"))}</td>
          <td class="right"><button class="btn" type="button" data-save-user="${user.id}">Guardar</button></td>
        </tr>`;
    }).join("");
  }

  async function loadUsers() {
    const result = await CRM.request("/usuarios");
    users = result.items;
    render();
  }

  try {
    currentUser = await CRM.requireUser();
    if (currentUser.role !== "admin") {
      content.hidden = true;
      document.querySelector("#openUserForm").hidden = true;
      CRM.showMessage(message, "Esta vista está restringida a administradores.", true);
      return;
    }
    await loadUsers();
  } catch (error) {
    if (error.message !== "Sesión requerida.") CRM.showMessage(message, error.message, true);
    return;
  }

  document.querySelector("#openUserForm").addEventListener("click", () => {
    formCard.hidden = false;
    document.querySelector("#userName").focus();
    formCard.scrollIntoView({ behavior: "smooth" });
  });
  document.querySelector("#cancelUser").addEventListener("click", () => {
    formCard.hidden = true;
    document.querySelector("#userForm").reset();
  });

  document.querySelector("#userForm").addEventListener("submit", async event => {
    event.preventDefault();
    const button = document.querySelector("#saveUser");
    button.disabled = true;
    try {
      await CRM.request("/usuarios", {
        method: "POST",
        body: {
          nombre: document.querySelector("#userName").value,
          correo: document.querySelector("#userEmail").value,
          rol: document.querySelector("#userRole").value,
          contrasena: document.querySelector("#userPassword").value
        }
      });
      event.currentTarget.reset();
      formCard.hidden = true;
      UI.toast("Usuario creado");
      await loadUsers();
    } catch (error) {
      CRM.showMessage(message, error.message, true);
    } finally {
      button.disabled = false;
    }
  });

  rows.addEventListener("click", async event => {
    const button = event.target.closest("[data-save-user]");
    if (!button) return;
    const row = button.closest("[data-user-row]");
    button.disabled = true;
    try {
      await CRM.request(`/usuarios/${button.dataset.saveUser}`, {
        method: "PUT",
        body: {
          nombre: row.querySelector("[data-user-name]").value,
          correo: row.querySelector("[data-user-email]").value,
          rol: row.querySelector("[data-user-role]").value,
          activo: row.querySelector("[data-user-active]").value === "1"
        }
      });
      UI.toast("Usuario actualizado");
      await loadUsers();
    } catch (error) {
      CRM.showMessage(message, error.message, true);
    } finally {
      button.disabled = false;
    }
  });
});
