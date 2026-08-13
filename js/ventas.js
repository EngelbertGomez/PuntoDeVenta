// URLs de tu API local
const apiProductosUrl = "http://192.168.0.104:5053/api/Productos";
const apiVentasUrl = "http://192.168.0.104:5053/api/Ventas";

let inventario = []; // Guardará todo lo que traiga la base de datos
let carrito = [];    // Guardará lo que el cliente va a comprar

// Al cargar la página, traemos los productos de inmediato
document.addEventListener("DOMContentLoaded", () => {
    cargarInventario();
});

// ==========================================
// 1. CARGAR Y RENDERIZAR PRODUCTOS (BASE DE DATOS)
// ==========================================
function cargarInventario() {
    fetch(apiProductosUrl)
    .then(respuesta => {
        if (!respuesta.ok) throw new Error("Error al obtener el inventario");
        return respuesta.json();
    })
    .then(datos => {
        inventario = datos;
        renderizarTarjetasProductos();
    })
    .catch(error => console.error("Error cargando productos:", error));
}

function renderizarTarjetasProductos() {
    const grid = document.getElementById("productsGrid");
    grid.innerHTML = "";

    inventario.forEach(producto => {
        // Lógica visual para el stock
        let stockClass = "";
        let btnDisabled = "";
        let btnText = "Agregar al Carrito";

        if (producto.stock === 0) {
            stockClass = "out";
            btnDisabled = "disabled";
            btnText = "Agotado";
        } else if (producto.stock <= 5) {
            stockClass = "low";
        }

        const card = `
            <div class="product-card">
                <div class="product-sku">${producto.codigoBarras}</div>
                <div class="product-name">${producto.nombre}</div>
                <div class="product-price">RD$ ${producto.precio.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</div>
                <div class="product-stock ${stockClass}">Stock: ${producto.stock}</div>
                <button class="btn-add" ${btnDisabled} onclick="agregarAlCarrito(${producto.id})">
                    ${btnText}
                </button>
            </div>
        `;
        grid.innerHTML += card;
    });
}

// ==========================================
// 2. LÓGICA DEL CARRITO
// ==========================================
function agregarAlCarrito(productoId) {
    // Buscamos el producto en nuestro catálogo cargado
    const producto = inventario.find(p => p.id === productoId);
    if (!producto) return;

    // Verificamos si ya lo agregamos antes al carrito
    const itemEnCarrito = carrito.find(item => item.id === productoId);

    if (itemEnCarrito) {
        if (itemEnCarrito.cantidad < producto.stock) {
            itemEnCarrito.cantidad++;
        } else {
            alert(`Stock insuficiente. El límite es ${producto.stock} unidades.`);
        }
    } else {
        carrito.push({
            id: producto.id,
            nombre: producto.nombre,
            precio: producto.precio,
            stock: producto.stock,
            cantidad: 1
        });
    }
    
    renderizarCarrito();
}

function actualizarCantidad(productoId, nuevaCantidad) {
    const item = carrito.find(i => i.id === productoId);
    if (!item) return;

    let cant = parseInt(nuevaCantidad);
    if (isNaN(cant) || cant <= 0) {
        eliminarDelCarrito(productoId);
        return;
    }

    if (cant > item.stock) {
        alert(`Stock insuficiente. Solo tenemos ${item.stock} unidades.`);
        item.cantidad = item.stock;
    } else {
        item.cantidad = cant;
    }
    
    renderizarCarrito();
}

function cambiarCantidadConBoton(productoId, incremento) {
    const item = carrito.find(i => i.id === productoId);
    if (item) {
        actualizarCantidad(productoId, item.cantidad + incremento);
    }
}

function eliminarDelCarrito(productoId) {
    carrito = carrito.filter(item => item.id !== productoId);
    renderizarCarrito();
}

function vaciarCarrito() {
    if (carrito.length > 0 && confirm("¿Seguro que deseas vaciar el carrito?")) {
        carrito = [];
        renderizarCarrito();
    }
}

// ==========================================
// 3. RENDERIZAR EL PANEL DEL CARRITO
// ==========================================
function renderizarCarrito() {
    const container = document.getElementById("cartItems");
    const totalText = document.getElementById("cartTotalText");
    
    if (carrito.length === 0) {
        container.innerHTML = '<div class="cart-empty-msg">Seleccione un producto para agregarlo a la cuenta.</div>';
        totalText.textContent = "RD$ 0.00";
        return;
    }

    container.innerHTML = "";
    let total = 0;

    carrito.forEach(item => {
        const subtotal = item.precio * item.cantidad;
        total += subtotal;

        const htmlItem = `
            <div class="cart-item">
                <div class="cart-item-top">
                    <div class="cart-item-name">${item.nombre}</div>
                    <div class="cart-item-subtotal">RD$ ${subtotal.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</div>
                </div>
                <div class="cart-item-bottom">
                    <div class="cart-item-price">RD$ ${item.precio.toLocaleString('es-DO', { minimumFractionDigits: 2 })} c/u</div>
                    <div class="cart-item-actions">
                        <button class="btn-qty" onclick="cambiarCantidadConBoton(${item.id}, -1)">-</button>
                        <input type="number" class="qty-input" value="${item.cantidad}" onchange="actualizarCantidad(${item.id}, this.value)">
                        <button class="btn-qty" onclick="cambiarCantidadConBoton(${item.id}, 1)">+</button>
                        <button class="btn-remove" onclick="eliminarDelCarrito(${item.id})">×</button>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += htmlItem;
    });

    totalText.textContent = `RD$ ${total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`;
}

// ==========================================
// 4. PROCESAR PAGO (GUARDAR EN SQL Y ABRIR PDF)
// ==========================================
function procesarPago() {
    if (carrito.length === 0) {
        alert("El carrito está vacío. Agregue productos antes de procesar el pago.");
        return;
    }

    const btnCheckout = document.querySelector(".btn-checkout");
    btnCheckout.disabled = true;
    btnCheckout.textContent = "Procesando...";

    // Estructura que espera tu API de C#
    const nuevaVenta = {
        tipoNcf: document.getElementById("tipoNcf").value,
        metodoPago: document.getElementById("metodoPago").value,
        clienteAutocash: document.getElementById("clienteAutocash").value || "",
        total: carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0),
        detalles: carrito.map(item => ({
            productoId: item.id,
            cantidad: item.cantidad,
            precioUnitario: item.precio,
            subtotal: item.precio * item.cantidad
        }))
    };

    fetch(apiVentasUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevaVenta)
    })
    .then(respuesta => {
        if (!respuesta.ok) throw new Error("Error en el servidor al guardar la factura.");
        return respuesta.json();
    })
    .then(ventaGuardada => {
        // Abrimos el PDF
        window.open(`${apiVentasUrl}/${ventaGuardada.id}/pdf`, "_blank");
        
        // Limpiamos la caja registradora y recargamos el inventario 
        // para que las tarjetas reflejen el nuevo stock disminuido
        carrito = [];
        document.getElementById("clienteAutocash").value = "";
        renderizarCarrito();
        cargarInventario(); 
        
        btnCheckout.disabled = false;
        btnCheckout.textContent = "Procesar Pago";
    })
    .catch(error => {
        console.error("Fallo:", error);
        alert("Hubo un error al procesar el pago.");
        btnCheckout.disabled = false;
        btnCheckout.textContent = "Procesar Pago";
    });
}