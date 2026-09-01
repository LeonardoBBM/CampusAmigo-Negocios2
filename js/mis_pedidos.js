ensureSeed();
updateCartBadge();
const u = requireLoginOrRedirect("mis_pedidos.html");
const rows = document.querySelector("#rows");
if (u) {
  const orders = getOrders().filter(
    (o) =>
      o.buyerId === u.id ||
      (o.items || []).some((it) => it.sellerId === u.id) ||
      o.sellerId === u.id,
  );
  rows.innerHTML =
    orders
      .map((o) => {
        const isBuyer = o.buyerId === u.id;
        const name =
          o.items
            ?.map(
              (it) =>
                it.name ||
                getProducts().find((p) => p.id === it.id)?.name ||
                "Producto",
            )
            .join(", ") ||
          o.productName ||
          "Pedido";
        return (
          "<tr><td><b>" +
          UI.escape(name) +
          '</b><div class="small">' +
          UI.escape(o.id) +
          "</div></td><td>" +
          (isBuyer ? "Comprador" : "Vendedor") +
          '</td><td><span class="pill">' +
          UI.escape(o.status) +
          '</span></td><td class="right"><b>' +
          money(o.total ?? o.unitPrice * o.qty) +
          '</b></td><td><a class="btn" href="' +
          (o.customer ? "ticket.html?id=" : "acuerdo.html?orderId=") +
          encodeURIComponent(o.id) +
          '">Ver pedido</a></td></tr>'
        );
      })
      .join("") ||
    '<tr><td colspan="5" class="small">Todavía no tienes pedidos. Explora el catálogo para comenzar.</td></tr>';
}
