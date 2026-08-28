const LS = {
  get(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  },
  set(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
};

const KEYS = {
  products: "campusamigo_products",
  cart:     "campusamigo_cart",
  users:    "campusamigo_users",
  session:  "campusamigo_session",
  orders:   "campusamigo_orders"
};

function money(n) { return "$" + Number(n).toFixed(2); }

function ensureSeed() {
  const existing = LS.get(KEYS.products, null);
  if (!existing || !Array.isArray(existing) || existing.length === 0) {
    LS.set(KEYS.products, window.SEED_PRODUCTS ?? []);
  }
  if (!LS.get(KEYS.cart,   null)) LS.set(KEYS.cart,   []);
  if (!LS.get(KEYS.users,  null)) LS.set(KEYS.users,  []);
  if (!LS.get(KEYS.orders, null)) LS.set(KEYS.orders, []);
}

// ── Productos ──────────────────────────────────────────────
function getProducts()    { return LS.get(KEYS.products, []); }
function saveProducts(p)  { LS.set(KEYS.products, p); }

// ── Usuarios ───────────────────────────────────────────────
function getUsers()       { return LS.get(KEYS.users, []); }
function saveUsers(u)     { LS.set(KEYS.users, u); }

// ── Sesión ─────────────────────────────────────────────────
/**
 * Devuelve el objeto del usuario activo  { id, name, email, role }
 * o null si no hay sesión.
 */
function currentUser() {
  return LS.get(KEYS.session, null);
}

/**
 * Guarda la URL a la que redirigir después del login.
 */
function setRedirectAfterLogin(url) {
  LS.set("campusamigo_redirect", url);
}

/**
 * Lee y borra la URL de redirección post-login.
 * @returns {string|null}
 */
function _getRedirectAfterLogin() {
  const url = LS.get("campusamigo_redirect", null);
  localStorage.removeItem("campusamigo_redirect");
  return url;
}

// ── Carrito ────────────────────────────────────────────────
function getCart() {
  const cart = LS.get(KEYS.cart, []);
  return Array.isArray(cart) ? cart : [];
}
function saveCart(c) { LS.set(KEYS.cart, c); }

function cartCount() {
  return getCart().reduce((acc, it) => acc + it.qty, 0);
}

function updateCartBadge() {
  const safeCart = getCart();
  const total = safeCart.reduce((sum, item) => {
    const q = Number(item?.qty);
    return sum + (Number.isFinite(q) && q > 0 ? q : 0);
  }, 0);
  document.querySelectorAll("[data-cart-count]").forEach(el => {
    el.textContent = total;
  });
}

function addToCart(productId, qty) {
  qty = Math.max(1, Number(qty || 1));
  const cart = getCart();
  const found = cart.find(i => i.id === productId);
  if (found) found.qty += qty;
  else cart.push({ id: productId, qty });
  saveCart(cart);
  updateCartBadge();
}

function removeFromCart(id) {
  LS.set(KEYS.cart, getCart().filter(it => it.id !== id));
}

function setCartQty(id, qty) {
  const q = Number(qty);
  const cleaned = getCart()
    .map(it => it.id === id ? { ...it, qty: q } : it)
    .filter(it => Number(it.qty) > 0);
  LS.set(KEYS.cart, cleaned);
}

// ── Pedidos ────────────────────────────────────────────────
function getOrders()      { return LS.get(KEYS.orders, []); }
function saveOrders(o)    { LS.set(KEYS.orders, o); }

// ── Utils ──────────────────────────────────────────────────
function getParam(name) {
  return new URL(window.location.href).searchParams.get(name);
}

// Nav toggle (fallback — nav.js lo maneja también)
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector("#nav-toggle");
  const nav    = document.querySelector(".nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => nav.classList.toggle("open"));
  }
});
