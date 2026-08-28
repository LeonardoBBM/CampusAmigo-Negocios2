// js/publicar.js
ensureSeed();
updateCartBadge();

const $ = (s) => document.querySelector(s);
const msg = $("#msg");

function setMsg(text, danger = false) {
  msg.hidden = false;
  msg.textContent = text;
  msg.classList.toggle("danger", danger);
  if (!danger) msg.classList.remove("danger");
}

// Pre-rellenar nombre del vendedor con el usuario activo
const u = currentUser();
if (u) {
  const sellerField = $("#seller");
  if (sellerField) {
    sellerField.value = u.name;
    sellerField.readOnly = true;          // no editable si ya está logueado
    sellerField.style.opacity = ".7";
  }
} else {
  // Mostrar aviso pero no bloquear (simulación)
  const notice = document.createElement("div");
  notice.className = "notice";
  notice.style.marginBottom = "10px";
  notice.innerHTML = `<b>Nota:</b> Inicia sesión para vincular la publicación a tu perfil. 
    <a href="login.html" style="text-decoration:underline">Ir a Login</a>`;
  $("#msg")?.parentElement?.insertBefore(notice, $("#msg"));
}

$("#save")?.addEventListener("click", () => {
  const sellerName = $("#seller").value.trim();
  const name       = $("#name").value.trim();
  const price      = Number($("#price").value);
  const cat        = $("#cat").value;
  const tag        = $("#tag").value;
  const desc       = $("#desc").value.trim();
  const image      = $("#image").value.trim();

  // Validación
  if (!sellerName || !name || !Number.isFinite(price) || price <= 0) {
    setMsg("Completa nombre del vendedor, nombre del producto y precio válido.", true);
    return;
  }

  // Construir producto
  const products = getProducts();
  const newId = "p_" + Date.now().toString(36) + Math.random().toString(16).slice(2, 6);

  products.unshift({
    id:         newId,
    name,
    price,
    category:   cat,
    tag,
    desc,
    image:      image || null,
    // Vincular al usuario si hay sesión activa
    sellerId:   u ? u.id   : "guest_" + Date.now().toString(36),
    sellerName: u ? u.name : sellerName,
    createdAt:  new Date().toISOString()
  });

  saveProducts(products);

  setMsg("¡Publicado! Tu producto ya aparece en el catálogo.");

  // Limpiar formulario
  $("#name").value  = "";
  $("#price").value = "";
  $("#desc").value  = "";
  $("#image").value = "";
  $("#tag").value   = "";

  setTimeout(() => {
    location.href = "catalogo.html";
  }, 1000);
});
