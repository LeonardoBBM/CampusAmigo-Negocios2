// Puntos de entrega sugeridos (ajústalos a tu campus)
const MEETUP_POINTS = [
    { id: "p_biblio", name: "Biblioteca (entrada)" },
    { id: "p_cafe", name: "Cafetería" },
    { id: "p_entrada", name: "Entrada principal" },
    { id: "p_labs", name: "Centro de Computo" },
    { id: "p_canchas", name: "Gradas de la alberca" }
];

function requireLoginOrRedirect(backUrl) {
    const u = currentUser?.();
    if (u) return u;
    alert("Necesitas iniciar sesión para continuar.");
    setRedirectAfterLogin(backUrl);
    location.href = "login.html";
    return null;
}

function createOrder({ productId, qty }) {
    const user = currentUser();
    const products = getProducts();
    const p = products.find(x => x.id === productId);
    if (!p) return { ok: false, msg: "Producto no encontrado." };

    if (p.sellerId && p.sellerId === user.id) {
        return { ok: false, msg: "No puedes solicitar tu propio producto." };
    }

    const orders = getOrders();
    const id = "o_" + Date.now().toString(36) + Math.random().toString(16).slice(2, 6);

    orders.unshift({
        id,
        productId: p.id,
        productName: p.name,
        unitPrice: p.price,
        qty: Math.max(1, Number(qty || 1)),
        buyerId: user.id,
        buyerName: user.name,
        sellerId: p.sellerId || "system",
        sellerName: p.sellerName || "CampusAmigo",
        status: "pending", // pending -> proposed -> agreed -> delivered/cancelled
        meetup: null,      // {pointId, pointName, dateTimeISO}
        createdAt: new Date().toISOString()
    });

    saveOrders(orders);
    return { ok: true, orderId: id };
}

function proposeMeetup(orderId, pointId, dateTimeISO) {
    const orders = getOrders();
    const o = orders.find(x => x.id === orderId);
    if (!o) return { ok: false, msg: "Pedido no encontrado." };

    const u = currentUser();
    // Solo comprador o vendedor pueden proponer
    if (u.id !== o.buyerId && u.id !== o.sellerId) return { ok: false, msg: "Sin permisos." };

    const point = MEETUP_POINTS.find(p => p.id === pointId);
    if (!point) return { ok: false, msg: "Punto inválido." };
    if (!dateTimeISO) return { ok: false, msg: "Fecha/hora inválida." };

    o.meetup = { pointId, pointName: point.name, dateTimeISO };
    o.status = "proposed";
    saveOrders(orders);
    return { ok: true };
}

function acceptMeetup(orderId) {
    const orders = getOrders();
    const o = orders.find(x => x.id === orderId);
    if (!o) return { ok: false, msg: "Pedido no encontrado." };

    const u = currentUser();
    // Regla: solo el otro lado acepta. Si comprador propuso, vendedor acepta; y viceversa.
    if (o.status !== "proposed") return { ok: false, msg: "No hay propuesta por aceptar." };
    if (u.id !== o.buyerId && u.id !== o.sellerId) return { ok: false, msg: "Sin permisos." };

    o.status = "agreed";
    saveOrders(orders);
    return { ok: true };
}

function cancelOrder(orderId) {
    const orders = getOrders();
    const o = orders.find(x => x.id === orderId);
    if (!o) return { ok: false, msg: "Pedido no encontrado." };

    const u = currentUser();
    if (u.id !== o.buyerId && u.id !== o.sellerId) return { ok: false, msg: "Sin permisos." };

    o.status = "cancelled";
    saveOrders(orders);
    return { ok: true };
}

function markDelivered(orderId) {
    const orders = getOrders();
    const o = orders.find(x => x.id === orderId);
    if (!o) return { ok: false, msg: "Pedido no encontrado." };

    const u = currentUser();
    // Regla: solo vendedor marca entregado
    if (u.id !== o.sellerId) return { ok: false, msg: "Solo el vendedor puede marcar entregado." };

    o.status = "delivered";
    saveOrders(orders);
    return { ok: true };
}