/* =========================================================
   js/checkout.js  |  Franchesca Estilos
   Lógica de checkout.html (página completa).
   Lee la bolsa desde localStorage ('franchesca_cart'), que guarda main.js.
   ========================================================= */
(function () {
  'use strict';

  /* ---------- CONFIGURACIÓN (edita aquí) ---------- */
const CONFIG = {
  pagoNumero: '956 931 873',
  pagoTitular: 'Jhojan de la Cruz',
  yapeQR: 'img/yape-qr.png',
  transferencia: [
    'Banco: BCP',
    'Cuenta de ahorros: 19173753346027',
    'CCI: 00219117375334602751',
    'Titular: Jhojan de la Cruz'
  ],
  agenciaFija: 'Shalom',
  maxArchivoMB: 5,
  cartKey: 'franchesca_cart'
};
  // Textos que cambian según el tipo de entrega
  const TEXTOS = {
    delivery: {
      aviso: 'Delivery: costo según distrito y distancia. Pagas al motorizado al recibir tu pedido.',
      titulo: 'Referencias o indicaciones adicionales (opcional)',
      ejemplo: 'Ej. Frente al banco, puerta azul, avisarme cuando llegue'
    },
    agencia: {
      aviso: 'Envío nacional (Shalom): el envío se paga por separado al recoger tu pedido en la agencia. ' +
             'Si Shalom no llega a tu zona, escríbenos por WhatsApp y coordinamos otra opción.',
      titulo: 'Referencia o agencia Shalom preferida (opcional)',
      ejemplo: 'Ej. Shalom de Av. Grau, cerca de la plaza'
    }
  };

  // Mismo proyecto de Supabase que main.js (clave pública)
  const db = window.supabase.createClient(
    'https://vlfcuyekpnsmziamacle.supabase.co',
    'sb_publishable_6NCCtkox0sQIR2zXT-6vEQ_Xv7_6Uia'
  );

  const $ = (id) => document.getElementById(id);
  const setText = (id, t) => { const e = $(id); if (e) e.textContent = t; };
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
        id: p.id, name: p.name, category: p.category || '',
        price: parsePrice(p.price),
        oldPrice: parsePrice(p.oldPrice),
        promo: p.promo || '',
        promoPrecio: Number(p.promoPrecio) || 0,
        qty: q, size: p.size || '', color: p.color || '', img: p.img || ''
      });
    });
    return Array.from(map.values());
  }

  const items = readCart();

  // Misma lógica que la bolsa (main.js): promo "2 por X"
  function calcularBolsa(list) {
    let subtotal = 0;
    const grupos = {};
    list.forEach((it) => {
      subtotal += it.price * it.qty;
      if (it.promoPrecio > 0) {
        if (!grupos[it.promoPrecio]) grupos[it.promoPrecio] = [];
        for (let i = 0; i < it.qty; i++) grupos[it.promoPrecio].push(it.price);
      }
    });
    let descuento = 0;
    Object.entries(grupos).forEach(([promo, precios]) => {
      precios.sort((a, b) => b - a);
      for (let i = 0; i + 1 < precios.length; i += 2) {
        const ahorro = precios[i] + precios[i + 1] - Number(promo);
        if (ahorro > 0) descuento += ahorro;
      }
    });
    descuento = Math.round(descuento * 100) / 100;
    subtotal = Math.round(subtotal * 100) / 100;
    return { subtotal, descuento, total: Math.round((subtotal - descuento) * 100) / 100 };
  }

  function pintarResumen() {
    $('ck-items').innerHTML = items.map((i) => {
      const extra = [i.color, i.size && 'Talla ' + i.size].filter(Boolean).join(' · ');
      const viejo = i.oldPrice > i.price
        ? '<span class="sum-old">' + money(i.oldPrice) + '</span> ' : '';
      return '<div class="sum-item">' +
        (i.img ? '<img src="' + esc(i.img) + '" alt="' + esc(i.name) + '">' : '') +
        '<div><h4>' + esc(i.name) + '</h4>' +
        (extra ? '<p>' + esc(extra) + '</p>' : '') +
        '<p>' + i.qty + ' x ' + viejo + money(i.price) + '</p>' +
        (i.promo ? '<p class="sum-promo">' + esc(i.promo) + '</p>' : '') +
        '</div></div>';
    }).join('');
    refreshTotal();
  }

  function refreshTotal() {
    const b = calcularBolsa(items);
    setText('ck-subtotal', money(b.subtotal));
    const fila = $('ck-desc-row');
    if (fila) fila.classList.toggle('hidden', b.descuento <= 0);
    setText('ck-desc', '– ' + money(b.descuento));
    setText('ck-total', money(b.total));
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

  let toastTimer;
function toast(msg) {
  let t = $('ck-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'ck-toast';
    t.setAttribute('role', 'status');
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 5000);
}

  /* ---------- TIPO DE ENTREGA ---------- */
function refreshTipo(avisar) {
  const t = tipoActual();
  $('ck-bloque-delivery').classList.toggle('hidden', t !== 'delivery');
  $('ck-bloque-agencia').classList.toggle('hidden', t !== 'agencia');
  $('ck-dni-wrap').classList.toggle('hidden', t !== 'agencia');

  setText('ck-ref-label', TEXTOS[t].titulo);
  const ref = $('ck-referencia');
  if (ref) ref.placeholder = TEXTOS[t].ejemplo;

  // Agencia fija
  const ag = $('ck-agencia');
  if (ag) { ag.value = CONFIG.agenciaFija; ag.readOnly = true; }

  if (avisar === true) toast(TEXTOS[t].aviso);
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
      if (!$('ck-celular').value.trim() && c.celular) $('ck-celular').value = String(c.celular).replace(/\D/g, '').slice(-9);
      if (!$('ck-dep').value && c.departamento && setSelect($('ck-dep'), c.departamento)) {
        onDepartamento();
        if (setSelect($('ck-prov'), c.provincia)) {
          onProvincia();
          setSelect($('ck-dist'), c.distrito);
        }
      }
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
    const qr = CONFIG.yapeQR;
    panel.innerHTML =
      (qr ? '<img src="' + qr + '" alt="QR ' + metodo + '" onerror="this.style.display=\'none\'">' : '') +
      '<div>Copia el número para pagar por Yape:</div>' +
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
      agenciaDestino: esDelivery ? '' : CONFIG.agenciaFija,
      departamento, provincia, distrito,
      referencia: $('ck-referencia').value.trim(),
      metodoPago: document.querySelector('input[name="ck-pago"]:checked').value,
      items
    };
  }
  let ultimoPedido = null;

  function lugarEntrega(p) {
    return p.tipoEntrega === 'Delivery'
      ? [p.direccion, p.distrito, p.provincia].filter(Boolean).join(', ')
      : [p.departamento, p.provincia, p.distrito].filter(Boolean).join(' / ') +
        (p.agenciaDestino ? ' - Agencia: ' + p.agenciaDestino : '');
  }

  // Datos oficiales desde la base de datos (si la función existe); si no, se usan los de la pantalla
  async function datosServidor(numero, celular) {
    try {
      const { data, error } = await db.rpc('consultar_pedido', { p_numero: Number(numero), p_celular: celular });
      if (!error && data) return data;
    } catch (e) {}
    return null;
  }

  function datosPDF(u, srv) {
    const detalle = (c, t) => [c, t && 'Talla ' + t].filter(Boolean).join(' · ');
    const lista = srv && srv.items && srv.items.length
      ? srv.items.map((i) => ({ nombre: i.nombre, detalle: detalle(i.color, i.talla), cant: Number(i.cantidad), pu: Number(i.precio_unitario) }))
      : u.items.map((i) => ({ nombre: i.name, detalle: detalle(i.color, i.size), cant: i.qty, pu: i.price }));
    const sub = srv && srv.subtotal != null ? Number(srv.subtotal) : u.subtotal;
    const desc = srv && srv.descuento != null ? Number(srv.descuento) : u.descuento;
    const tot = srv && srv.total != null ? Number(srv.total) : sub - desc;
    const fecha = srv && srv.fecha ? new Date(srv.fecha) : u.fecha;
    return {
      numero: u.numero, nombre: u.nombre, celular: u.celular, tipoEntrega: u.tipoEntrega,
      lugar: u.lugar, metodoPago: u.metodoPago, items: lista, subtotal: sub, descuento: desc, total: tot,
      fechaTxt: fecha.toLocaleString('es-PE', { dateStyle: 'long', timeStyle: 'short' })
    };
  }

  function generarPDF(d) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const W = 210, M = 18, R = W - M;
    const rosa = [230, 0, 126], tinta = [18, 18, 18], gris = [107, 114, 128];
    const color = (c) => doc.setTextColor(c[0], c[1], c[2]);
    let y = 24;

    // Encabezado (logo en texto)
    doc.setFont('times', 'italic'); doc.setFontSize(30); color(rosa);
    doc.text('Franchesca', M, y);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); color(tinta);
    doc.text('E S T I L O S', M + 2, y + 6);

    doc.setFont('helvetica', 'bold'); doc.setFontSize(15); color(tinta);
    doc.text('COMPROBANTE DE PEDIDO', R, y - 2, { align: 'right' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); color(gris);
    doc.text('Pedido #' + d.numero, R, y + 5, { align: 'right' });
    doc.text(d.fechaTxt, R, y + 11, { align: 'right' });

    y += 20;
    doc.setDrawColor(228, 228, 231); doc.line(M, y, R, y);
    y += 9;

    // Datos del cliente y entrega
    const fila = (k, v) => {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); color(tinta); doc.text(k, M, y);
      doc.setFont('helvetica', 'normal'); color(gris);
      const lineas = doc.splitTextToSize(v || '-', R - M - 38);
      doc.text(lineas, M + 38, y);
      y += 6 * lineas.length;
    };
    fila('Cliente:', d.nombre);
    fila('Celular:', d.celular);
    fila('Entrega:', d.tipoEntrega);
    fila('Destino:', d.lugar);
    fila('Método de pago:', d.metodoPago);

    // Tabla de productos
    y += 4;
    doc.setFillColor(250, 249, 248); doc.rect(M, y - 5, R - M, 9, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); color(tinta);
    doc.text('PRODUCTO', M + 2, y + 1);
    doc.text('CANT.', 118, y + 1, { align: 'center' });
    doc.text('P. UNIT.', 152, y + 1, { align: 'right' });
    doc.text('IMPORTE', R - 2, y + 1, { align: 'right' });
    y += 11;

    d.items.forEach((it) => {
      const nombre = doc.splitTextToSize(it.nombre, 85);
      const alto = 5 * nombre.length + (it.detalle ? 5 : 0) + 3;
      if (y + alto > 270) { doc.addPage(); y = 24; }
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10); color(tinta);
      doc.text(nombre, M + 2, y);
      doc.text(String(it.cant), 118, y, { align: 'center' });
      doc.text(money(it.pu), 152, y, { align: 'right' });
      doc.text(money(it.pu * it.cant), R - 2, y, { align: 'right' });
      if (it.detalle) {
        doc.setFontSize(8.5); color(gris);
        doc.text(it.detalle, M + 2, y + 5 * (nombre.length - 1) + 5);
      }
      y += alto;
    });

    // Totales
    if (y > 245) { doc.addPage(); y = 24; }
    doc.setDrawColor(228, 228, 231); doc.line(M, y, R, y);
    y += 8;
    const tot = (k, v, fuerte) => {
      doc.setFont('helvetica', fuerte ? 'bold' : 'normal');
      doc.setFontSize(fuerte ? 13 : 10);
      color(fuerte ? tinta : gris);
      doc.text(k, 130, y);
      doc.text(v, R - 2, y, { align: 'right' });
      y += fuerte ? 8 : 6;
    };
    tot('Subtotal', money(d.subtotal));
    if (d.descuento > 0) tot('Promoción', '- ' + money(d.descuento));
    tot('Total', money(d.total), true);

    // Nota final
    y += 8;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); color(gris);
    const nota = doc.splitTextToSize(
      'Este documento confirma la recepción de tu pedido. Verificaremos tu comprobante de pago y te ' +
      'contactaremos pronto. El costo de envío se paga por separado al recibir tu pedido. Con tu número ' +
      'de pedido puedes rastrear su estado en la sección "Seguimiento de pedido" de nuestra tienda. ' +
      '¡Gracias por tu compra!', R - M);
    doc.text(nota, M, y);

    doc.save('Comprobante-' + d.numero + '.pdf');
  }
  // Convierte la imagen a webp y la achica. Los PDF se dejan igual.
  async function aWebp(file, maxLado = 1280, calidad = 0.75) {
    if (!file || !file.type.startsWith('image/')) return file;
    try {
      const bmp = await createImageBitmap(file);
      const factor = Math.min(1, maxLado / Math.max(bmp.width, bmp.height));
      const w = Math.round(bmp.width * factor);
      const h = Math.round(bmp.height * factor);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(bmp, 0, 0, w, h);
      const blob = await new Promise((r) => canvas.toBlob(r, 'image/webp', calidad));
      // Si el navegador no soporta webp o no se logra reducir, se queda el original
      if (!blob || blob.type !== 'image/webp' || blob.size >= file.size) return file;
      return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.webp', { type: 'image/webp' });
    } catch (e) {
      return file;
    }
  }

  async function enviarPedido(pedido, archivo) {
    // 1) Subir comprobante
   const listo = await aWebp(archivo);
    const id = crypto.randomUUID();
    const ext = (listo.name.split('.').pop() || 'jpg').toLowerCase();
    const ruta = id + '.' + ext;
    const up = await db.storage.from('comprobantes').upload(ruta, listo, { contentType: listo.type });
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
      const pedido = armarPedido();
      const b = calcularBolsa(items);
      const resumen = {
        items: items.map((i) => ({ ...i })),
        subtotal: b.subtotal,
        descuento: b.descuento
      };
      const numero = await enviarPedido(pedido, $('ck-comprobante').files[0]);
      ultimoPedido = {
        numero, fecha: new Date(), nombre: pedido.nombre, celular: pedido.celular,
        tipoEntrega: pedido.tipoEntrega, metodoPago: pedido.metodoPago,
        lugar: lugarEntrega(pedido), ...resumen
      };
      try { localStorage.removeItem(CONFIG.cartKey); } catch (er) {}
      $('ck-form').classList.add('hidden');
      $('ck-order-box').classList.toggle('hidden', !numero);
      $('ck-pdf-btn').classList.toggle('hidden', !numero);
      if (numero) {
        $('ck-order-num').textContent = '#' + numero;
        $('ck-done-text').innerHTML =
          'Con tu número de pedido <strong>#' + esc(numero) + '</strong> puedes rastrear tu pedido en ' +
          '<a href="seguimiento.html?numero=' + encodeURIComponent(numero) + '">Seguimiento de pedido</a>.';
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
  document.querySelectorAll('input[name="ck-tipo"]').forEach((r) =>
  r.addEventListener('change', () => refreshTipo(true)));
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

  $('ck-pdf-btn').addEventListener('click', async function () {
    if (!ultimoPedido) return;
    const btn = this;
    btn.disabled = true;
    btn.textContent = 'Generando...';
    try {
      const srv = await datosServidor(ultimoPedido.numero, ultimoPedido.celular);
      generarPDF(datosPDF(ultimoPedido, srv));
      btn.textContent = 'Descargar comprobante PDF';
    } catch (err) {
      console.error('Error generando PDF:', err);
      btn.textContent = 'No se pudo generar. Reintentar';
    }
    btn.disabled = false;
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
setTimeout(() => toast(TEXTOS[tipoActual()].aviso), 700);
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