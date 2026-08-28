ensureSeed();
updateCartBadge();

const showcase = document.querySelector("#showcase");

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

function renderShowcase() {
    const items = getProducts().slice(0, 3);

    showcase.innerHTML = items.map(p => {
        const tagClass = p.tag === "Nuevo" ? "new" : (p.tag === "Oferta" ? "sale" : "");
        const tagHtml = p.tag ? `<span class="tag ${tagClass}">${p.tag}</span>` : "";

        return `
      <article class="card product">
        ${productImageHtml(p)}

        <div class="p-body" style="margin-top:10px">
          <div class="p-tag">${tagHtml}</div>
          <h3 class="p-title">${p.name}</h3>

          <div class="p-meta">
            <span class="small">${p.category}</span>
            <span class="price">${money(p.price)}</span>
          </div>

          <div style="margin-top:8px">
            <span class="small">${p.sellerId ? `Vendedor: ${p.sellerName}` : `Tienda CampusAmigo`}</span>
          </div>

          <hr/>

          <div class="p-actions">
            <a class="btn" href="producto.html?id=${encodeURIComponent(p.id)}">Ver detalle</a>
          </div>
        </div>
      </article>
    `;
    }).join("");
}

renderShowcase();