/* =========================================================
   checkout.js  |  Franchesca Estilos
   Modal "Datos de entrega" que reemplaza al botón de WhatsApp.
   Colócalo DESPUÉS de main.js:
   <script src="js/main.js"></script>
   <script src="js/checkout.js"></script>
   ========================================================= */
(function () {
  'use strict';

  /* ---------- CONFIGURACIÓN (edita aquí) ---------- */
  const CONFIG = {
    whatsapp: '51944737700',
    pagoNumero: '944 737 700',          // número de Yape / Plin
    pagoTitular: 'Franchesca Estilos',
    yapeQR: 'img/yape-qr.png',          // ruta de tu QR de Yape (o '' para ocultar)
    plinQR: 'img/plin-qr.png',          // ruta de tu QR de Plin (o '' para ocultar)
    transferencia: [                    // datos para transferencia
      'Banco: BCP',
      'Cuenta: 000-00000000-0-00',
      'CCI: 002-000-000000000000-00',
      'Titular: Franchesca Estilos'
    ],
    envio: { delivery: 0, recojo: 0, agencia: 0 }, // costo de envío por tipo (S/)
    maxArchivoMB: 5,
    // Si tienes un backend, pon aquí una función async que reciba (pedido, archivo)
    // y devuelva true. Si es null, se abre WhatsApp con el resumen del pedido.
    enviarABackend: null
  };

  // Los estilos ahora están en css/checkout.css (enlázalo en el <head> de catalogo.html)


  /* ---------- HTML DEL MODAL ---------- */
  const overlay = document.createElement('div');
  overlay.className = 'ck-overlay';
  overlay.id = 'ck-overlay';
  overlay.innerHTML = `
  <div class="ck-box ck" role="dialog" aria-modal="true" aria-labelledby="ck-title">
    <button class="ck-close" type="button" aria-label="Cerrar" id="ck-close">&times;</button>
    <h3 class="ck-title" id="ck-title">Datos de entrega</h3>
    <form id="ck-form" novalidate>
    <div class="ck-grid"><div class="ck-col">
      <div class="ck-field">
        <label class="ck-label" for="ck-nombre">Nombre completo *</label>
        <input class="ck-input" id="ck-nombre" placeholder="Ej. María Pérez" autocomplete="name">
      </div>
      <div class="ck-row">
        <div class="ck-field">
          <label class="ck-label" for="ck-celular">Celular *</label>
          <input class="ck-input" id="ck-celular" type="tel" inputmode="numeric" maxlength="9" placeholder="Ej. 987654321" autocomplete="tel">
        </div>
        <div class="ck-field">
          <label class="ck-label" for="ck-tipo">Tipo de entrega *</label>
          <select class="ck-select" id="ck-tipo">
            <option value="delivery">Delivery</option>
            <option value="recojo">Recojo en tienda</option>
            <option value="agencia">Envío por agencia</option>
          </select>
        </div>
      </div>
      <div class="ck-field" id="ck-dir-wrap">
        <label class="ck-label" for="ck-direccion" id="ck-dir-label">Dirección de entrega *</label>
        <input class="ck-input" id="ck-direccion" placeholder="Ej. Av. Arenales 245, Jesús María" autocomplete="street-address">
      </div>
      <div class="ck-field">
        <label class="ck-label" for="ck-referencia">Referencia (opcional)</label>
        <input class="ck-input" id="ck-referencia" placeholder="Ej. Frente al banco, puerta azul">
      </div>
      <div class="ck-field">
        <label class="ck-label" for="ck-obs">Observaciones (opcional)</label>
        <textarea class="ck-textarea" id="ck-obs" placeholder="Ej. Talla M, color negro, tocar timbre."></textarea>
      </div>

    </div><div class="ck-col">
      <div class="ck-pay-head">
        <h4>Método de pago</h4>
        <div class="ck-total">
          <small>Total a pagar</small>
          <strong id="ck-total">S/ 0.00</strong>
          <small id="ck-envio-note"></small>
        </div>
      </div>

      <div class="ck-methods" id="ck-methods">
        <label><input type="radio" name="ck-pago" value="Yape" checked> Yape</label>
        <label><input type="radio" name="ck-pago" value="Plin"> Plin</label>
        <label><input type="radio" name="ck-pago" value="Transferencia"> Transferencia</label>
      </div>

      <div class="ck-pay-panel" id="ck-pay-panel"></div>

      <div class="ck-field">
        <label class="ck-label">Comprobante de pago *</label>
        <label class="ck-file" for="ck-comprobante">
          <span id="ck-file-text">📎 Toca para adjuntar captura o PDF</span>
          <input type="file" id="ck-comprobante" accept="image/*,application/pdf">
          <img id="ck-file-preview" class="ck-hide" alt="Vista previa del comprobante">
        </label>
      </div>

      <p class="ck-msg" id="ck-msg"></p>
      <button class="ck-submit" type="submit" id="ck-submit">Confirmar pedido</button>
    </div></div>
    </form>
  </div>`;
  document.body.appendChild(overlay);

  const $ = (id) => document.getElementById(id);
  let items = [];
  let origen = 'cart';

  /* ---------- LECTURA DEL CARRITO ---------- */
  // Tu main.js guarda el carrito como un array de productos (let cart = []).
  // Si el mismo producto se agregó varias veces, se agrupa y se cuenta como cantidad.
  function parsePrice(v) {
    return parseFloat(String(v == null ? '' : v).replace(/[^\d.]/g, '')) || 0;
  }

  function readCart() {
    let c = [];
    try { c = cart; } catch (e) {}
    const map = new Map();
      c.forEach((p) => {
      const key = (p.id != null ? p.id : p.name) + '|' + (p.color || '') + '|' + (p.size || '');
      if (map.has(key)) map.get(key).qty++;
      else map.set(key, { name: p.name, category: p.category || '', price: parsePrice(p.price), qty: 1, size: p.size || '', color: p.color || '' });
    });
    return Array.from(map.values());
  }

  /* ---------- CÁLCULOS ---------- */
  const money = (n) => 'S/ ' + n.toFixed(2);
  const subtotal = () => items.reduce((s, i) => s + i.price * i.qty, 0);
  const preciosCompletos = () => items.length && items.every((i) => i.price > 0);
  const costoEnvio = () => CONFIG.envio[$('ck-tipo').value] || 0;

  function refreshTotal() {
    const envio = costoEnvio();
    $('ck-total').textContent = preciosCompletos() ? money(subtotal() + envio) : 'A confirmar';
    $('ck-envio-note').textContent = envio ? 'Incluye ' + money(envio) + ' de envío' : '';
  }

  /* ---------- PANEL DE PAGO ---------- */
  function refreshPayPanel() {
    const metodo = document.querySelector('input[name="ck-pago"]:checked').value;
    const panel = $('ck-pay-panel');
    if (metodo === 'Transferencia') {
      panel.innerHTML = '<div class="ck-bank">' + CONFIG.transferencia.map((l) => '<div>' + l + '</div>').join('') + '</div>';
      return;
    }
    const qr = metodo === 'Yape' ? CONFIG.yapeQR : CONFIG.plinQR;
    panel.innerHTML =
      (qr ? '<img src="' + qr + '" alt="QR ' + metodo + '" onerror="this.style.display=\'none\'">' : '') +
      '<div>Escanea para pagar, o copia el número:</div>' +
      '<div class="ck-pay-num"><strong>' + CONFIG.pagoNumero + '</strong>' +
      '<button type="button" class="ck-copy" id="ck-copy">Copiar</button></div>' +
      '<div style="margin-top:6px;color:#666">' + CONFIG.pagoTitular + '</div>';
    $('ck-copy').onclick = function () {
      const n = CONFIG.pagoNumero.replace(/\s/g, '');
      (navigator.clipboard ? navigator.clipboard.writeText(n) : Promise.reject())
        .then(() => { this.textContent = '¡Copiado!'; setTimeout(() => (this.textContent = 'Copiar'), 1500); })
        .catch(() => { this.textContent = n; });
    };
  }

  /* ---------- TIPO DE ENTREGA ---------- */
  function refreshTipo() {
    const t = $('ck-tipo').value;
    $('ck-dir-wrap').classList.toggle('ck-hide', t === 'recojo');
    $('ck-dir-label').textContent = t === 'agencia' ? 'Agencia y ciudad de destino *' : 'Dirección de entrega *';
    $('ck-direccion').placeholder = t === 'agencia' ? 'Ej. Olva Courier - Arequipa' : 'Ej. Av. Arenales 245, Jesús María';
    refreshTotal();
  }

  /* ---------- VALIDACIÓN ---------- */
  function validar() {
    const errores = [];
    const marca = (id, bad) => $(id).classList.toggle('err', bad);
    const nombre = $('ck-nombre').value.trim();
    const cel = $('ck-celular').value.trim();
    const tipo = $('ck-tipo').value;
    const dir = $('ck-direccion').value.trim();
    const file = $('ck-comprobante').files[0];

    marca('ck-nombre', nombre.length < 3);
    if (nombre.length < 3) errores.push('Ingresa tu nombre completo.');
    const celOk = /^9\d{8}$/.test(cel);
    marca('ck-celular', !celOk);
    if (!celOk) errores.push('Ingresa un celular válido de 9 dígitos (empieza con 9).');
    const dirBad = tipo !== 'recojo' && dir.length < 5;
    marca('ck-direccion', dirBad);
    if (dirBad) errores.push(tipo === 'agencia' ? 'Indica la agencia y ciudad de destino.' : 'La dirección es obligatoria para delivery.');
    if (!file) errores.push('Adjunta tu comprobante de pago.');
    else if (file.size > CONFIG.maxArchivoMB * 1024 * 1024) errores.push('El comprobante pesa más de ' + CONFIG.maxArchivoMB + ' MB.');
    if (!items.length) errores.push('Tu bolsa está vacía.');
    return errores;
  }

  function showMsg(t) {
    const m = $('ck-msg');
    m.textContent = t || '';
    m.classList.toggle('show', !!t);
  }

  /* ---------- ENVÍO DEL PEDIDO ---------- */
  function armarPedido() {
    const tipoSel = $('ck-tipo');
    return {
      nombre: $('ck-nombre').value.trim(),
      celular: $('ck-celular').value.trim(),
      tipoEntrega: tipoSel.options[tipoSel.selectedIndex].text,
      direccion: tipoSel.value === 'recojo' ? '' : $('ck-direccion').value.trim(),
      referencia: $('ck-referencia').value.trim(),
      observaciones: $('ck-obs').value.trim(),
      metodoPago: document.querySelector('input[name="ck-pago"]:checked').value,
      envio: costoEnvio(),
      total: preciosCompletos() ? subtotal() + costoEnvio() : null,
      items
    };
  }

  function mensajeWhatsApp(p) {
    const L = ['*NUEVO PEDIDO - Franchesca Estilos*', ''];
    p.items.forEach((i) => {
      const extra = [i.size && 'Talla ' + i.size, i.color].filter(Boolean).join(', ');
      L.push('• ' + i.qty + ' x ' + i.name + (extra ? ' (' + extra + ')' : '') + (i.price ? ' - ' + money(i.price * i.qty) : ''));
    });
    L.push('', '*Total:* ' + (p.total != null ? money(p.total) : 'por confirmar'));
    L.push('*Pago:* ' + p.metodoPago + ' (comprobante adjunto en este chat)', '');
    L.push('*Cliente:* ' + p.nombre, '*Celular:* ' + p.celular, '*Entrega:* ' + p.tipoEntrega);
    if (p.direccion) L.push('*Dirección:* ' + p.direccion);
    if (p.referencia) L.push('*Referencia:* ' + p.referencia);
    if (p.observaciones) L.push('*Obs.:* ' + p.observaciones);
    return L.join('\n');
  }

  $('ck-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const errores = validar();
    if (errores.length) { showMsg(errores[0]); return; }
    showMsg('');
    const btn = $('ck-submit');
    btn.disabled = true;
    btn.textContent = 'Enviando...';
    const pedido = armarPedido();
    const archivo = $('ck-comprobante').files[0];
    try {
      if (typeof CONFIG.enviarABackend === 'function') {
        await CONFIG.enviarABackend(pedido, archivo);
        alert('¡Pedido confirmado! Te contactaremos pronto.');
      } else {
        window.open('https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(mensajeWhatsApp(pedido)), '_blank');
        alert('Se abrirá WhatsApp con el resumen de tu pedido. Adjunta ahí tu comprobante de pago para terminar.');
      }
      cerrar();
      try { cart.length = 0; updateCartUI(); } catch (er) {}
    } catch (err) {
      showMsg('No se pudo enviar el pedido. Inténtalo otra vez.');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Confirmar pedido';
    }
  });

  /* ---------- ABRIR / CERRAR ---------- */
  function abrir(lista, from) {
    items = lista;
    origen = from;
    if (!items.length) {
      alert('Tu bolsa está vacía. Agrega un producto primero.');
      return;
    }
    showMsg('');
    refreshTipo();
    refreshPayPanel();
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function cerrar() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  $('ck-close').onclick = cerrar;
  overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) cerrar(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && overlay.classList.contains('open')) cerrar(); });
  $('ck-tipo').addEventListener('change', refreshTipo);
  $('ck-methods').addEventListener('change', refreshPayPanel);
  $('ck-celular').addEventListener('input', function () { this.value = this.value.replace(/\D/g, ''); });
  $('ck-comprobante').addEventListener('change', function () {
    const f = this.files[0];
    const prev = $('ck-file-preview');
    if (!f) { $('ck-file-text').textContent = '📎 Toca para adjuntar captura o PDF'; prev.classList.add('ck-hide'); return; }
    $('ck-file-text').textContent = '✅ ' + f.name;
    if (f.type.startsWith('image/')) { prev.src = URL.createObjectURL(f); prev.classList.remove('ck-hide'); }
    else prev.classList.add('ck-hide');
  });

  /* ---------- REEMPLAZO DEL BOTÓN DE WHATSAPP ---------- */
  // "Finalizar pedido por WhatsApp" (en la bolsa) ahora abre el formulario.
  // "Comprar ahora" sigue igual: agrega a la bolsa y abre la bolsa.
  window.sendCartToWhatsApp = function () {
    const lista = readCart();
    if (!lista.length) return;
    const cd = $('cart-drawer');
    if (cd) cd.classList.remove('is-open');
    abrir(lista, 'cart');
  };
  // Nombre propio, para llamarlo directo desde el botón sin depender de main.js
  window.openCheckout = window.sendCartToWhatsApp;
  console.log('[checkout.js] cargado correctamente');
})();