ensureSeed();
updateCartBadge();

const auctionMedia = document.querySelector("#auctionMedia");
const auctionTitle = document.querySelector("#auctionTitle");
const auctionDesc = document.querySelector("#auctionDesc");
const auctionSeller = document.querySelector("#auctionSeller");
const auctionTimer = document.querySelector("#auctionTimer");
const currentBid = document.querySelector("#currentBid");
const nextBid = document.querySelector("#nextBid");
const bidder = document.querySelector("#bidder");
const bidAmount = document.querySelector("#bidAmount");
const bidBtn = document.querySelector("#bidBtn");
const bidMsg = document.querySelector("#bidMsg");
const bidRows = document.querySelector("#bidRows");

const auction = {
    title: "Laptop gamer usada",
    desc: "Equipo seminuevo en muy buen estado. Ideal para diseño, programación o gaming casual.",
    seller: "Usuario Demo",
    image: "assets/img/laptop.jpg",
    currentBid: 5400,
    timer: 2 * 60 * 60 + 15 * 60 + 40,
    bids: [
        { user: "Carlos", amount: 5000, time: "10:05" },
        { user: "Andrea", amount: 5200, time: "10:18" },
        { user: "Mario", amount: 5400, time: "10:31" }
    ]
};

function formatTimer(totalSeconds) {
    const s = Math.max(0, Number(totalSeconds) || 0);
    const hrs = String(Math.floor(s / 3600)).padStart(2, "0");
    const mins = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const secs = String(s % 60).padStart(2, "0");
    return `${hrs}:${mins}:${secs}`;
}

function renderAuction() {
    auctionTitle.textContent = auction.title;
    auctionDesc.textContent = auction.desc;
    auctionSeller.textContent = auction.seller;
    auctionTimer.textContent = formatTimer(auction.timer);
    currentBid.textContent = money(auction.currentBid);
    nextBid.textContent = money(auction.currentBid + 100);

    if (auction.image) {
        auctionMedia.innerHTML = `
      <img src="${auction.image}" alt="${auction.title}"
        onerror="this.parentElement.innerHTML='<div class=&quot;prod-fallback&quot;>Subasta</div>'">
    `;
    } else {
        auctionMedia.innerHTML = `<div class="prod-fallback">Subasta</div>`;
    }

    bidRows.innerHTML = auction.bids
        .slice()
        .reverse()
        .map(b => `
      <tr>
        <td>${b.user}</td>
        <td class="right"><b>${money(b.amount)}</b></td>
        <td class="right">${b.time}</td>
      </tr>
    `).join("");
}

function setMsg(text, danger = false) {
    bidMsg.hidden = false;
    bidMsg.textContent = text;
    bidMsg.classList.toggle("danger", danger);
}

bidBtn?.addEventListener("click", () => {
    const user = bidder.value.trim();
    const amount = Number(bidAmount.value);

    if (!user) {
        setMsg("Escribe el nombre del usuario.", true);
        return;
    }

    if (!Number.isFinite(amount) || amount < auction.currentBid + 100) {
        setMsg(`La oferta mínima debe ser de ${money(auction.currentBid + 100)}.`, true);
        return;
    }

    bidder.value = "";
    bidAmount.value = "";
    setMsg("Oferta registrada.");
});

setInterval(() => {
    auction.timer = Math.max(0, auction.timer - 1);
    auctionTimer.textContent = formatTimer(auction.timer);
}, 1000);

renderAuction();