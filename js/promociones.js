ensureSeed();
updateCartBadge();

const input = document.querySelector("#promoCode");
const btn = document.querySelector("#applyPromo");
const msg = document.querySelector("#promoMsg");

btn?.addEventListener("click", () => {
    const code = (input.value || "").trim().toUpperCase();

    msg.hidden = false;
    msg.classList.remove("danger");

    if (!code) {
        msg.classList.add("danger");
        msg.textContent = "Escribe un código promocional.";
        return;
    }

    if (code === "TEC10" || code === "DULCE2X1") {
        msg.textContent = `Código aplicado (simulado): ${code}`;
    } else {
        msg.classList.add("danger");
        msg.textContent = "Código inválido o no disponible.";
    }
});