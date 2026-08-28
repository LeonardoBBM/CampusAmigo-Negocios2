ensureSeed();
updateCartBadge();

const step1 = document.querySelector("#step1");
const step2 = document.querySelector("#step2");
const step3 = document.querySelector("#step3");

const stepPill1 = document.querySelector("#stepPill1");
const stepPill2 = document.querySelector("#stepPill2");
const stepPill3 = document.querySelector("#stepPill3");

const prevStepBtn = document.querySelector("#prevStep");
const nextStepBtn = document.querySelector("#nextStep");

const checkoutMsg = document.querySelector("#checkoutMsg");
const orderSummary = document.querySelector("#orderSummary");
const orderTotal = document.querySelector("#orderTotal");
const checkoutSummary = document.querySelector("#checkoutSummary");

const paymentMethod = document.querySelector("#paymentMethod");
const cardFields = document.querySelector("#cardFields");
const transferFields = document.querySelector("#transferFields");
const walletFields = document.querySelector("#walletFields");
const wantsInvoice = document.querySelector("#wantsInvoice");
const invoiceFields = document.querySelector("#invoiceFields");

let currentStep = 1;

function getCartItemsDetailed() {
    const cart = getCart();
    const products = getProducts();

    return cart.map(it => {
        const p = products.find(x => x.id === it.id);
        if (!p) return null;
        return {
            id: p.id,
            name: p.name,
            price: p.price,
            qty: it.qty,
            subtotal: p.price * it.qty
        };
    }).filter(Boolean);
}

function getCartTotal() {
    return getCartItemsDetailed().reduce((acc, item) => acc + item.subtotal, 0);
}

function renderOrderSummary() {
    const items = getCartItemsDetailed();
    const total = getCartTotal();

    if (!items.length) {
        orderSummary.innerHTML = `<p class="small">Tu carrito está vacío.</p>`;
        orderTotal.textContent = money(0);
        return;
    }

    orderSummary.innerHTML = items.map(item => `
    <div class="row" style="margin-bottom:8px">
      <span class="small">${item.name} x ${item.qty}</span>
      <b>${money(item.subtotal)}</b>
    </div>
  `).join("");

    orderTotal.textContent = money(total);
}

function renderStep() {
    step1.hidden = currentStep !== 1;
    step2.hidden = currentStep !== 2;
    step3.hidden = currentStep !== 3;

    stepPill1.style.opacity = currentStep === 1 ? "1" : ".6";
    stepPill2.style.opacity = currentStep === 2 ? "1" : ".6";
    stepPill3.style.opacity = currentStep === 3 ? "1" : ".6";

    prevStepBtn.hidden = currentStep === 1;
    nextStepBtn.textContent = currentStep === 3 ? "Pagar" : "Siguiente";

    if (currentStep === 3) {
        const fullName = document.querySelector("#fullName").value.trim();
        const street = document.querySelector("#street").value.trim();
        const city = document.querySelector("#city").value.trim();
        const zip = document.querySelector("#zip").value.trim();

        const methodMap = {
            card: "Tarjeta",
            transfer: "Transferencia",
            wallet: "E-wallet"
        };

        const invoiceSummary = wantsInvoice?.checked ? `
        <hr />
        <div class="row" style="margin-top:8px"><span class="small">Factura</span><b>Sí, al correo ${document.querySelector("#invoiceEmail").value.trim() || "—"}</b></div>
        <div class="row" style="margin-top:8px"><span class="small">RFC</span><b>${document.querySelector("#invoiceRfc").value.trim() || "—"}</b></div>
        <div class="row" style="margin-top:8px"><span class="small">Razón social</span><b>${document.querySelector("#invoiceName").value.trim() || "—"}</b></div>
        ` : `
        <hr />
        <div class="row" style="margin-top:8px"><span class="small">Factura</span><b>No solicitada</b></div>
        `;

        checkoutSummary.innerHTML = `
      <div class="card" style="padding:14px">
        <div class="row"><span class="small">Cliente</span><b>${fullName || "—"}</b></div>
        <div class="row" style="margin-top:8px"><span class="small">Dirección</span><b>${street || "—"}</b></div>
        <div class="row" style="margin-top:8px"><span class="small">Ciudad / CP</span><b>${city || "—"} ${zip || ""}</b></div>
        <div class="row" style="margin-top:8px"><span class="small">Método</span><b>${methodMap[paymentMethod.value]}</b></div>
        ${invoiceSummary}
      </div>
    `;
    }
}

function setMsg(text, danger = false) {
    checkoutMsg.hidden = false;
    checkoutMsg.textContent = text;
    checkoutMsg.classList.toggle("danger", danger);
}

