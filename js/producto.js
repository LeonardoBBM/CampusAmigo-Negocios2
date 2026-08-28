ensureSeed();
updateCartBadge();

const id = getParam("id");
const p = getProducts().find(x => x.id === id);

const $ = (s) => document.querySelector(s);

function mediaHtml(product) {
  if (product.image) {
    return `<img src="${product.image}" alt="${product.name}" onerror="this.parentElement.innerHTML='<div class=&quot;prod-fallback&quot;>Detalle</div>'">`;
  }
  return `<div class="prod-fallback">Detalle</div>`;
}

function renderStaticComments() {
  const commentList = $("#commentList");
  if (!commentList) return;

  commentList.innerHTML = `
    <div class="comment-item">
      <div class="comment-head">
        <b>Ana</b>
        <span class="star-row">★★★★★</span>
      </div>
      <div class="comment-text">Muy buen producto, se ve confiable.</div>
    </div>

    <div class="comment-item">
      <div class="comment-head">
        <b>Carlos</b>
        <span class="star-row">★★★★☆</span>
      </div>
      <div class="comment-text">Buena presentación y descripción clara.</div>
    </div>
  `;
}

if (!p) {
  document.querySelector("main").innerHTML =
    `<div class="container">
      <p class="notice danger">Producto no encontrado.</p>
      <a class="btn" href="catalogo.html">Volver</a>
    </div>`;
} else {
  $("#productMedia").innerHTML = mediaHtml(p);
  $("#name").textContent = p.name;
  $("#price").textContent = money(p.price);
  $("#cat").textContent = p.category;
  $("#desc").textContent = p.desc || "";

  const sellerWrap = document.querySelector("#seller");
  if (sellerWrap) {
    sellerWrap.textContent = p.sellerId ? (p.sellerName || "Usuario") : "CampusAmigo";
  }

  if (p.tag) {
    const tagClass = p.tag === "Nuevo" ? "new" : (p.tag === "Oferta" ? "sale" : "");
    $("#tag").innerHTML = `<span class="tag ${tagClass}">${p.tag}</span>`;
  }

  $("#add").addEventListener("click", () => {
    const qty = Number($("#qty").value || 1);
    addToCart(p.id, qty); UI.toast("Producto agregado a tu carrito");

    $("#msg").hidden = false;
    $("#msg").textContent = `Agregado al carrito: ${qty} x ${p.name}`;
    updateCartBadge();

    setTimeout(() => $("#msg").hidden = true, 1200);
  });

  // comentarios simulados
  renderStaticComments();

  $("#commentBtn")?.addEventListener("click", () => {
    const user = ($("#commentUser").value || "").trim();
    const text = ($("#commentText").value || "").trim();
    const commentMsg = $("#commentMsg");

    commentMsg.hidden = false;
    commentMsg.classList.remove("danger");

    if (!user || !text) {
      commentMsg.classList.add("danger");
      commentMsg.textContent = "Escribe nombre y comentario.";
      return;
    }

    $("#commentUser").value = "";
    $("#commentText").value = "";
    commentMsg.textContent = "Comentario enviado.";
  });

  const rel = getProducts()
    .filter(x => x.category === p.category && x.id !== p.id)
    .slice(0, 3);

  document.querySelector("#rel").innerHTML = rel.map(UI.card).join("") || `<p class="small">No hay relacionados aún.</p>`; UI.bindProducts(document.querySelector("#rel"));
}