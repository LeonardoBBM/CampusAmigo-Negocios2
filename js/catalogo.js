ensureSeed();
updateCartBadge();

const list = document.querySelector("#list");
const q = document.querySelector("#q");
const cat = document.querySelector("#cat");
const sort = document.querySelector("#sort");
const count = document.querySelector("#count");

function productImageHtml(p) {
  if (p.image) {
    return `
      <div class="prod-media">
        <img src="${p.image}" alt="${p.name}" onerror="this.parentElement.innerHTML='<div class=&quot;prod-fallback&quot;>CampusAmigo</div>'">
      </div>
    `;
  }

  return `
    <div class="prod-media">
      <div class="prod-fallback">CampusAmigo</div>
    </div>
  `;
}

function sellerLabel(p) {
  if (p.sellerId) {
    return `<span class="small">Vendedor: ${p.sellerName || "Usuario"}</span>`;
  }
  return `<span class="small">Tienda CampusAmigo</span>`;
}

function render() {
  let items = getProducts();

  const term = (q.value || "").trim().toLowerCase();
  if (term) {
    items = items.filter(p =>
      (p.name || "").toLowerCase().includes(term) ||
      (p.desc || "").toLowerCase().includes(term) ||
      (p.sellerName || "").toLowerCase().includes(term)
    );
  }

  const c = cat.value;
  if (c !== "all") items = items.filter(p => p.category === c);

  if (sort.value === "price_asc") items = [...items].sort((a, b) => a.price - b.price);
  if (sort.value === "price_desc") items = [...items].sort((a, b) => b.price - a.price);

  count.textContent = `${items.length} items`;

  list.innerHTML = items.map(p => {
    const tagClass = p.tag === "Nuevo" ? "new" : (p.tag === "Oferta" ? "sale" : "");
    const tagHtml = p.tag ? `<span class="tag ${tagClass}">${p.tag}</span>` : "";

    return `
      <article class="card product">
        ${productImageHtml(p)}

        <div class="p-body" style="margin-top:10px">
          <div class="p-tag">
            ${tagHtml}
          </div>

          <h3 class="p-title">${p.name}</h3>

          <div class="p-meta">
            <span class="small">${p.category}</span>
            <span class="price">${money(p.price)}</span>
          </div>

          <div style="margin-top:8px">
            ${sellerLabel(p)}
          </div>

          <hr/>

          <div class="p-actions">
            <a class="btn" href="producto.html?id=${encodeURIComponent(p.id)}">Ver detalle</a>
            <button class="btn primary" data-add="${p.id}">Agregar</button>
          </div>
        </div>
      </article>
    `;
  }).join("");

  document.querySelectorAll("[data-add]").forEach(btn => {
    btn.addEventListener("click", () => {
      addToCart(btn.dataset.add, 1);
      updateCartBadge();
      btn.textContent = "Agregado ✓";
      setTimeout(() => btn.textContent = "Agregar", 700);
    });
  });
}

[q, cat, sort].forEach(el => {
  el.addEventListener("input", render);
  el.addEventListener("change", render);
});

render();