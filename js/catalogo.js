ensureSeed();
updateCartBadge();

const list = document.querySelector("#list");
const q = document.querySelector("#q");
const cat = document.querySelector("#cat");
const sort = document.querySelector("#sort");
const count = document.querySelector("#count");
const params = new URLSearchParams(location.search);
q.value = params.get("q") || "";
cat.value = ["electronica", "servicio", "comida"].includes(params.get("cat"))
  ? params.get("cat")
  : "all";
let savedOnly = false;

function render() {
  let items = getProducts();
  const term = q.value.trim().toLocaleLowerCase("es");
  if (term) {
    items = items.filter((p) =>
      [p.name, p.desc, p.sellerName].some((value) =>
        (value || "").toLocaleLowerCase("es").includes(term),
      ),
    );
  }
  if (cat.value !== "all")
    items = items.filter((p) => p.category === cat.value);
  if (savedOnly) {
    const saved = LS.get("campusamigo_favorites", []);
    items = items.filter((p) => saved.includes(p.id));
  }
  if (sort.value === "price_asc") items.sort((a, b) => a.price - b.price);
  if (sort.value === "price_desc") items.sort((a, b) => b.price - a.price);

  const singular = items.length === 1;
  const noun = singular ? "hallazgo" : "hallazgos";
  const state = savedOnly
    ? singular
      ? "guardado"
      : "guardados"
    : singular
      ? "disponible"
      : "disponibles";
  count.textContent = `${items.length} ${noun} ${state}`;
  list.innerHTML = items.map(UI.card).join("");
  UI.bindProducts(list);
  document.querySelector("#catalogEmpty").hidden = items.length > 0;
}

[q, cat, sort].forEach((el) => el.addEventListener("input", render));
document.querySelector("#favoritesOnly").addEventListener("click", (event) => {
  savedOnly = !savedOnly;
  event.currentTarget.setAttribute("aria-pressed", String(savedOnly));
  render();
});
document.querySelector("#resetFilters").addEventListener("click", () => {
  q.value = "";
  cat.value = "all";
  sort.value = "recommended";
  savedOnly = false;
  document
    .querySelector("#favoritesOnly")
    .setAttribute("aria-pressed", "false");
  render();
});
document.addEventListener("favoriteschange", () => {
  if (savedOnly) render();
});
render();
