ensureSeed();
updateCartBadge();

const btn = document.querySelector("#communityBtn");
const msg = document.querySelector("#communityMsg");
const user = document.querySelector("#communityUser");
const text = document.querySelector("#communityText");

btn?.addEventListener("click", () => {
    const u = (user.value || "").trim();
    const t = (text.value || "").trim();

    msg.hidden = false;
    msg.classList.remove("danger");

    if (!u || !t) {
        msg.classList.add("danger");
        msg.textContent = "Escribe tu nombre y comentario.";
        return;
    }

    user.value = "";
    text.value = "";
    msg.textContent = "Comentario enviado (simulado).";
});