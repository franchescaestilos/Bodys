// Catalog Data
const products = [
    {
        id: 1,
        name: "Body Básico",
        category: "Body",
        type: "body",
        price: "Consultar precio",
      img: "img/polo_02_celeste.png",
        colors: ["#121212", "#ffffff", "#c59f85", "#81503e"],
        colorNames: ["Negro", "Blanco", "Nude", "Marrón"],
        sizes: ["S", "M", "L"],
        desc: "Body básico de corte estilizado con broche inferior de alta durabilidad. Elaborado en suplex de alta elasticidad."
    },
    {
        id: 2,
        name: "Body Escote",
        category: "Body",
        type: "body",
        price: "Consultar precio",
        img: "img/polo_01_negro.png",
        colors: ["#121212", "#e8c5b8", "#81503e"],
        colorNames: ["Negro", "Palo Rosa", "Chocolate"],
        sizes: ["S", "M"],
        desc: "Diseño sensual y elegante con escote pronunciado en V. Perfecto para eventos de noche y salidas casuales."
    },
    {
        id: 3,
        name: "Body Manga Larga",
        category: "Body",
        type: "body",
        price: "Consultar precio",
        img: "img/body_03_negro.png",
        colors: ["#121212", "#ffffff", "#3b82f6"],
        colorNames: ["Negro", "Blanco", "Azul"],
        sizes: ["S", "M", "L"],
        desc: "Body manga larga ideal para media estación o invierno. Ajuste anatómico que realza la silueta."
    },
    {
        id: 4,
        name: "Body Modelador",
        category: "Body",
        type: "body",
        price: "Consultar precio",
       img: "img/destacado-3.png",
        colors: ["#121212", "#c59f85"],
        colorNames: ["Negro", "Nude"],
        sizes: ["S", "M", "L"],
        desc: "Confección especial con compresión suave en la zona abdominal para una figura ultra moldeada."
    },
    {
        id: 5,
        name: "Polo Básico",
        category: "Polo",
        type: "polo",
        price: "Consultar precio",
      img: "img/body_04_rojo.jpeg",
        colors: ["#ffffff", "#121212", "#e8c5b8", "#10b981"],
        colorNames: ["Blanco", "Negro", "Rosa", "Verde"],
        sizes: ["S", "M", "L"],
        desc: "Polo para dama confeccionado en algodón reactivo de tacto suave. No pierde color ni forma al lavar."
    },
    {
        id: 6,
        name: "Polo Crop",
        category: "Polo",
        type: "polo",
        price: "Consultar precio",
      img: "img/destacado-1.png",
        colors: ["#ffffff", "#f59e0b", "#121212"],
        colorNames: ["Blanco", "Mostaza", "Negro"],
        sizes: ["S", "M"],
        desc: "Polo estilo crop top moderno, corte fresco y juvenil ideal para combinar con jeans de tiro alto."
    },
    {
        id: 7,
        name: "Polo Manga Larga",
        category: "Polo",
        type: "polo",
        price: "Consultar precio",
       img: "img/destacado-5.png",
        colors: ["#121212", "#ef4444", "#ffffff"],
        colorNames: ["Negro", "Rojo", "Blanco"],
        sizes: ["S", "M", "L"],
        desc: "Diseño atemporal con tela de pima estirable, cómodo, elegante y fácil de accesorizar."
    },
    {
        id: 8,
        name: "Polo Casual",
        category: "Polo",
        type: "polo",
        price: "Consultar precio",
       img: "img/destacado-3-a.jpeg",
        colors: ["#c59f85", "#121212", "#ffffff"],
        colorNames: ["Nude", "Negro", "Blanco"],
        sizes: ["S", "M", "L"],
        desc: "Polo versátil para uso diario en el trabajo o salidas casuales. Tela fresca y con caída suave."
    },
    {
        id: 9,
        name: "Body Modelador",
        category: "Body",
        type: "body",
        price: "Consultar precio",
       img: "img/body_02_beige.png",
        colors: ["#121212", "#c59f85"],
        colorNames: ["Negro", "Nude"],
        sizes: ["S", "M", "L"],
        desc: "Confección especial con compresión suave en la zona abdominal para una figura ultra moldeada."
    },
    {
        id: 10,
        name: "Polo Básico",
        category: "Polo",
        type: "polo",
        price: "Consultar precio",
      img: "img/body_03_beige.png",
        colors: ["#ffffff", "#121212", "#e8c5b8", "#10b981"],
        colorNames: ["Blanco", "Negro", "Rosa", "Verde"],
        sizes: ["S", "M", "L"],
        desc: "Polo para dama confeccionado en algodón reactivo de tacto suave. No pierde color ni forma al lavar."
    },
    {
        id: 11,
        name: "Polo Crop",
        category: "Polo",
        type: "polo",
        price: "Consultar precio",
      img: "img/body_01_humo.jpeg",
        colors: ["#ffffff", "#f59e0b", "#121212"],
        colorNames: ["Blanco", "Mostaza", "Negro"],
        sizes: ["S", "M"],
        desc: "Polo estilo crop top moderno, corte fresco y juvenil ideal para combinar con jeans de tiro alto."
    },
    {
        id: 12,
        name: "Polo Manga Larga",
        category: "Polo",
        type: "polo",
        price: "Consultar precio",
       img: "img/destacado-5.png",
        colors: ["#121212", "#ef4444", "#ffffff"],
        colorNames: ["Negro", "Rojo", "Blanco"],
        sizes: ["S", "M", "L"],
        desc: "Diseño atemporal con tela de pima estirable, cómodo, elegante y fácil de accesorizar."
    },
    {
        id: 13,
        name: "Polo Casual",
        category: "Polo",
        type: "polo",
        price: "Consultar precio",
       img: "img/polo_02_camello.png",
        colors: ["#c59f85", "#121212", "#ffffff"],
        colorNames: ["Nude", "Negro", "Blanco"],
        sizes: ["S", "M", "L"],
        desc: "Polo versátil para uso diario en el trabajo o salidas casuales. Tela fresca y con caída suave."
    },
    {
        id: 14,
        name: "Polo Crop",
        category: "Polo",
        type: "polo",
        price: "Consultar precio",
      img: "img/destacado-1.png",
        colors: ["#ffffff", "#f59e0b", "#121212"],
        colorNames: ["Blanco", "Mostaza", "Negro"],
        sizes: ["S", "M"],
        desc: "Polo estilo crop top moderno, corte fresco y juvenil ideal para combinar con jeans de tiro alto."
    },
    {
        id: 15,
        name: "Polo Manga Larga",
        category: "Polo",
        type: "polo",
        price: "Consultar precio",
       img: "img/body_01_blanco.png",
        colors: ["#121212", "#ef4444", "#ffffff"],
        colorNames: ["Negro", "Rojo", "Blanco"],
        sizes: ["S", "M", "L"],
        desc: "Diseño atemporal con tela de pima estirable, cómodo, elegante y fácil de accesorizar."
    },
    {
        id: 16,
        name: "Polo Casual",
        category: "Polo",
        type: "polo",
        price: "Consultar precio",
       img: "img/polo_01_beige.png",
        colors: ["#c59f85", "#121212", "#ffffff"],
        colorNames: ["Nude", "Negro", "Blanco"],
        sizes: ["S", "M", "L"],
        desc: "Polo versátil para uso diario en el trabajo o salidas casuales. Tela fresca y con caída suave."
    }
    
];

