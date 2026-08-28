ensureSeed();
updateCartBadge();

const invoiceCard = document.querySelector("#invoiceCard");
const printInvoice = document.querySelector("#printInvoice");

const urlParams = new URLSearchParams(location.search);
const orderId = urlParams.get("id");
const orders = LS.get("campusamigo_orders", []);
const order = orderId
  ? orders.find(o => o.id === orderId)
  : LS.get("campusamigo_last_order", null);

// ── Helpers ────────────────────────────────────────────────
function genFolioFiscal(seed) {
  // Simula un UUID tipo SAT a partir del ID del pedido
  const h = s => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) & 0xffffffff, 0)
    .toString(16).padStart(8, "0");
  const parts = [seed.slice(0, 4), seed.slice(-4)];
  return [h(parts[0] + "a"), h(parts[1] + "b"), h(seed + "c"), h(seed + "d"), h(seed + "efgh")]
    .join("-").toUpperCase();
}

function calcIVA(subtotal) {
  return subtotal * 0.16;
}

// ── Sin factura ─────────────────────────────────────────────
if (!order || !order.invoice?.requested) {
  invoiceCard.innerHTML = `
    <div style="padding:32px;text-align:center">
      <p style="font-size:48px;margin:0">🧾</p>
      <h3 style="color:#111827;margin:12px 0 8px">Sin factura para este pedido</h3>
      <p style="color:#6b7280;margin:0">Este pedido no incluyó solicitud de factura.<br>
        Para facturar, activa la opción en el paso de pago.</p>
      <a class="btn" href="perfil.html" style="display:inline-block;margin-top:16px;color:#111827;border-color:#d1d5db">
        Volver al perfil
      </a>
    </div>
  `;
} else {

  // ── Cálculos fiscales ────────────────────────────────────
  const subtotal   = order.total;
  const iva        = calcIVA(subtotal);
  const total      = subtotal + iva;
  const folioFisc  = genFolioFiscal(order.invoice.id + order.id);
  const cadenaOrig = `||1.2|${order.invoice.id}|${order.date}|${order.invoice.rfc}|${money(subtotal).replace("$","")}|MXN||`;

  invoiceCard.innerHTML = `

    <!-- Banda superior de color -->
    <div style="background:linear-gradient(135deg,#d91d64,#24c8db);height:8px;border-radius:14px 14px 0 0;margin:-16px -16px 0"></div>

    <!-- Encabezado -->
    <div class="invoice-header" style="margin-top:20px">
      <div>
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#d91d64,#24c8db);display:flex;align-items:center;justify-content:center">
            <span style="color:#fff;font-weight:900;font-size:16px">C</span>
          </div>
          <div>
            <div style="font-weight:900;font-size:20px;color:#111827">CampusAmigo</div>
            <div style="font-size:12px;color:#6b7280">RFC: CAMP010101AAA</div>
          </div>
        </div>
        <div style="margin-top:8px;font-size:12px;color:#6b7280">
          Campus Universitario, Aguascalientes, Ags.<br>
          contacto@campusamigo.mx
        </div>
      </div>

      <div style="text-align:right">
        <div style="background:#f3f4f6;border-radius:10px;padding:12px 16px;display:inline-block">
          <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.5px">Comprobante Fiscal</div>
          <div style="font-size:22px;font-weight:900;color:#d91d64;margin:2px 0">${order.invoice.id}</div>
          <div style="font-size:12px;color:#6b7280">${order.date}</div>
        </div>
      </div>
    </div>

    <hr style="border-color:#e5e7eb;margin:18px 0"/>

    <!-- Emisor / Receptor -->
    <div class="grid">
      <div style="grid-column:span 6;background:#f9fafb;border-radius:10px;padding:14px">
        <div style="font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">Emisor</div>
        <div style="font-weight:700;color:#111827">CampusAmigo</div>
        <div style="font-size:13px;color:#374151;margin-top:4px">RFC: CAMP010101AAA</div>
        <div style="font-size:13px;color:#374151">Régimen: 601 — Gen. de Ley Personas Morales</div>
      </div>

      <div style="grid-column:span 6;background:#f9fafb;border-radius:10px;padding:14px">
        <div style="font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">Receptor</div>
        <div style="font-weight:700;color:#111827">${order.invoice.name}</div>
        <div style="font-size:13px;color:#374151;margin-top:4px">RFC: ${order.invoice.rfc}</div>
        <div style="font-size:13px;color:#374151">Correo: ${order.invoice.email}</div>
        <div style="font-size:13px;color:#374151">Uso CFDI: ${order.invoice.cfdiUse}</div>
        <div style="font-size:13px;color:#374151">Régimen: ${order.invoice.regime}</div>
      </div>
    </div>

    <hr style="border-color:#e5e7eb;margin:18px 0"/>

    <!-- Folio fiscal -->
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:10px 14px;margin-bottom:18px">
      <div style="font-size:11px;font-weight:700;color:#1d4ed8;text-transform:uppercase;letter-spacing:.5px">Folio Fiscal (UUID simulado)</div>
      <div style="font-size:13px;color:#1e40af;font-family:monospace;margin-top:4px;word-break:break-all">${folioFisc}</div>
    </div>

    <!-- Conceptos -->
    <div style="font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">Conceptos</div>
    <table class="table" style="font-size:14px">
      <thead>
        <tr>
          <th>Descripción</th>
          <th class="right">Cantidad</th>
          <th class="right">Precio unitario</th>
          <th class="right">Importe</th>
        </tr>
      </thead>
      <tbody>
        ${order.items.map(item => `
          <tr>
            <td>
              <div style="font-weight:600;color:#111827">${item.name}</div>
              <div style="font-size:12px;color:#6b7280">Unidad: PZA</div>
            </td>
            <td class="right" style="color:#374151">${item.qty}</td>
            <td class="right" style="color:#374151">${money(item.price)}</td>
            <td class="right" style="font-weight:700;color:#111827">${money(item.subtotal)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>

    <!-- Totales -->
    <div style="display:flex;justify-content:flex-end;margin-top:16px">
      <div style="min-width:280px">
        <div style="display:flex;justify-content:space-between;padding:6px 0;color:#374151;font-size:14px">
          <span>Subtotal</span><span>${money(subtotal)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:6px 0;color:#374151;font-size:14px;border-bottom:1px solid #e5e7eb">
          <span>IVA (16%)</span><span>${money(iva)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:10px 0;font-weight:900;font-size:18px;color:#111827">
          <span>Total</span><span style="color:#d91d64">${money(total)}</span>
        </div>
        <div style="font-size:12px;color:#6b7280">Método de pago: ${order.paymentMethod}</div>
        <div style="font-size:12px;color:#6b7280">Pedido: ${order.id} · Folio: ${order.folio}</div>
      </div>
    </div>

    <hr style="border-color:#e5e7eb;margin:18px 0"/>

    <!-- Sellos digitales -->
    <div style="background:#f9fafb;border-radius:10px;padding:12px 14px">
      <div style="font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">Cadena original del complemento de certificación digital del SAT (simulado)</div>
      <div style="font-size:11px;color:#9ca3af;font-family:monospace;word-break:break-all;line-height:1.6">${cadenaOrig}</div>
    </div>

    <div style="margin-top:12px;background:#f9fafb;border-radius:10px;padding:12px 14px">
      <div style="font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">Sello digital del CFDI (simulado)</div>
      <div style="font-size:11px;color:#9ca3af;font-family:monospace;word-break:break-all;line-height:1.6">CampusAmigo2026/FrontSimulado/NoTieneValidezFiscal/SoloEjercicioEducativo/CFDI/4.0/MXN/</div>
    </div>

    <!-- Pie de factura -->
    <div style="margin-top:16px;text-align:center;font-size:12px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:12px">
      Este documento es una factura simulada generada con fines educativos.<br>
      No tiene validez fiscal ni legal. CampusAmigo © 2026
    </div>
  `;
}

printInvoice?.addEventListener("click", () => {
  const btn = document.querySelector("#printInvoice");
  const msg = document.querySelector("#downloadMsg");

  if (!order || !order.invoice?.requested) return;

  btn.disabled = true;
  btn.textContent = "Descargando...";

  setTimeout(() => {
    btn.textContent = "✓ Descarga completada";
    if (msg) {
      msg.hidden = false;
      msg.textContent = `Factura ${order.invoice.id} descargada correctamente (simulado).`;
    }
  }, 900);
});
