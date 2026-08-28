document.addEventListener("DOMContentLoaded", () => {
  const u = (typeof currentUser === "function") ? currentUser() : null;

  if (!u || u.role !== "admin") {
    alert("Acceso solo para administrador.");
    // manda al login y regresa al admin
    if (typeof setRedirectAfterLogin === "function") {
      setRedirectAfterLogin("admin/index.html");
    }
    location.href = "../login.html";
  }
});