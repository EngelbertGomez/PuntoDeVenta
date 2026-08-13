// Apunta a tu backend local de C#
const apiBaseUrl = "http://192.168.0.104:5053/api/Productos";

// Envolvemos todo en un DOMContentLoaded para asegurar que el HTML cargó primero
document.addEventListener("DOMContentLoaded", () => {
    
    // 1. Cargar productos al abrir la página (El GET)
    cargarProductos();

    // 2. Lógica para guardar un nuevo producto (El POST)
    const productForm = document.getElementById("productForm");
    
    if (productForm) {
        productForm.addEventListener("submit", function(event) {
            event.preventDefault();

            // Construir el objeto JSON
            const nuevoProducto = {
                nombre: document.getElementById("nombre").value,
                codigoBarras: document.getElementById("codigoBarras").value,
                precio: parseFloat(document.getElementById("precio").value),
                stock: parseInt(document.getElementById("stock").value)
            };

            // Enviar a la base de datos
            fetch(apiBaseUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(nuevoProducto)
            })
            .then(respuesta => {
                if (!respuesta.ok) throw new Error("Error en la red o código duplicado");
                return respuesta.json();
            })
            .then(datos => {
                console.log("¡Producto guardado exitosamente!", datos);
                
                // Limpiar los inputs
                productForm.reset();
                
                // Recargar la tabla automáticamente
                cargarProductos(); 
            })
            .catch(error => {
                console.error("Fallo al guardar:", error);
                alert("Hubo un error al guardar el producto. Revisa la consola para más detalles.");
            });
        });
    }
});

// Función aislada para hacer el GET y renderizar la tabla
function cargarProductos() {
    fetch(apiBaseUrl)
    .then(respuesta => {
        if (!respuesta.ok) throw new Error("Error al obtener el inventario");
        return respuesta.json();
    })
    .then(datos => {
        const tabla = document.getElementById("tablaProductos");
        tabla.innerHTML = ""; // Limpia data vieja
        
        datos.forEach(producto => {
            const fila = `
                <tr>
                    <td>${producto.id}</td>
                    <td>${producto.nombre}</td>
                    <td>${producto.codigoBarras}</td>
                    <td>$${producto.precio.toFixed(2)}</td>
                    <td>${producto.stock}</td>
                </tr>
            `;
            tabla.innerHTML += fila;
        });
    })
    .catch(error => console.error("Fallo al cargar la tabla:", error));
}