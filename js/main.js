if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

// Catalog Data (viene de Supabase)
const db = window.supabase.createClient(
    "https://vlfcuyekpnsmziamacle.supabase.co",
    "sb_publishable_6NCCtkox0sQIR2zXT-6vEQ_Xv7_6Uia"
);

let products = [];

// Estilo de la talla elegida (con prioridad sobre cualquier otro CSS)
(function () {
    const s = document.createElement('style');
    s.textContent =
        '#modal-sizes .js-span-6 { background: #ffffff !important; color: #121212 !important; border: 1px solid #d9d9d9 !important; }' +
        '#modal-sizes .size-activa { background: #121212 !important; color: #ffffff !important; border-color: #121212 !important; font-weight: 600 !important; box-shadow: 0 0 0 2px #ffffff, 0 0 0 4px #121212 !important; }';
    document.head.appendChild(s);
})();

const COLORES_HEX = {
    "Blanco": "#ffffff", "Negro": "#121212", "Beige": "#d9c2a3",
    "Marrón": "#81503e", "Humo": "#8e8e93", "Plomo": "#6b7280",
    "Rojo": "#ef4444", "Vino": "#722f37", "Rosa": "#f4b6c2",
    "Melón": "#f4a283", "Camello": "#c19a6b", "Verde": "#10b981",
    "Azul": "#3b82f6", "Celeste": "#7dd3fc"
};

function adaptarProducto(p) {
    const variantes = p.variantes || [];
    const tallasConStock = new Set();
    variantes.forEach(v =>
        Object.entries(v.tallas || {}).forEach(([talla, n]) => {
            if (n > 0) tallasConStock.add(talla);
        })
    );
    const esBody = p.categoria === "Bodys";

    return {
        id: p.id,
        name: p.nombre,
        category: esBody ? "Body" : "Polo",
        type: esBody ? "body" : "polo",
        price: `S/ ${Number(p.precio).toFixed(2)}`,
        img: variantes[0]?.imagen || "",
        colors: variantes.map(v => COLORES_HEX[v.color] || "#cccccc"),
        colorNames: variantes.map(v => v.color),
        sizes: ["S", "M", "L", "XL"].filter(t => tallasConStock.has(t)),
        desc: p.descripcion || "",
        variantes: variantes
    };
}

async function cargarProductos() {
    const { data, error } = await db
        .from("productos")
        .select("*")
        .eq("activo", true)
        .order("categoria")
        .order("nombre");

    if (error) {
        console.error("Error cargando productos:", error.message);
        return;
    }
    products = data.map(adaptarProducto);
}

let cart = [];
try {
    cart = JSON.parse(localStorage.getItem('franchesca_cart')) || [];
} catch (e) {
    cart = [];
}
let currentProduct = null;
updateCartUI();

// Initialize Page
window.addEventListener('DOMContentLoaded', async () => {
    setupHeaderScroll();
    setupActiveNav();  
    updateCartUI();

    await cargarProductos();

    if (document.getElementById('product-grid')) {
        renderProducts(products);
        const categoria = new URLSearchParams(window.location.search).get('categoria');
        if (categoria) filterCatalog(categoria);
    }

    if (typeof initProductPage === 'function') initProductPage();

    // Con los productos ya dibujados, recién se restaura el scroll
    restoreScroll();
    document.documentElement.classList.remove('restoring');
});


// Menú: marca en cuál página o sección estás
function setupActiveNav() {
    const links = document.querySelectorAll('#nav-links a, #mobile-menu .mobile-menu-nav a');
    if (!links.length) return;

    const setActive = (key) => {
        links.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === key));
    };

    // Catálogo: es otra página
    if (location.pathname.endsWith('catalogo.html')) {
        setActive('catalogo.html');
        return;
    }

    // Inicio: según la sección que se ve al hacer scroll
    const ids = ['inicio', 'nosotros', 'ubicacion', 'contacto'];
    const update = () => {
        const linea = window.innerHeight * 0.35;
        let actual = 'inicio';
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el && el.getBoundingClientRect().top <= linea) actual = id;
        });
        setActive('#' + actual);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
}

