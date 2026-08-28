ensureSeed();
updateCartBadge();

const u = requireLoginOrRedirect(location.pathname + location.search);
if (!u) { }

const orderId = getParam("orderId");
const info = document.querySelector("#info");
const state = document.querySelector("#state");
const point = document.querySelector("#point");
const dt = document.querySelector("#dt");
const msg = document.querySelector("#msg");

function setMsg(text, danger = false) {
    msg.hidden = false;
    msg.textContent = text;
    msg.classList.toggle("danger", danger);
    setTimeout(() => msg.hidden = true, 1300);
}

function toDatetimeLocalValue(iso) {
    const d = new Date(iso);
    const pad = n => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function loadOrder() {
    const o = getOrders().find(x => x.id === orderId);

    if (!o) {
        info.innerHTML = `<b>Pedido no encontrado.</b>`;
        state.classList.add("danger");
        state.textContent = "Pedido inválido.";
        return null;
    }

    // Permisos
    if (u.id !== o.buyerId && u.id !== o.sellerId) {
        alert("No tienes permiso para ver este pedido.");
        location.href = "mis_pedidos.html";
        return null;
    }

    info.innerHTML = `
    <div><b>${o.productName}</b></div>
    <div>Vendedor: <b>${o.sellerName}</b></div>
    <div>Comprador: <b>${o.buyerName}</b></div>
    <div>Cantidad: <b>${o.qty}</b> | Precio: <b>${money(o.unitPrice)}</b></div>
    <div>Total: <b>${money(o.unitPrice * o.qty)}</b></div>
    <div class="small">ID: ${o.id}</div>
  `;

    // Estado + meetup
    const meetupText = o.meetup
        ? `Entrega propuesta: ${o.meetup.pointName} — ${new Date(o.meetup.dateTimeISO).toLocaleString()}`
        : `Sin propuesta aún.`;

    state.classList.remove("danger");
    state.textContent = `Estado: ${o.status} — ${meetupText}`;

    // Cargar puntos
    point.innerHTML = MEETUP_POINTS.map(p => `<option value="${p.id}">${p.name}</option>`).join("");

    if (o.meetup) {
        point.value = o.meetup.pointId;
        dt.value = toDatetimeLocalValue(o.meetup.dateTimeISO);
    } else {
        dt.value = "";
    }

    // Reglas de botones
    document.querySelector("#accept").disabled = (o.status !== "proposed");
    document.querySelector("#delivered").disabled = (u.id !== o.sellerId || o.status !== "agreed");

    return o;
}

document.querySelector("#propose").addEventListener("click", () => {
    if (!dt.value) return setMsg("Elige fecha y hora.", true);

    const iso = new Date(dt.value).toISOString();
    const r = proposeMeetup(orderId, point.value, iso);

    if (!r.ok) return setMsg(r.msg, true);

    setMsg("Propuesta enviada.");
    loadOrder();
});

document.querySelector("#accept").addEventListener("click", () => {
    const r = acceptMeetup(orderId);
    if (!r.ok) return setMsg(r.msg, true);

    setMsg("Propuesta aceptada.");
    loadOrder();
});

document.querySelector("#cancel").addEventListener("click", () => {
    if (!confirm("¿Cancelar este pedido?")) return;

    const r = cancelOrder(orderId);
    if (!r.ok) return setMsg(r.msg, true);

    setMsg("Pedido cancelado.");
    loadOrder();
});

document.querySelector("#delivered").addEventListener("click", () => {
    const r = markDelivered(orderId);
    if (!r.ok) return setMsg(r.msg, true);

    setMsg("Marcado como entregado.");
    loadOrder();
});

loadOrder();