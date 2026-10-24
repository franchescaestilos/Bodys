/* =========================================================
   producto.js | Página de detalle de producto (producto.html?id=...)
   Usa lo que ya define main.js: products, cart, updateCartUI,
   addToCart, cargarProductos, etc.
   Se ejecuta cuando main.js llama a initProductPage()
   (después de cargar los productos de Supabase).

   NUEVO: la galería (imagen grande + miniaturas) ya NO depende del color.
   - Imagen 1 = la principal (por defecto y la que va al carrito).
   - Imágenes 2, 3, 4... = collages: se ven al hacer clic en las miniaturas.
   - Elegir color o talla no cambia la foto.
   ========================================================= */

let ppProduct = null;
let ppColorIdx = 0;
let ppSize = null;
let ppImgIdx = 0;

const ppEl = (id) => document.getElementById(id);

function initProductPage() {
    // Solo corre en producto.html
    if (!ppEl('pp-detail')) return;

    const id = new URLSearchParams(window.location.search).get('id');
    ppProduct = products.find(p => String(p.id) === String(id));

    ppEl('pp-loading').classList.add('pp-hidden');

    if (!ppProduct || !ppProduct.variantes.length) {
        ppEl('pp-notfound').classList.remove('pp-hidden');
        return;
    }

    document.title = `${ppProduct.name} | Franchesca Estilos`;
    ppEl('pp-crumb-name').textContent = ppProduct.name;
    ppEl('pp-title').textContent = ppProduct.name;
    ppEl('pp-category').textContent = ppProduct.category;
    ppEl('pp-price').innerHTML = precioHTML(ppProduct);

    // Etiqueta de promoción junto al precio (ej. "Promo 2 por 50")
    const viejaPromo = document.getElementById('pp-promo');
    if (viejaPromo) viejaPromo.remove();
    if (ppProduct.promo) {
        const promo = document.createElement('p');
        promo.id = 'pp-promo';
        promo.textContent = ppProduct.promo;
        promo.style.cssText = 'display:inline-block; margin:6px 0 0; padding:5px 12px; background:#e11d2e; color:#fff; font-weight:800; font-size:13px; letter-spacing:.03em; text-transform:uppercase; border-radius:6px;';
        ppEl('pp-price').insertAdjacentElement('afterend', promo);
    }
    ppEl('pp-desc').textContent = ppProduct.desc ||
        'Confeccionado en tela de alta calidad, suave al tacto y con ajuste perfecto que realza la silueta femenina.';

    ppEl('pp-buy').onclick = ppComprarAhora;
    ppEl('pp-add').onclick = ppAgregar;
    ppEl('pp-minus').onclick = () => ppSetQty(ppQty - 1);
    ppEl('pp-plus').onclick = () => ppSetQty(ppQty + 1);

    ppRenderGallery();
    ppRenderOptions();
    ppEl('pp-detail').classList.remove('pp-hidden');
}

// Galería: imagen grande + miniaturas (no depende del color)
function ppRenderGallery() {
    const p = ppProduct;
    const imgs = (p.imagenes && p.imagenes.length) ? p.imagenes : [p.img];
    if (ppImgIdx >= imgs.length) ppImgIdx = 0;

    const img = ppEl('pp-img');
    img.src = imgs[ppImgIdx];
    img.alt = `${p.name} - foto ${ppImgIdx + 1}`;

    ppEl('pp-thumbs').innerHTML = imgs.map((src, i) => `
        <button type="button" class="pp-thumb${i === ppImgIdx ? ' active' : ''}"
                onclick="ppSelectImg(${i})" aria-label="Ver foto ${i + 1}">
          <img src="${src}" alt="Foto ${i + 1}" loading="lazy" decoding="async">
        </button>`).join('');
}

// Colores y tallas
function ppRenderOptions() {
    const p = ppProduct;
    const v = p.variantes[ppColorIdx] || { tallas: {} };

    // Colores
    ppEl('pp-color-name').textContent = v.color || '';
    ppEl('pp-colors').innerHTML = p.variantes.map((va, i) => `
        <button type="button" class="pp-color${i === ppColorIdx ? ' active' : ''}"
                style="background-color:${p.colors[i]}"
                onclick="ppSelectColor(${i})" title="${va.color}" aria-label="${va.color}"></button>`).join('');

    // Tallas (las sin stock en este color se deshabilitan)
    ppEl('pp-sizes').innerHTML = ['S', 'M', 'L', 'XL'].map(t => {
        const agotada = !((v.tallas || {})[t] > 0);
        const activa = t === ppSize;
        return `<button type="button" class="pp-size${activa ? ' active' : ''}"
                    ${agotada ? 'disabled' : `onclick="ppSelectSize('${t}')"`}>${t}</button>`;
    }).join('');
}

function ppSelectImg(i) {
    ppImgIdx = i;
    ppRenderGallery();
}

function ppSelectColor(i) {
    ppColorIdx = i;
    const tallas = ppProduct.variantes[i].tallas || {};
    if (ppSize && !(tallas[ppSize] > 0)) ppSize = null;
    ppRenderOptions();
}

function ppSelectSize(t) {
    ppSize = t;
    ppEl('pp-size-error').classList.remove('show');
    ppRenderOptions();
}

// Devuelve el item para la bolsa (o null si falta elegir talla)
// La imagen que se guarda es SIEMPRE la primera (la principal)
function ppItem() {
    if (!ppSize) {
        ppEl('pp-size-error').classList.add('show');
        return null;
    }
    const v = ppProduct.variantes[ppColorIdx] || {};
    const { variantes, imagenes, ...base } = ppProduct;
    return { ...base, color: v.color || '', size: ppSize, img: ppProduct.img };
}

// Cantidad (- 1 +), entre 1 y 10
let ppQty = 1;
function ppSetQty(n) {
    ppQty = Math.max(1, Math.min(10, n));
    ppEl('pp-qty-value').textContent = ppQty;
}

// Hace vibrar la bolsa flotante (solo al agregar un producto)
function ppRingBag() {
    const bag = ppEl('pp-bag-float');
    if (!bag) return;
    bag.classList.remove('pp-bag-pop');
    void bag.offsetWidth; // reinicia la animación
    bag.classList.add('pp-bag-pop');
    setTimeout(() => bag.classList.remove('pp-bag-pop'), 900);
}

// main.js: addToCart junta los iguales en una sola línea con su cantidad (qty)
// El segundo parámetro true = sin aviso "agregado a la bolsa"
function ppAgregar() {
    const item = ppItem();
    if (!item) return;
    addToCart({ ...item, qty: ppQty }, true);
    ppRingBag();
}

function ppComprarAhora() {
    const item = ppItem();
    if (!item) return;
    addToCart({ ...item, qty: ppQty }, true);
    document.getElementById('cart-drawer').classList.add('is-open');
}