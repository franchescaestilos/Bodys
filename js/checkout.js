/* =========================================================
   js/checkout.js  |  Franchesca Estilos
   Lógica de checkout.html (página completa).
   Lee la bolsa desde localStorage ('franchesca_cart'), que guarda main.js.
   ========================================================= */
(function () {
  'use strict';

  /* ---------- CONFIGURACIÓN (edita aquí) ---------- */
  const CONFIG = {
    pagoNumero: '944 737 700',
    pagoTitular: 'Franchesca Estilos',
    yapeQR: 'img/yape-qr.png',
    plinQR: 'img/plin-qr.png',
    transferencia: [
      'Banco: BCP',
      'Cuenta: 000-00000000-0-00',
      'CCI: 002-000-000000000000-00',
      'Titular: Franchesca Estilos'
    ],
    // IMPORTANTE: estas tarifas deben ser iguales a las de la función crear_pedido en Supabase
    envio: { delivery: 8.90, agencia: 8.90 },
    gratisDesde: { delivery: 199, agencia: 249 },
    maxArchivoMB: 5,
    cartKey: 'franchesca_cart'
  };
  // Mismo proyecto de Supabase que main.js (clave pública)
  const db = window.supabase.createClient(
    'https://vlfcuyekpnsmziamacle.supabase.co',
    'sb_publishable_6NCCtkox0sQIR2zXT-6vEQ_Xv7_6Uia'
  );

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (n) => 'S/ ' + n.toFixed(2);
  const tipoActual = () => document.querySelector('input[name="ck-tipo"]:checked').value;

  /* ---------- BOLSA ---------- */
  function parsePrice(v) {
    return parseFloat(String(v == null ? '' : v).replace(/[^\d.]/g, '')) || 0;
  }

  function readCart() {
    let c = [];
    try { c = JSON.parse(localStorage.getItem(CONFIG.cartKey)) || []; } catch (e) {}
    const map = new Map();
    c.forEach((p) => {
      const key = (p.id != null ? p.id : p.name) + '|' + (p.color || '') + '|' + (p.size || '');
      const q = p.qty || 1;
      if (map.has(key)) map.get(key).qty += q;
      else map.set(key, {
        id: p.id, name: p.name, category: p.category || '', price: parsePrice(p.price),
        qty: q, size: p.size || '', color: p.color || '', img: p.img || ''
      });
    });
    return Array.from(map.values());
  }

  const items = readCart();
    const subtotal = () => Math.round(items.reduce((s, i) => s + i.price * i.qty, 0) * 100) / 100;
  const costoEnvio = () => {
    const t = tipoActual();
    return subtotal() >= CONFIG.gratisDesde[t] ? 0 : (CONFIG.envio[t] || 0);
  };

  function pintarResumen() {
    $('ck-items').innerHTML = items.map((i) => {
      const extra = [i.color, i.size && 'Talla ' + i.size].filter(Boolean).join(' · ');
      return '<div class="sum-item">' +
        (i.img ? '<img src="' + esc(i.img) + '" alt="' + esc(i.name) + '">' : '') +
        '<div><h4>' + esc(i.name) + '</h4>' +
        (extra ? '<p>' + esc(extra) + '</p>' : '') +
        '<p>' + i.qty + ' x ' + money(i.price) + '</p></div></div>';
    }).join('');
    refreshTotal();
  }

   function refreshTotal() {
    const t = tipoActual();
    const sub = subtotal();
    const envio = costoEnvio();
    const falta = CONFIG.gratisDesde[t] - sub;

    $('ck-subtotal').textContent = money(sub);
    $('ck-envio-label').textContent = 'Envío (' + (t === 'delivery' ? 'Delivery' : 'Nacional') + ')';
    $('ck-envio').textContent = envio ? money(envio) : '¡Gratis!';
    $('ck-total').textContent = money(sub + envio);
    $('ck-envio-note').textContent = falta > 0
      ? 'Te faltan ' + money(falta) + ' para envío gratis'
      : '';
  }

  /* ---------- UBIGEO ---------- */
  let ubigeo = null;
  let distritosDelivery = null;
  let cargando = null;

  // Supabase devuelve máximo 1000 filas por consulta: se pide por páginas
  async function cargarUbigeo() {
    let todo = [];
    let desde = 0;
    const paso = 1000;
    while (true) {
      const { data, error } = await db
        .from('ubigeo')
        .select('departamento,provincia,distrito')
        .order('departamento').order('provincia').order('distrito')
        .range(desde, desde + paso - 1);
      if (error) throw error;
      todo = todo.concat(data);
      if (data.length < paso) break;
      desde += paso;
    }
    return todo;
  }

  function cargarListas() {
    if (ubigeo && distritosDelivery) return Promise.resolve();
    if (!cargando) {
      cargando = (async () => {
        const [u, d] = await Promise.all([cargarUbigeo(), db.rpc('distritos_delivery')]);
        if (d.error) throw d.error;
        ubigeo = u;
        distritosDelivery = d.data || [];
      })().finally(() => { cargando = null; });
    }
    return cargando;
  }

  function llenar(sel, placeholder, pares) {
    sel.innerHTML = '';
    const o0 = document.createElement('option');
    o0.value = '';
    o0.textContent = placeholder;
    sel.appendChild(o0);
    pares.forEach(([v, t]) => {
      const o = document.createElement('option');
      o.value = v;
      o.textContent = t;
      sel.appendChild(o);
    });
    sel.disabled = pares.length === 0;
  }

  const unicos = (arr) => Array.from(new Set(arr));

  function pintarDelivery() {
    const sel = $('ck-del-distrito');
    sel.innerHTML = '<option value="">Elige tu distrito</option>';
    ['LIMA', 'CALLAO'].forEach((prov) => {
      const lista = distritosDelivery.filter((d) => d.provincia.trim().toUpperCase() === prov);
      if (!lista.length) return;
      const g = document.createElement('optgroup');
      g.label = lista[0].provincia;
      lista.forEach((d) => {
        const o = document.createElement('option');
        o.value = d.provincia + '||' + d.distrito;
        o.textContent = d.distrito;
        g.appendChild(o);
      });
      sel.appendChild(g);
    });
    sel.disabled = false;
  }

  function pintarDepartamentos() {
    llenar($('ck-dep'), 'Elige departamento', unicos(ubigeo.map((r) => r.departamento)).map((d) => [d, d]));
    llenar($('ck-prov'), 'Elige provincia', []);
    llenar($('ck-dist'), 'Elige distrito', []);
  }

  function onDepartamento() {
    const dep = $('ck-dep').value;
    const provs = unicos(ubigeo.filter((r) => r.departamento === dep).map((r) => r.provincia));
    llenar($('ck-prov'), 'Elige provincia', provs.map((p) => [p, p]));
    llenar($('ck-dist'), 'Elige distrito', []);
  }

  function onProvincia() {
    const dep = $('ck-dep').value;
    const prov = $('ck-prov').value;
    const dists = ubigeo.filter((r) => r.departamento === dep && r.provincia === prov).map((r) => r.distrito);
    llenar($('ck-dist'), 'Elige distrito', dists.map((d) => [d, d]));
  }

  /* ---------- TIPO DE ENTREGA ---------- */
  function refreshTipo() {
    const t = tipoActual();
    $('ck-bloque-delivery').classList.toggle('hidden', t !== 'delivery');
    $('ck-bloque-agencia').classList.toggle('hidden', t !== 'agencia');
    $('ck-dni-wrap').classList.toggle('hidden', t !== 'agencia');
    refreshTotal();
  }

  /* ---------- AUTOCOMPLETAR POR DNI ---------- */
  let dniUltimo = '';

  function setSelect(sel, valor) {
    const existe = Array.from(sel.options).some((o) => o.value === valor);
    if (existe) sel.value = valor;
    return existe;
  }

  $('ck-dni').addEventListener('input', async function () {
    this.value = this.value.replace(/\D/g, '');
    $('ck-found').classList.add('hidden');
    if (this.value.length !== 8) { dniUltimo = ''; return; }
    if (this.value === dniUltimo) return;
    dniUltimo = this.value;
    try {
      await cargarListas();
      const { data, error } = await db.rpc('buscar_cliente', { p_dni: this.value });
      if (error) throw error;
      const c = data && data[0];
      if (!c) return;

      // Solo completa lo que el cliente aún no escribió
      if (!$('ck-nombre').value.trim() && c.nombre) $('ck-nombre').value = c.nombre;
      if (!$('ck-dep').value && c.departamento && setSelect($('ck-dep'), c.departamento)) {
        onDepartamento();
        if (setSelect($('ck-prov'), c.provincia)) {
          onProvincia();
          setSelect($('ck-dist'), c.distrito);
        }
      }
      if (!$('ck-agencia').value.trim() && c.agencia_destino) $('ck-agencia').value = c.agencia_destino;
      $('ck-found').classList.remove('hidden');
    } catch (err) {
      console.error('Error buscando cliente:', err);
    }
  });

  /* ---------- PANEL DE PAGO ---------- */
  function refreshPayPanel() {
    const metodo = document.querySelector('input[name="ck-pago"]:checked').value;
    const panel = $('ck-pay-panel');
    if (metodo === 'Transferencia') {
      panel.innerHTML = '<div class="ck-bank">' + CONFIG.transferencia.map((l) => '<div>' + esc(l) + '</div>').join('') + '</div>';
      return;
    }
    const qr = metodo === 'Yape' ? CONFIG.yapeQR : CONFIG.plinQR;
    panel.innerHTML =
      (qr ? '<img src="' + qr + '" alt="QR ' + metodo + '" onerror="this.style.display=\'none\'">' : '') +
      '<div>Escanea para pagar, o copia el número:</div>' +
      '<div class="ck-pay-num"><strong>' + CONFIG.pagoNumero + '</strong>' +
      '<button type="button" class="ck-copy" id="ck-copy">Copiar</button></div>' +
      '<div style="margin-top:6px;color:#666">' + esc(CONFIG.pagoTitular) + '</div>';
    $('ck-copy').onclick = function () {
      const n = CONFIG.pagoNumero.replace(/\s/g, '');
      (navigator.clipboard ? navigator.clipboard.writeText(n) : Promise.reject())
        .then(() => { this.textContent = '¡Copiado!'; setTimeout(() => (this.textContent = 'Copiar'), 1500); })
        .catch(() => { this.textContent = n; });
    };
  }

  /* ---------- VALIDACIÓN ---------- */
  function validar() {
    const errores = [];
    const marca = (id, bad) => $(id).classList.toggle('err', bad);
    const tipo = tipoActual();
    const file = $('ck-comprobante').files[0];

    if (tipo === 'agencia') {
      const dniBad = !/^\d{8}$/.test($('ck-dni').value);
      marca('ck-dni', dniBad);
      if (dniBad) errores.push('Ingresa tu DNI de 8 dígitos.');
    }

    const nombreBad = $('ck-nombre').value.trim().length < 3;
    marca('ck-nombre', nombreBad);
    if (nombreBad) errores.push('Ingresa tu nombre completo.');

    const celBad = !/^9\d{8}$/.test($('ck-celular').value.trim());
    marca('ck-celular', celBad);
    if (celBad) errores.push('Ingresa un celular válido de 9 dígitos (empieza con 9).');

    if (tipo === 'delivery') {
      const sinDistrito = !$('ck-del-distrito').value;
      marca('ck-del-distrito', sinDistrito);
      if (sinDistrito) errores.push('Elige el distrito de entrega.');
      const dirBad = $('ck-direccion').value.trim().length < 5;
      marca('ck-direccion', dirBad);
      if (dirBad) errores.push('Ingresa tu dirección de entrega.');
    } else {
      marca('ck-dep', !$('ck-dep').value);
      marca('ck-prov', !$('ck-prov').value);
      marca('ck-dist', !$('ck-dist').value);
      if (!$('ck-dep').value || !$('ck-prov').value || !$('ck-dist').value) {
        errores.push('Elige departamento, provincia y distrito.');
      }
      const agBad = $('ck-agencia').value.trim().length < 2;
      marca('ck-agencia', agBad);
      if (agBad) errores.push('Indica la agencia de destino.');
    }

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
    const esDelivery = tipoActual() === 'delivery';
    let departamento = '', provincia = '', distrito = '';
    if (esDelivery) {
      const partes = $('ck-del-distrito').value.split('||');
      provincia = partes[0] || '';
      distrito = partes[1] || '';
    } else {
      departamento = $('ck-dep').value;
      provincia = $('ck-prov').value;
      distrito = $('ck-dist').value;
    }
    return {
      nombre: $('ck-nombre').value.trim(),
      celular: $('ck-celular').value.trim(),
      tipoEntrega: esDelivery ? 'Delivery' : 'Envío nacional',
      dni: esDelivery ? '' : $('ck-dni').value,
      direccion: esDelivery ? $('ck-direccion').value.trim() : '',
      agenciaDestino: esDelivery ? '' : $('ck-agencia').value.trim(),
      departamento, provincia, distrito,
      referencia: $('ck-referencia').value.trim(),
      metodoPago: document.querySelector('input[name="ck-pago"]:checked').value,
      items
    };
  }

  async function enviarPedido(pedido, archivo) {
    // 1) Subir comprobante
    const id = crypto.randomUUID();
    const ext = (archivo.name.split('.').pop() || 'jpg').toLowerCase();
    const ruta = id + '.' + ext;
    const up = await db.storage.from('comprobantes').upload(ruta, archivo, { contentType: archivo.type });
    if (up.error) throw up.error;

    // 2) Guardar pedido + items + descontar stock (una sola transacción en el servidor)
    const { data, error } = await db.rpc('crear_pedido', {
      p_id: id,
      p_nombre: pedido.nombre,
      p_celular: pedido.celular,
      p_tipo_entrega: pedido.tipoEntrega,
      p_dni: pedido.dni || null,
      p_direccion: pedido.direccion || null,
      p_referencia: pedido.referencia || null,
      p_departamento: pedido.departamento || null,
      p_provincia: pedido.provincia || null,
      p_distrito: pedido.distrito || null,
      p_agencia_destino: pedido.agenciaDestino || null,
      p_metodo_pago: pedido.metodoPago,
      p_comprobante_path: ruta,
      p_items: pedido.items.map((i) => ({
        producto_id: String(i.id),
        color: i.color,
        talla: i.size,
        cantidad: i.qty
      }))
    });
    if (error) throw error;
    return data; // número de pedido
  }

  $('ck-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const errores = validar();
    if (errores.length) { showMsg(errores[0]); return; }
    showMsg('');
    const btn = $('ck-submit');
    btn.disabled = true;
    btn.textContent = 'Enviando...';
    try {
      const numero = await enviarPedido(armarPedido(), $('ck-comprobante').files[0]);
      try { localStorage.removeItem(CONFIG.cartKey); } catch (er) {}
      $('ck-form').classList.add('hidden');
  if (numero) {
  $('ck-order-num').textContent = '#' + numero;
  $('ck-order-box').classList.remove('hidden');
  $('ck-done-text').textContent = 'Guarda este número: lo necesitarás para consultar el seguimiento de tu pedido.';
} else {
  $('ck-done-text').textContent = 'Recibimos tu pedido.';
}
      $('ck-done').classList.remove('hidden');
      window.scrollTo({ top: 0 });
    } catch (err) {
      console.error('Error pedido:', err && err.message, err);
      const m = err && err.message ? err.message : '';
      showMsg(m.indexOf('Sin stock') === 0
        ? m + '. Vuelve a la bolsa y quita ese producto o baja la cantidad.'
        : 'No se pudo enviar el pedido. Inténtalo otra vez.');
      btn.disabled = false;
      btn.textContent = 'Confirmar pedido';
    }
  });

  /* ---------- EVENTOS Y ARRANQUE ---------- */
  document.querySelectorAll('input[name="ck-tipo"]').forEach((r) => r.addEventListener('change', refreshTipo));
  $('ck-dep').addEventListener('change', onDepartamento);
  $('ck-prov').addEventListener('change', onProvincia);
  $('ck-methods').addEventListener('change', refreshPayPanel);
  $('ck-celular').addEventListener('input', function () { this.value = this.value.replace(/\D/g, ''); });
  $('ck-comprobante').addEventListener('change', function () {
    const f = this.files[0];
    const prev = $('ck-file-preview');
    if (!f) { $('ck-file-text').textContent = '📎 Toca para adjuntar captura o PDF'; prev.classList.add('hidden'); return; }
    $('ck-file-text').textContent = '✅ ' + f.name;
    if (f.type.startsWith('image/')) { prev.src = URL.createObjectURL(f); prev.classList.remove('hidden'); }
    else prev.classList.add('hidden');
  });
  $('ck-order-copy').addEventListener('click', function () {
    const n = $('ck-order-num').textContent.replace('#', '');
    (navigator.clipboard ? navigator.clipboard.writeText(n) : Promise.reject())
      .then(() => { this.textContent = '¡Copiado!'; setTimeout(() => (this.textContent = 'Copiar'), 1500); })
      .catch(() => { this.textContent = n; });
  });
  if (!items.length) {
    $('ck-empty').classList.remove('hidden');
    return;
  }

  $('ck-form').classList.remove('hidden');
  pintarResumen();
  refreshTipo();
  refreshPayPanel();

  $('ck-del-distrito').innerHTML = '<option value="">Cargando distritos...</option>';
  $('ck-del-distrito').disabled = true;
  llenar($('ck-dep'), 'Cargando...', []);
  llenar($('ck-prov'), 'Elige provincia', []);
  llenar($('ck-dist'), 'Elige distrito', []);
  cargarListas()
    .then(() => { pintarDelivery(); pintarDepartamentos(); })
    .catch((err) => {
      console.error('Error cargando ubigeo:', err);
      showMsg('No se pudieron cargar los distritos. Recarga la página.');
    });
})();