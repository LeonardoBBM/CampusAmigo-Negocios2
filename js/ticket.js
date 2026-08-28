ensureSeed();
updateCartBadge();

const ticketCard = document.querySelector("#ticketCard");
const ticketMsg = document.querySelector("#ticketMsg");
const downloadBtn = document.querySelector("#downloadTicket");

const urlParams = new URLSearchParams(location.search);
const orderId = urlParams.get("id");

const orders = LS.get("campusamigo_orders", []);
let order = null;

if (orderId) {
    order = orders.find(o => o.id === orderId) || null;
} else {
    order = LS.get("campusamigo_last_order", null);
}

if (!order) {
    ticketCard.innerHTML = `
    <div class="notice danger">
      No se encontró el comprobante solicitado.
    </div>
  `;
} else {
    ticketCard.innerHTML = `
    <div style="text-align:center; margin-bottom:18px">
      <h2 style="margin:0 0 8px">CampusAmigo</h2>
      <p class="small" style="margin:0">Comprobante de compra</p>
    </div>

    <div class="row"><span class="small">Folio</span><b>${order.folio}</b></div>
    <div class="row" style="margin-top:8px"><span class="small">Pedido</span><b>${order.id}</b></div>
    <div class="row" style="margin-top:8px"><span class="small">Fecha</span><b>${order.date}</b></div>

    <hr />

    <h3>Datos del cliente</h3>
    <div class="row"><span class="small">Nombre</span><b>${order.customer.fullName}</b></div>
    <div class="row" style="margin-top:8px"><span class="small">Dirección</span><b>${order.customer.street}</b></div>
    <div class="row" style="margin-top:8px"><span class="small">Ciudad / CP</span><b>${order.customer.city} ${order.customer.zip}</b></div>
    <div class="row" style="margin-top:8px"><span class="small">Método de pago</span><b>${order.paymentMethod}</b></div>

    <hr />

    <h3>Detalle</h3>
    <table class="table" style="margin-top:10px">
      <thead>
        <tr>
          <th>Producto</th>
          <th class="right">Cantidad</th>
          <th class="right">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${order.items.map(item => `
          <tr>
            <td>${item.name}</td>
            <td class="right">${item.qty}</td>
            <td class="right">${money(item.subtotal)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>

    <hr />

    <div class="row"><span class="small">Estado</span><b>${order.status}</b></div>
    <div class="row" style="margin-top:8px"><span class="small">Total</span><b>${money(order.total)}</b></div>
  `;
}

downloadBtn?.addEventListener("click", () => {
    ticketMsg.hidden = false;
    ticketMsg.classList.remove("danger");
    ticketMsg.textContent = "Descarga completada.";
});