ensureSeed();
updateCartBadge();

const rows = document.querySelector("#rows");
const empty = document.querySelector("#empty");
const sub = document.querySelector("#sub");
const tot = document.querySelector("#tot");
const clearBtn = document.querySelector("#clear");

function render() {
  const cart = getCart();
  const products = getProducts();
  const items = cart.filter((item) => products.some((p) => p.id === item.id));
  document.querySelector("#cartLayout").hidden = items.length === 0;

  if (items.length === 0) {
    empty.hidden = false;
    rows.innerHTML = "";
    sub.textContent = money(0);
    tot.textContent = money(0);
    if (clearBtn) clearBtn.hidden = true;
    updateCartBadge();
    return;
  }

  empty.hidden = true;
  if (clearBtn) clearBtn.hidden = false;

  let subtotal = 0;

  rows.innerHTML = items
    .map((it) => {
      const p = products.find((x) => x.id === it.id);
      if (!p) return "";

      const line = p.price * it.qty;
      subtotal += line;

      const image = UI.safeImage(p.image);
      return `
      <article class="cart-item" role="listitem">
        <div class="cart-thumbnail">${image ? `<img src="${UI.escape(image)}" alt="">` : UI.icon("package")}</div>
        <div class="cart-detail">
          <span class="p-category">${UI.escape(UI.category(p.category))}</span>
          <a href="producto.html?id=${encodeURIComponent(p.id)}"><h3>${UI.escape(p.name)}</h3></a>
          <span class="small">${money(p.price)} por unidad</span>
          <div class="cart-item-actions">
            <div class="quantity-control" aria-label="Cantidad de ${UI.escape(p.name)}">
              <button class="btn" data-dec="${UI.escape(p.id)}" aria-label="Reducir cantidad de ${UI.escape(p.name)}">−</button>
              <span>${it.qty}</span>
              <button class="btn" data-inc="${UI.escape(p.id)}" aria-label="Aumentar cantidad de ${UI.escape(p.name)}" ${it.qty >= 99 ? "disabled" : ""}>+</button>
            </div>
            <button class="remove-item" data-del="${UI.escape(p.id)}" aria-label="Eliminar ${UI.escape(p.name)}">Eliminar</button>
          </div>
        </div>
        <b class="cart-line-total">${money(line)}</b>
      </article>`;
    })
    .join("");

  sub.textContent = money(subtotal);
  tot.textContent = money(subtotal);

  document.querySelectorAll("[data-inc]").forEach((b) => {
    b.addEventListener("click", () => {
      const item = getCart().find((i) => i.id === b.dataset.inc);
      const next = (item ? item.qty : 0) + 1;
      setCartQty(b.dataset.inc, next);
      render();
      document.querySelectorAll("[data-inc]").forEach((el) => {
        if (el.dataset.inc === b.dataset.inc) el.focus();
      });
    });
  });

  document.querySelectorAll("[data-dec]").forEach((b) => {
    b.addEventListener("click", () => {
      const item = getCart().find((i) => i.id === b.dataset.dec);
      const next = (item ? item.qty : 0) - 1;
      setCartQty(b.dataset.dec, next);
      render();
      document.querySelectorAll("[data-dec]").forEach((el) => {
        if (el.dataset.dec === b.dataset.dec) el.focus();
      });
    });
  });

  document.querySelectorAll("[data-del]").forEach((b) => {
    b.addEventListener("click", () => {
      if (confirm("¿Eliminar este producto del carrito?")) {
        removeFromCart(b.dataset.del);
        render();
      }
    });
  });

  updateCartBadge();
}

clearBtn?.addEventListener("click", () => {
  if (confirm("¿Vaciar carrito?")) {
    LS.set(KEYS.cart, []);
    updateCartBadge();
    render();
  }
});

document.querySelector("#pay")?.addEventListener("click", () => {
  const cart = getCart();
  if (!cart.length) {
    alert("Tu carrito está vacío.");
    return;
  }

  location.href = "checkout.html";
});

render();
