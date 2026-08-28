ensureSeed();
updateCartBadge();

const u = requireLoginOrRedirect("mis_pedidos.html");
if (!u) { }

const rows = document.querySelector("#rows");

function render() {
    const orders = getOrders().filter(o => o.buyerId === u.id || o.sellerId === u.id);

    rows.innerHTML = orders.map(o => {
        const role = (o.buyerId === u.id) ? "Comprador" : "Vendedor";
        const total = o.unitPrice * o.qty;

        return `
      <tr>
        <td><b>${o.productName}</b><div class="small">${o.sellerName} ↔ ${o.buyerName}</div></td>
        <td>${role}</td>
        <td><span class="pill">${o.status}</span></td>
        <td class="right"><b>${money(total)}</b></td>
        <td class="right">
          <a class="btn" href="acuerdo.html?orderId=${encodeURIComponent(o.id)}">Ver</a>
        </td>
      </tr>
    `;
    }).join("") || `<tr><td colspan="5" class="small">No tienes pedidos aún.</td></tr>`;
}

render();