function validateStep1() {
    const fullName = document.querySelector("#fullName").value.trim();
    const street = document.querySelector("#street").value.trim();
    const city = document.querySelector("#city").value.trim();
    const zip = document.querySelector("#zip").value.trim();

    if (!fullName || !street || !city || !zip) {
        setMsg("Completa todos los datos de dirección.", true);
        return false;
    }

    checkoutMsg.hidden = true;
    return true;
}

function togglePaymentFields() {
    const method = paymentMethod.value;
    cardFields.hidden = method !== "card";
    transferFields.hidden = method !== "transfer";
    walletFields.hidden = method !== "wallet";
}

function toggleInvoiceFields() {
    if (!invoiceFields) return;
    invoiceFields.hidden = !wantsInvoice?.checked;
}

function validateInvoiceFields() {
    if (!wantsInvoice?.checked) return true;

    const invoiceName = document.querySelector("#invoiceName").value.trim();
    const invoiceRfc = document.querySelector("#invoiceRfc").value.trim();
    const invoiceEmail = document.querySelector("#invoiceEmail").value.trim();

    if (!invoiceName || !invoiceRfc || !invoiceEmail) {
        setMsg("Completa los datos de facturación o desactiva la opción de factura.", true);
        return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invoiceEmail)) {
        setMsg("Ingresa un correo válido para enviar la factura.", true);
        return false;
    }

    return true;
}

function validateStep2() {
    const method = paymentMethod.value;

    if (method === "card") {
        const cardName = document.querySelector("#cardName").value.trim();
        const cardNumber = document.querySelector("#cardNumber").value.trim();
        const cardDate = document.querySelector("#cardDate").value.trim();
        const cardCvv = document.querySelector("#cardCvv").value.trim();

        if (!cardName || !cardNumber || !cardDate || !cardCvv) {
            setMsg("Completa todos los campos de la tarjeta.", true);
            return false;
        }
    }

    if (!validateInvoiceFields()) return false;

    checkoutMsg.hidden = true;
    return true;
}

function createOrderAndContinue() {
    const items = getCartItemsDetailed();
    const total = getCartTotal();

    if (!items.length) {
        setMsg("No hay productos en el carrito.", true);
        return;
    }

    const orderId = "ORD-" + Date.now().toString().slice(-8);
    const folio = "FOL-" + Math.random().toString(36).slice(2, 8).toUpperCase();
    const now = new Date();

    const methodMap = {
        card: "Tarjeta",
        transfer: "Transferencia",
        wallet: "E-wallet"
    };

    const invoice = wantsInvoice?.checked ? {
        requested: true,
        id: "FAC-" + Date.now().toString().slice(-8),
        name: document.querySelector("#invoiceName").value.trim(),
        rfc: document.querySelector("#invoiceRfc").value.trim().toUpperCase(),
        email: document.querySelector("#invoiceEmail").value.trim(),
        cfdiUse: document.querySelector("#invoiceUse").value,
        regime: document.querySelector("#invoiceRegime").value,
        status: "Factura generada"
    } : { requested: false, status: "No solicitada" };

    const order = {
        id: orderId,
        folio,
        date: now.toLocaleString(),
        customer: {
            fullName: document.querySelector("#fullName").value.trim(),
            street: document.querySelector("#street").value.trim(),
            city: document.querySelector("#city").value.trim(),
            zip: document.querySelector("#zip").value.trim()
        },
        paymentMethod: methodMap[paymentMethod.value],
        items,
        total,
        invoice,
        status: "Pago aprobado"
    };

    const orders = LS.get("campusamigo_orders", []);
    orders.unshift(order);
    LS.set("campusamigo_orders", orders);
    LS.set("campusamigo_last_order", order);

    LS.set(KEYS.cart, []);
    updateCartBadge();

    location.href = "confirmacion.html";
}

paymentMethod?.addEventListener("change", togglePaymentFields);
wantsInvoice?.addEventListener("change", toggleInvoiceFields);

prevStepBtn?.addEventListener("click", () => {
    if (currentStep > 1) {
        currentStep--;
        renderStep();
    }
});

nextStepBtn?.addEventListener("click", () => {
    if (currentStep === 1) {
        if (!validateStep1()) return;
        currentStep = 2;
        renderStep();
        return;
    }

    if (currentStep === 2) {
        if (!validateStep2()) return;
        currentStep = 3;
        renderStep();
        return;
    }

    if (currentStep === 3) {
        createOrderAndContinue();
    }
});

renderOrderSummary();
togglePaymentFields();
toggleInvoiceFields();
renderStep();