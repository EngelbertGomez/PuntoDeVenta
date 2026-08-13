const apiBaseUrl = "http://192.168.0.104:5053/api/Productos";
let productoEnEdicionId = null; // Variable clave para saber en qué modo estamos (Crear vs Editar)

document.addEventListener("DOMContentLoaded", () => {
    cargarProductos();

    const productForm = document.getElementById("productForm");
    const btnSubmit = productForm.querySelector("button[type='submit']");
    
    if (productForm) {
        productForm.addEventListener("submit", function(event) {
            event.preventDefault();

            // Recolectamos la data del formulario
            const productoData = {
                nombre: document.getElementById("nombre").value,
                codigoBarras: document.getElementById("codigoBarras").value,
                precio: parseFloat(document.getElementById("precio").value),
                stock: parseInt(document.getElementById("stock").value)
            };

            if (productoEnEdicionId) {
                // ==========================================
                // MODO EDICIÓN (PUT)
                // ==========================================
                productoData.id = productoEnEdicionId; // C# requiere que el ID vaya en el body
                
                fetch(`${apiBaseUrl}/${productoEnEdicionId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(productoData)
                })
                .then(respuesta => {
                    if (!respuesta.ok) throw new Error("Error al actualizar");
                    
                    // Reseteamos el formulario y volvemos al modo "Creación"
                    productoEnEdicionId = null;
                    btnSubmit.textContent = "Guardar Producto en Base de Datos";
                    productForm.reset();
                    cargarProductos();
                })
                .catch(error => alert("Hubo un error al editar el producto."));
                
            } else {
                // ==========================================
                // MODO CREACIÓN (POST)
                // ==========================================
                fetch(apiBaseUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(productoData)
                })
                .then(respuesta => {
                    if (!respuesta.ok) throw new Error("Error en la red o código duplicado");
                    return respuesta.json();
                })
                .then(datos => {
                    productForm.reset();
                    cargarProductos(); 
                })
                .catch(error => alert("Hubo un error al guardar el producto. Verifica que el código no esté duplicado."));
            }
        });
    }
});

// ==========================================
// FUNCIÓN GET: DIBUJAR LA TABLA CON BOTONES
// ==========================================
function cargarProductos() {
    fetch(apiBaseUrl)
    .then(respuesta => {
        if (!respuesta.ok) throw new Error("Error al obtener el inventario");
        return respuesta.json();
    })
    .then(datos => {
        const tabla = document.getElementById("tablaProductos");
        tabla.innerHTML = ""; 
        
        datos.forEach(producto => {
            // Pasamos el objeto completo a la función prepararEdicion
            const fila = `
                <tr>
                    <td>${producto.id}</td>
                    <td>${producto.nombre}</td>
                    <td>${producto.codigoBarras}</td>
                    <td>$${producto.precio.toFixed(2)}</td>
                    <td>${producto.stock}</td>
                    <td>
                        <button onclick='prepararEdicion(${JSON.stringify(producto)})' style="background-color: var(--accent); padding: 6px 12px; font-size: 12px; width: auto; margin-right: 5px;">Editar</button>
                        <button onclick="borrarProducto(${producto.id})" style="background-color: #dc2626; padding: 6px 12px; font-size: 12px; width: auto;">Borrar</button>
                    </td>
                </tr>
            `;
            tabla.innerHTML += fila;
        });
    })
    .catch(error => console.error("Fallo al cargar la tabla:", error));
}

// ==========================================
// FUNCIÓN PARA LLENAR EL FORMULARIO (PRE-EDITAR)
// ==========================================
function prepararEdicion(producto) {
    // 1. Subimos los datos actuales a los inputs
    document.getElementById("nombre").value = producto.nombre;
    document.getElementById("codigoBarras").value = producto.codigoBarras;
    document.getElementById("precio").value = producto.precio;
    document.getElementById("stock").value = producto.stock;
    
    // 2. Guardamos el ID que estamos editando en memoria
    productoEnEdicionId = producto.id;
    
    // 3. Le avisamos al usuario cambiando el texto del botón
    const btnSubmit = document.querySelector("#productForm button[type='submit']");
    btnSubmit.textContent = "Actualizar Producto";
    
    // 4. Hacemos un scroll suave hacia arriba para que el usuario vea el formulario
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==========================================
// FUNCIÓN DELETE: BORRAR DESDE LA WEB
// ==========================================
function borrarProducto(id) {
    if (confirm("¿Estás seguro de que deseas eliminar este producto?")) {
        fetch(`${apiBaseUrl}/${id}`, {
            method: "DELETE"
        })
        .then(respuesta => {
            if (!respuesta.ok) throw new Error("No se pudo eliminar");
            cargarProductos();
        })
        .catch(error => alert("Error al intentar borrar el producto."));
    }
}