ensureSeed();
updateCartBadge();

const confirmSummary = document.querySelector("#confirmSummary");
const order = LS.get("campusamigo_last_order", null);
const viewInvoice = document.querySelector("#viewInvoice");
const downloadInvoice = document.querySelector("#downloadInvoice");
const emailInvoice = document.querySelector("#emailInvoice");
const invoiceActionMsg = document.querySelector("#invoiceActionMsg");

if (!order) {
    confirmSummary.innerHTML = `
    <div class="notice danger" style="margin-top:12px">
      No se encontró una compra reciente.
    </div>
  `;
} else {
    confirmSummary.innerHTML = `
    <div class="card" style="padding:14px">
      <div class="row"><span class="small">Pedido</span><b>${order.id}</b></div>
      <div class="row" style="margin-top:8px"><span class="small">Folio</span><b>${order.folio}</b></div>
      <div class="row" style="margin-top:8px"><span class="small">Fecha</span><b>${order.date}</b></div>
      <div class="row" style="margin-top:8px"><span class="small">Método</span><b>${order.paymentMethod}</b></div>
      <div class="row" style="margin-top:8px"><span class="small">Total</span><b>${money(order.total)}</b></div>
      <div class="row" style="margin-top:8px"><span class="small">Factura</span><b>${order.invoice?.requested ? order.invoice.id : "No solicitada"}</b></div>
    </div>

    <div style="margin-top:16px">
      <h3>Resumen</h3>
      ${order.items.map(item => `
        <div class="row" style="margin-top:8px">
          <span class="small">${item.name} x ${item.qty}</span>
          <b>${money(item.subtotal)}</b>
        </div>
      `).join("")}
    </div>
  `;
}

function setInvoiceMsg(text, danger = false) {
    if (!invoiceActionMsg) return;
    invoiceActionMsg.hidden = false;
    invoiceActionMsg.textContent = text;
    invoiceActionMsg.classList.toggle("danger", danger);
}

function syncInvoiceActions() {
    const hasInvoice = Boolean(order?.invoice?.requested);
    if (viewInvoice) viewInvoice.hidden = !hasInvoice;
    if (downloadInvoice) downloadInvoice.hidden = !hasInvoice;
    if (emailInvoice) emailInvoice.hidden = !hasInvoice;
}

downloadInvoice?.addEventListener("click", () => {
    if (!order?.invoice?.requested) return setInvoiceMsg("Este pedido no solicitó factura.", true);
    const lines = [
        "CampusAmigo - Factura simulada",
        `Factura: ${order.invoice.id}`,
        `Pedido: ${order.id}`,
        `Cliente fiscal: ${order.invoice.name}`,
        `RFC: ${order.invoice.rfc}`,
        `Uso CFDI: ${order.invoice.cfdiUse}`,
        `Régimen: ${order.invoice.regime}`,
        `Total: ${money(order.total)}`
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${order.invoice.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setInvoiceMsg("Factura descargada correctamente.");
});

emailInvoice?.addEventListener("click", () => {
    if (!order?.invoice?.requested) return setInvoiceMsg("Este pedido no solicitó factura.", true);
    setInvoiceMsg(`Factura enviada de forma simulada a ${order.invoice.email}.`);
});

syncInvoiceActions();
