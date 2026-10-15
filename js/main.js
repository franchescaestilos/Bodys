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
    updateCartUI();

    await cargarProductos();

    if (document.getElementById('product-grid')) {
        renderProducts(products);
        const categoria = new URLSearchParams(window.location.search).get('categoria');
        if (categoria) filterCatalog(categoria);
    }
});


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
        header.classList.toggle('scrolled', stuck);
        header.classList.toggle('header-up', stuck);
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

// Render Product Catalog Cards
// (sin botones "Detalle" y "Comprar": toda la tarjeta abre el detalle del producto)
function renderProducts(items) {
    const grid = document.getElementById('product-grid');
    grid.innerHTML = '';

    items.forEach(product => {
        const card = document.createElement('div');
        card.className = "group product-card";
        card.style.cursor = "pointer";
        card.setAttribute('onclick', `openProductModal('${product.id}')`);

        card.innerHTML = `
            <div class="js-div">
                <img src="${product.img}" alt="${product.name}" class="js-img">
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
function filterCatalog(category) {
    // En el index no hay grilla: ir al catálogo con la categoría
    if (!document.getElementById('product-grid')) {
        window.location.href = 'catalogo.html?categoria=' + category;
        return;
    }

    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`filter-${category}`);
    if (activeBtn) activeBtn.classList.add('active');

    renderProducts(category === 'all' ? products : products.filter(p => p.type === category));
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
    currentProduct = products.find(p => p.id === id);
    if (!currentProduct) return;

    selectedColorIdx = 0;
    selectedSize = null;

    document.getElementById('modal-title').innerText = currentProduct.name;
    document.getElementById('modal-category').innerText = currentProduct.category;
    document.getElementById('modal-price').innerText = currentProduct.price;
    document.getElementById('modal-description').innerText = currentProduct.desc;

    renderModalOptions();

    // Comprar ahora: agrega a la bolsa y abre la bolsa
    document.getElementById('modal-buy-wa').onclick = () => {
        const item = itemSeleccionado();
        if (!item) return;
        cart.push(item);
        updateCartUI();
        closeModal('product-modal');
        document.getElementById('cart-drawer').classList.add('is-open');
    };

    // Agregar a la bolsa
    document.getElementById('modal-add-cart').onclick = () => {
        const item = itemSeleccionado();
        if (!item) return;
        addToCart(item);
        closeModal('product-modal');
    };

    openModal('product-modal');
}


// Cart Drawer Logic
function addToCart(product) {
    cart.push(product);
    updateCartUI();
    showToast(`¡${product.name} agregado a la bolsa!`);
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartUI();
}

function updateCartUI() {
    try { localStorage.setItem('franchesca_cart', JSON.stringify(cart)); } catch (e) {}
    const cartCount = document.getElementById('cart-count');
    const cartItems = document.getElementById('cart-items');
    const cartFooter = document.getElementById('cart-footer');

    cartCount.innerText = cart.length;

    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="cart-items-p">Tu bolsa está vacía actualmente.</p>';
        cartFooter.classList.add('is-hidden');
        return;
    }

    cartFooter.classList.remove('is-hidden');
    cartItems.innerHTML = cart.map((item, idx) => `
        <div class="js-div-8">
            <div class="js-div-9">
                <img src="${item.img}" alt="${item.name}" class="js-img-2">
                <div>
                    <h4 class="js-h4">${item.name}</h4>
                    <p class="js-p-2">${item.price}</p>
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
            <img src="${p.img}" class="js-img-3">
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

window.addEventListener('DOMContentLoaded', restoreScroll);
window.addEventListener('load', () => {
    restoreScroll();
    requestAnimationFrame(() => document.documentElement.classList.remove('restoring'));
});