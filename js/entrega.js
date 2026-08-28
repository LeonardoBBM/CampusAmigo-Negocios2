ensureSeed();
updateCartBadge();

const u = (typeof currentUser === "function") ? currentUser() : null;
if (!u) {
    alert("Necesitas iniciar sesión.");
    setRedirectAfterLogin("entrega.html");
    location.href = "login.html";
}

const point = document.querySelector("#point");
const otherWrap = document.querySelector("#otherWrap");
const otherPoint = document.querySelector("#otherPoint");
const dateEl = document.querySelector("#date");
const timeEl = document.querySelector("#time");
const noteEl = document.querySelector("#note");
const confirmBtn = document.querySelector("#confirm");
const msg = document.querySelector("#msg");
const summary = document.querySelector("#summary");
const totalEl = document.querySelector("#total");

function setMsg(text, danger = false) {
    msg.hidden = false;
    msg.textContent = text;
    msg.classList.toggle("danger", danger);
}

function getOrders() { return LS.get("campusamigo_orders", []); }
function saveOrders(o) { LS.set("campusamigo_orders", o); }

function renderSummary() {
    const cart = getCart();
    const products = getProducts();
    let total = 0;

    summary.innerHTML = cart.map(it => {
        const p = products.find(x => x.id === it.id);
        if (!p) return "";
        const line = p.price * it.qty;
        total += line;
        return `
      <div class="row" style="margin:8px 0">
        <span class="small">${p.name} × ${it.qty}</span>
        <b>${money(line)}</b>
      </div>
    `;
    }).join("");

    totalEl.textContent = money(total);
}

point.addEventListener("change", () => {
    otherWrap.style.display = point.value === "Otro" ? "block" : "none";
});

confirmBtn.addEventListener("click", () => {
    const cart = getCart();
    if (!cart.length) {
        setMsg("Tu carrito está vacío.", true);
        return;
    }

    let deliveryPoint = point.value;
    if (deliveryPoint === "Otro") {
        deliveryPoint = otherPoint.value.trim();
        if (!deliveryPoint) {
            setMsg("Especifica el punto de entrega.", true);
            return;
        }
    }

    const date = dateEl.value;
    const time = timeEl.value;
    if (!date || !time) {
        setMsg("Selecciona fecha y hora.", true);
        return;
    }

    const orders = getOrders();
    const id = "o_" + Date.now().toString(36) + Math.random().toString(16).slice(2, 6);

    orders.unshift({
        id,
        buyerId: u.id,
        buyerName: u.name,
        items: cart,
        delivery: { point: deliveryPoint, date, time, note: (noteEl.value || "").trim() },
        status: "Pendiente",
        createdAt: new Date().toISOString()
    });

    saveOrders(orders);

    // Limpia carrito
    LS.set(KEYS.cart, []);
    updateCartBadge();

    // Limpia draft si existe
    localStorage.removeItem("campusamigo_checkout_draft");

    alert("Pedido creado. Ahora puedes verlo en 'Mis pedidos'.");
    location.href = "index.html";
});

renderSummary();