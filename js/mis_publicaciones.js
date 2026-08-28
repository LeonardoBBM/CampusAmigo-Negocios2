ensureSeed();
updateCartBadge();

const u = requireLoginOrRedirect("mis_publicaciones.html");
if (!u) { }

const rows = document.querySelector("#rows");
const empty = document.querySelector("#empty");

function deleteProduct(productId) {
  const products = getProducts();
  const product = products.find(p => p.id === productId);

  if (!product) return;

  // Seguridad: solo dueño puede borrar
  if (product.sellerId !== u.id) {
    alert("No puedes eliminar una publicación que no es tuya.");
    return;
  }

  if (!confirm("¿Eliminar esta publicación? Esta acción no se puede deshacer.")) return;

  const updated = products.filter(p => p.id !== productId);
  saveProducts(updated);

  render();
}

function render() {
  const products = getProducts().filter(p => p.sellerId === u.id);

  if (products.length === 0) {
    rows.innerHTML = "";
    empty.hidden = false;
    return;
  }

  empty.hidden = true;

  rows.innerHTML = products.map(p => `
    <tr>
      <td>
        <b>${p.name}</b>
        <div class="small">${(p.desc || "").slice(0, 80)}</div>
      </td>
      <td>${p.category}</td>
      <td class="right"><b>${money(p.price)}</b></td>
      <td class="right" style="white-space:nowrap">
        <a class="btn" href="producto.html?id=${encodeURIComponent(p.id)}">Ver</a>
        <button class="btn danger" data-del="${p.id}">Eliminar</button>
      </td>
    </tr>
  `).join("");

  // Activar botones eliminar
  document.querySelectorAll("[data-del]").forEach(btn => {
    btn.addEventListener("click", () => {
      deleteProduct(btn.dataset.del);
    });
  });
}

render();