let cart = [];
let currentProduct = null;

// Initialize Page
window.addEventListener('DOMContentLoaded', () => {
    setupHeaderScroll(); // primero, para que nada lo bloquee

    if (document.getElementById('product-grid')) {
        renderProducts(products);
        const categoria = new URLSearchParams(window.location.search).get('categoria');
        if (categoria) filterCatalog(categoria);
    }
});


// Header: efecto al hacer scroll (.scrolled) + se pega arriba al bajar (.header-up)
function setupHeaderScroll() {
    const header = document.getElementById('main-header');
    let stuck = false;

    const onScroll = () => {
        const y = window.scrollY;

        // Histéresis: se pega al pasar 40px y solo se suelta al volver casi arriba
        if (!stuck && y > 40) stuck = true;
        else if (stuck && y < 15) stuck = false;

        header.classList.toggle('scrolled', stuck);
        header.classList.toggle('header-up', stuck);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
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
        card.setAttribute('onclick', `openProductModal(${product.id})`);

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
function openProductModal(id) {
    currentProduct = products.find(p => p.id === id);
    if (!currentProduct) return;

    document.getElementById('modal-img').src = currentProduct.img;
    document.getElementById('modal-title').innerText = currentProduct.name;
    document.getElementById('modal-category').innerText = currentProduct.category;
    document.getElementById('modal-price').innerText = currentProduct.price;
    document.getElementById('modal-description').innerText = currentProduct.desc;

    // Render colors
    const colorsContainer = document.getElementById('modal-colors');
    colorsContainer.innerHTML = currentProduct.colors.map((c, i) => `
        <div class="js-div-7">
            <span class="js-span-5" style="background-color: ${c}"></span>
            <span>${currentProduct.colorNames[i] || 'Color'}</span>
        </div>
    `).join('');

    // Render sizes
    const sizesContainer = document.getElementById('modal-sizes');
    sizesContainer.innerHTML = currentProduct.sizes.map(s => `
        <span class="js-span-6">${s}</span>
    `).join('');

    // WhatsApp direct buy button
    const waBtn = document.getElementById('modal-buy-wa');
    waBtn.onclick = () => {
        const msg = `Hola Francesca Estilos, me interesa el modelo: *${currentProduct.name}* (Categoría: ${currentProduct.category}). Quisiera consultar disponiblidad de colores y precio.`;
        window.open(`https://wa.me/51944737700?text=${encodeURIComponent(msg)}`, '_blank');
    };

    // Add to Cart button
    const addCartBtn = document.getElementById('modal-add-cart');
    addCartBtn.onclick = () => {
        addToCart(currentProduct);
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
                </div>
            </div>
            <button onclick="removeFromCart(${idx})" class="js-button-2">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        </div>
    `).join('');
}

function sendCartToWhatsApp() {
    if (cart.length === 0) return;
    const itemsList = cart.map((item, i) => `${i + 1}. *${item.name}* (${item.category})`).join('%0A');
    const msg = `Hola Francesca Estilos, quisiera consultar disponibilidad y precios para mi lista de prendas:%0A%0A${itemsList}%0A%0A¿Me podrían brindar información?`;
    window.open(`https://wa.me/51944737700?text=${msg}`, '_blank');
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
        <div onclick="openProductModal(${p.id}); toggleSearchModal();" class="js-div-10">
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