// Header: efecto al hacer scroll (.scrolled) + se pega arriba al bajar (.header-up)
function setupHeaderScroll() {
    const header = document.getElementById('main-header');
    if (!header) return;
    let stuck = false;

    // Desactiva las transiciones solo durante la primera aplicación
    const noAnim = document.createElement('style');
    noAnim.textContent = '.no-anim, .no-anim * { transition: none !important; animation: none !important; }';
    document.head.appendChild(noAnim);

const apply = () => {
    const y = window.scrollY;
    if (!stuck && y > 40) stuck = true;
    else if (stuck && y < 15) stuck = false;

    const forced = document.body.classList.contains('page-producto');
    header.classList.toggle('scrolled', stuck || forced);
    header.classList.toggle('header-up', stuck || forced);
};
    // Estado inicial: sin animación
    header.classList.add('no-anim');
    apply();
    requestAnimationFrame(() => requestAnimationFrame(() => header.classList.remove('no-anim')));

    // El navegador restaura el scroll un poco después de cargar: se resincroniza sin animar
    window.addEventListener('load', () => {
        header.classList.add('no-anim');
        apply();
        requestAnimationFrame(() => requestAnimationFrame(() => header.classList.remove('no-anim')));
    });

    window.addEventListener('scroll', apply, { passive: true });
}

