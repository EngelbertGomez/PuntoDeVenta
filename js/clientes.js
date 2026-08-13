const apiClientesUrl = "http://192.168.0.104:5053/api/Clientes";
let clienteEnEdicionId = null; 

document.addEventListener("DOMContentLoaded", () => {
    cargarClientes();

    const empresaForm = document.getElementById("empresaForm");
    const btnSubmit = empresaForm.querySelector("button[type='submit']");
    
    if (empresaForm) {
        empresaForm.addEventListener("submit", function(event) {
            event.preventDefault();

            const clienteData = {
                rnc: document.getElementById("rnc").value.trim(),
                nombreComercial: document.getElementById("nombreComercial").value.trim(),
                limiteCredito: parseFloat(document.getElementById("limiteCredito").value),
                telefono: document.getElementById("telefono").value.trim(),
                estadoActivo: true
            };

            if (clienteEnEdicionId) {
                // MODO EDICIÓN (PUT)
                clienteData.id = clienteEnEdicionId;
                
                fetch(`${apiClientesUrl}/${clienteEnEdicionId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(clienteData)
                })
                .then(respuesta => {
                    if (!respuesta.ok) throw new Error("Error al actualizar");
                    
                    clienteEnEdicionId = null;
                    btnSubmit.textContent = "Actualizar Empresa";
                    empresaForm.reset();
                    cargarClientes();
                })
                .catch(error => alert("Hubo un error al editar la empresa."));
                
            } else {
                // MODO CREACIÓN (POST)
                fetch(apiClientesUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(clienteData)
                })
                .then(respuesta => {
                    if (!respuesta.ok) throw new Error("Error o RNC duplicado");
                    return respuesta.json();
                })
                .then(datos => {
                    empresaForm.reset();
                    cargarClientes(); 
                })
                .catch(error => alert("Hubo un error al registrar. Verifica que el RNC no esté duplicado."));
            }
        });
    }
});

// ==========================================
// FUNCIÓN GET: DIBUJAR LA TABLA ALINEADA
// ==========================================
function cargarClientes() {
    fetch(apiClientesUrl)
    .then(respuesta => {
        if (!respuesta.ok) throw new Error("Error al conectar con la base de datos");
        return respuesta.json();
    })
    .then(datos => {
        const tabla = document.getElementById("tablaEmpresas");
        tabla.innerHTML = ""; 
        
        datos.forEach(cliente => {
            const estadoVisual = cliente.estadoActivo 
                ? `<span style="color: var(--success); font-weight: 600;">Activo</span>` 
                : `<span style="color: #dc2626; font-weight: 600;">Inactivo</span>`;

            const limiteFormateado = `RD$ ${cliente.limiteCredito.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`;
            
            // Temporalmente el balance disponible refleja el límite total
            const balanceFormateado = `RD$ ${cliente.limiteCredito.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`;

            // Escapamos las comillas para poder pasar el objeto JSON en el onclick
            const clienteJson = JSON.stringify(cliente).replace(/"/g, '&quot;');

            // Agregamos la celda extra para que coincida exactamente con las 6 columnas del HTML
            const fila = `
                <tr>
                    <td>${cliente.rnc}</td>
                    <td style="font-weight: 600; color: var(--primary);">${cliente.nombreComercial}</td>
                    <td>${limiteFormateado}</td>
                    <td style="font-weight: 600; color: var(--success);">${balanceFormateado}</td>
                    <td>${estadoVisual}</td>
                    <td style="display: flex; gap: 8px;">
                        <button onclick="prepararEdicion(${clienteJson})" style="background-color: #e0f2fe; color: var(--accent); border: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 700; cursor: pointer;">Editar</button>
                        <button onclick="borrarCliente(${cliente.id})" style="background-color: #fee2e2; color: #dc2626; border: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 700; cursor: pointer;">Borrar</button>
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
function prepararEdicion(cliente) {
    document.getElementById("rnc").value = cliente.rnc;
    document.getElementById("nombreComercial").value = cliente.nombreComercial;
    document.getElementById("limiteCredito").value = cliente.limiteCredito;
    document.getElementById("telefono").value = cliente.telefono;
    
    clienteEnEdicionId = cliente.id;
    
    const btnSubmit = document.querySelector("#empresaForm button[type='submit']");
    btnSubmit.textContent = "Actualizar Empresa";
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==========================================
// FUNCIÓN DELETE
// ==========================================
function borrarCliente(id) {
    if (confirm("¿Estás seguro de que deseas eliminar esta empresa de tu directorio B2B?")) {
        fetch(`${apiClientesUrl}/${id}`, {
            method: "DELETE"
        })
        .then(respuesta => {
            if (!respuesta.ok) throw new Error("No se pudo eliminar");
            cargarClientes();
        })
        .catch(error => alert("Error al intentar borrar el cliente del sistema."));
    }
}