// (sin botones "Detalle" y "Comprar": toda la tarjeta abre el detalle del producto)
function renderProducts(items) {
    const grid = document.getElementById('product-grid');
    grid.innerHTML = '';

    items.forEach((product, i) => {
        const card = document.createElement('div');
        card.className = "group product-card";
        card.style.cursor = "pointer";
        card.setAttribute('onclick', `openProductModal('${product.id}')`);

        card.innerHTML = `
            <div class="js-div">
               <img src="${product.img}" alt="${product.name}" class="js-img" loading="${i < 4 ? 'eager' : 'lazy'}" decoding="async">
                <span class="js-span">
                    ${product.category}
                </span>
                <div class="js-div-2">
                    <span class="js-span-2">
                        Ver Detalle
                    </span>
                </div>
            </div>

            <div class="js-div-3">
                <div>
                    <div class="js-div-4">
                        <h3 class="js-h3">${product.name}</h3>
                    </div>
                    <p class="js-p">${product.price}</p>

                    <!-- Color Dot Preview -->
                    <div class="js-div-5">
                        ${product.colors.map(color => `<span class="js-span-3" style="background-color: ${color}"></span>`).join('')}
                        <span class="js-span-4">+ colores</span>
                    </div>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Filter Products by Category
const CATEGORIAS_VALIDAS = {
    all: 'all', todos: 'all',
    body: 'body', bodies: 'body', bodys: 'body',
    polo: 'polo', polos: 'polo'
};

function filterCatalog(category) {
    // Si la categoría no existe, se muestran todos los productos
    const cat = CATEGORIAS_VALIDAS[String(category || 'all').toLowerCase()] || 'all';

    // En el index no hay grilla: ir al catálogo con la categoría
    if (!document.getElementById('product-grid')) {
        window.location.href = 'catalogo.html?categoria=' + cat;
        return;
    }

    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`filter-${cat}`);
    if (activeBtn) activeBtn.classList.add('active');

    renderProducts(cat === 'all' ? products : products.filter(p => p.type === cat));
}


// Product Modal Logic

// Selección actual en el modal
let selectedColorIdx = 0;
let selectedSize = null;

function renderModalOptions() {
    const p = currentProduct;
    const variante = p.variantes[selectedColorIdx] || { tallas: {} };

    // La foto cambia según el color elegido
    document.getElementById('modal-img').src = variante.imagen || p.img;

    // Colores
    document.getElementById('modal-colors').innerHTML = p.variantes.map((v, i) => {
        const activo = i === selectedColorIdx;
        return `
        <div class="js-div-7" onclick="selectColor(${i})" style="cursor:pointer;">
            <span class="js-span-5" style="background-color: ${p.colors[i]}; ${activo ? 'outline: 2px solid #121212; outline-offset: 2px;' : ''}"></span>
            <span style="${activo ? 'font-weight: 600;' : ''}">${v.color}</span>
        </div>`;
    }).join('');

    // Tallas (las sin stock en ese color se ven tachadas y no se pueden elegir)
    document.getElementById('modal-sizes').innerHTML =
        ['S', 'M', 'L', 'XL'].map(t => {
            const agotada = !((variante.tallas || {})[t] > 0);
            const activa = t === selectedSize;
            const estilo = agotada
                ? 'opacity: .35; text-decoration: line-through; cursor: not-allowed;'
                : 'cursor: pointer;';
            return `<span class="js-span-6${activa ? ' size-activa' : ''}" style="${estilo}"${agotada ? '' : `onclick="selectSize('${t}')"`}>${t}</span>`;
        }).join('') +
        '<p id="size-error" style="display:none; color:#c0392b; font-size:13px; flex-basis:100%; width:100%; margin-top:6px;">Elige una talla para continuar.</p>';
}

function selectColor(i) {
    selectedColorIdx = i;
    const tallas = currentProduct.variantes[i].tallas || {};
    if (selectedSize && !(tallas[selectedSize] > 0)) selectedSize = null;
    renderModalOptions();
}

function selectSize(t) {
    selectedSize = t;
    console.log('Talla elegida:', t);
    renderModalOptions();
}

// Devuelve el producto con el color y la talla elegidos (o null si falta la talla)
function itemSeleccionado() {
    if (!selectedSize) {
        const err = document.getElementById('size-error');
        if (err) err.style.display = 'block';
        return null;
    }
    const v = currentProduct.variantes[selectedColorIdx] || {};
    const { variantes, ...base } = currentProduct;
    return { ...base, color: v.color || '', size: selectedSize, img: v.imagen || currentProduct.img };
}

function openProductModal(id) {
    window.location.href = 'producto.html?id=' + encodeURIComponent(id);
}


// Cart Drawer Logic
function addToCart(product, silent) {
    const qty = product.qty || 1;
    const igual = cart.find(i =>
        i.id === product.id && i.color === product.color && i.size === product.size
    );
    if (igual) igual.qty = (igual.qty || 1) + qty;
    else cart.push({ ...product, qty });
    updateCartUI();
    if (!silent) showToast(`¡${product.name} agregado a la bolsa!` + (qty > 1 ? ` (x${qty})` : ''));
}

function changeQty(index, delta) {
    const item = cart[index];
    if (!item) return;
    item.qty = Math.max(1, Math.min(10, (item.qty || 1) + delta));
    updateCartUI();
}

// Modal de confirmación para quitar un producto de la bolsa
(function () {
    const s = document.createElement('style');
    s.textContent = `
    .cf-overlay{position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.5);display:none;align-items:center;justify-content:center;padding:20px}
    .cf-ok{background:#e6007e;color:#fff;border:2px solid #e6007e}
    .cart-envio-aviso{margin:0 0 12px;padding:10px 12px;border-radius:0px;background:none;color:#c4006c;font-size:12.5px;font-weight:600;line-height:1.4;text-align:center}
    .cf-overlay.open{display:flex}
    .cf-box{background:#fff;border-radius:20px;max-width:380px;width:100%;padding:28px 24px 24px;text-align:center;box-shadow:0 20px 50px rgba(0,0,0,.25);font-family:'Plus Jakarta Sans',sans-serif}
    .cf-icon{width:56px;height:56px;border-radius:50%;background:#fdecf5;color:#e6007e;display:flex;align-items:center;justify-content:center;font-size:22px;margin:0 auto 14px}
    .cf-title{font-family:'Cormorant Garamond',serif;font-size:26px;font-weight:600;margin:0 0 6px;color:#121212}
    .cf-text{font-size:14px;color:#666;line-height:1.5;margin:0 0 22px}
    .cf-actions{display:flex;gap:10px}
    .cf-btn{flex:1;height:48px;border-radius:999px;font-family:inherit;font-size:13px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;cursor:pointer}
    .cf-cancel{background:#fff;color:#121212;border:2px solid #121212}
    .cf-ok{background:#e6007e;color:#fff;border:2px solid #e6007e}`;
    document.head.appendChild(s);
})();

let cfIndex = null;

function getConfirmModal() {
    let ov = document.getElementById('cf-overlay');
    if (ov) return ov;
    ov = document.createElement('div');
    ov.id = 'cf-overlay';
    ov.className = 'cf-overlay';
    ov.innerHTML = `
        <div class="cf-box" role="dialog" aria-modal="true">
            <div class="cf-icon"><i class="fa-solid fa-trash-can"></i></div>
            <h3 class="cf-title">¿Quitar de la bolsa?</h3>
            <p class="cf-text" id="cf-text"></p>
            <div class="cf-actions">
                <button type="button" class="cf-btn cf-cancel" id="cf-cancel">Cancelar</button>
                <button type="button" class="cf-btn cf-ok" id="cf-ok">Sí, quitar</button>
            </div>
        </div>`;
    document.body.appendChild(ov);
    ov.addEventListener('mousedown', e => { if (e.target === ov) closeConfirm(); });
    document.getElementById('cf-cancel').onclick = closeConfirm;
    document.getElementById('cf-ok').onclick = () => {
        if (cfIndex !== null) { cart.splice(cfIndex, 1); updateCartUI(); }
        closeConfirm();
    };
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeConfirm(); });
    return ov;
}

function closeConfirm() {
    cfIndex = null;
    const ov = document.getElementById('cf-overlay');
    if (ov) ov.classList.remove('open');
}

function removeFromCart(index) {
    const item = cart[index];
    if (!item) return;
    cfIndex = index;
    const detalle = [item.color, item.size && 'Talla ' + item.size].filter(Boolean).join(' · ');
    const ov = getConfirmModal();
    document.getElementById('cf-text').textContent =
        `Vas a quitar "${item.name}"${detalle ? ' (' + detalle + ')' : ''} de tu bolsa.`;
    ov.classList.add('open');
}

function updateCartUI() {
    try { localStorage.setItem('franchesca_cart', JSON.stringify(cart)); } catch (e) {}
    const cartCount = document.getElementById('cart-count');
    const cartItems = document.getElementById('cart-items');
    const cartFooter = document.getElementById('cart-footer');

   cartCount.innerText = cart.reduce((s, i) => s + (i.qty || 1), 0);

    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="cart-items-p">Tu bolsa está vacía actualmente.</p>';
        cartFooter.classList.add('is-hidden');
        return;
    }

    cartFooter.classList.remove('is-hidden');
      if (!document.getElementById('cart-envio-aviso')) {
        const aviso = document.createElement('p');
        aviso.id = 'cart-envio-aviso';
        aviso.className = 'cart-envio-aviso';
        aviso.textContent = 'Envío gratis desde S/ 199 en Lima y S/ 249 a provincias seleccionadas.';
        cartFooter.insertBefore(aviso, cartFooter.firstChild);
    }
    const unidades = cart.reduce((s, i) => s + (i.qty || 1), 0);
const total = cart.reduce((s, i) =>
    s + (parseFloat(String(i.price).replace(/[^\d.]/g, '')) || 0) * (i.qty || 1), 0);
document.getElementById('cart-total').innerHTML =
    `<span>S/ ${total.toFixed(2)}</span>` +
    `<span>(${unidades} ${unidades === 1 ? 'producto' : 'productos'})</span>`;
    cartItems.innerHTML = cart.map((item, idx) => `
        <div class="js-div-8">
            <div class="js-div-9">
             <img src="${item.img}" alt="${item.name}" class="js-img-2" loading="lazy" decoding="async">
                <div>
                    <h4 class="js-h4">${item.name}</h4>
                    <p class="js-p-2">${item.price}</p>
                    <div style="display:flex; align-items:center; gap:10px; margin-top:6px;">
    <button onclick="changeQty(${idx}, -1)" style="width:26px;height:26px;border:1px solid #d9d9d9;border-radius:50%;background:#fff;cursor:pointer;">&minus;</button>
    <span style="font-weight:600;">${item.qty || 1}</span>
    <button onclick="changeQty(${idx}, 1)" style="width:26px;height:26px;border:1px solid #d9d9d9;border-radius:50%;background:#fff;cursor:pointer;">+</button>
</div>
                    <p class="js-p-2">${[item.color, item.size && 'Talla ' + item.size].filter(Boolean).join(' · ')}</p>
                </div>
            </div>
            <button onclick="removeFromCart(${idx})" class="js-button-2">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        </div>
    `).join('');
}


// Search Overlay Function
function handleSearch() {
    const query = document.getElementById('search-input').value.toLowerCase().trim();
    const resultsContainer = document.getElementById('search-results');

    if (query === '') {
        resultsContainer.innerHTML = '';
        return;
    }

    const matches = products.filter(p => p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query) || p.desc.toLowerCase().includes(query));

    if (matches.length === 0) {
        resultsContainer.innerHTML = '<p class="js-p-3">No encontramos modelos para esa búsqueda.</p>';
        return;
    }

    resultsContainer.innerHTML = matches.map(p => `
        <div onclick="openProductModal('${p.id}'); toggleSearchModal();" class="js-div-10">
           <img src="${p.img}" class="js-img-3" loading="lazy" decoding="async">
            <div>
                <p class="js-p-4">${p.name}</p>
                <p class="js-p-5">${p.category}</p>
            </div>
        </div>
    `).join('');
}

// UI Helpers & Drawer Toggles (el estado visual lo controla la clase .is-open en styles.css)
function toggleMobileMenu() {
    document.getElementById('mobile-menu').classList.toggle('is-open');
}

function toggleCartDrawer() {
    document.getElementById('cart-drawer').classList.toggle('is-open');
}

function toggleSearchModal() {
    const modal = document.getElementById('search-modal');
    modal.classList.toggle('is-open');
    if (modal.classList.contains('is-open')) {
        document.getElementById('search-input').focus();
    }
}

function openModal(id) {
    const m = document.getElementById(id);
    if (m) m.classList.add('is-open');
}

function closeModal(id) {
    const m = document.getElementById(id);
    if (m) m.classList.remove('is-open');
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    document.getElementById('toast-msg').innerText = msg;
    toast.classList.add('is-open');
    setTimeout(() => {
        toast.classList.remove('is-open');
    }, 3000);
}

// Conservar la posición del scroll al actualizar
const scrollKey = 'scrollY_' + location.pathname;

window.addEventListener('pagehide', () => {
    try { sessionStorage.setItem(scrollKey, window.scrollY); } catch (e) {}
});

function restoreScroll() {
    const nav = performance.getEntriesByType('navigation')[0];
    if (!nav || nav.type !== 'reload') return;
    const y = parseInt(sessionStorage.getItem(scrollKey), 10);
    if (y) window.scrollTo({ top: y, behavior: 'instant' });
}

function openCheckout() {
    if (!cart.length) return;
    window.location.href = 'checkout.html';
}

function sendCartToWhatsApp() {
    openCheckout();
}
