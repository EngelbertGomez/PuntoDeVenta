const apiReportesUrl = "http://192.168.0.104:5053/api/Reportes/resumen";

document.addEventListener("DOMContentLoaded", () => {
    cargarDatosReporte();
});

function cargarDatosReporte() {
    fetch(apiReportesUrl)
    .then(respuesta => {
        if (!respuesta.ok) throw new Error("Error al obtener los datos");
        return respuesta.json();
    })
    .then(datos => {
        // Actualizar Métricas
        document.getElementById("lblIngresos").textContent = `RD$ ${datos.totalIngresos.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`;
        document.getElementById("lblCantidadVentas").textContent = datos.cantidadVentas;
        
        let ticketPromedio = datos.cantidadVentas > 0 ? (datos.totalIngresos / datos.cantidadVentas) : 0;
        document.getElementById("lblTicketPromedio").textContent = `RD$ ${ticketPromedio.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`;

        // Llenar Tabla
        const tbody = document.getElementById("tablaUltimasVentas");
        tbody.innerHTML = "";
        datos.ultimasVentas.forEach(venta => {
            const fechaFormateada = new Date(venta.fecha).toLocaleString('es-DO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit' });
            const totalFormateado = `RD$ ${venta.total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`;

            tbody.innerHTML += `
                <tr>
                    <td style="font-weight: bold; color: var(--text-muted);">#${venta.id}</td>
                    <td>${fechaFormateada}</td>
                    <td style="color: var(--success); font-weight: bold;">${totalFormateado}</td>
                </tr>
            `;
        });

        // Dibujar las tres gráficas
        dibujarGraficaLinea(datos.ventasPorDia);
        dibujarGraficaBarras(datos.ventasPorDia);
        dibujarGraficaPastel(datos.ventasPorMetodo);
    })
    .catch(error => console.error("Fallo al cargar el dashboard:", error));
}

function dibujarGraficaLinea(ventasPorDia) {
    const ctx = document.getElementById('lineChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ventasPorDia.map(v => v.fecha),
            datasets: [{
                label: 'Ingresos (RD$)',
                data: ventasPorDia.map(v => v.total),
                backgroundColor: 'rgba(1, 118, 211, 0.1)',
                borderColor: '#0176d3',
                borderWidth: 2,
                fill: true,
                tension: 0.3
            }]
        },
        options: { plugins: { legend: { display: false } } }
    });
}

function dibujarGraficaBarras(ventasPorDia) {
    const ctx = document.getElementById('barChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ventasPorDia.map(v => v.fecha),
            datasets: [{
                label: 'Cantidad de Facturas',
                data: ventasPorDia.map(v => v.cantidad),
                backgroundColor: '#2e844a', // Verde
                borderRadius: 4
            }]
        },
        options: { plugins: { legend: { display: false } } }
    });
}

function dibujarGraficaPastel(ventasPorMetodo) {
    const ctx = document.getElementById('pieChart').getContext('2d');
    
    // Formateamos los nombres para que se vean bonitos
    const etiquetas = ventasPorMetodo.map(v => v.metodo.replace("_", " "));
    
    new Chart(ctx, {
        type: 'doughnut', // 'pie' o 'doughnut' (dona se ve más moderno)
        data: {
            labels: etiquetas,
            datasets: [{
                data: ventasPorMetodo.map(v => v.total),
                backgroundColor: ['#0176d3', '#f59e0b', '#032d60', '#dc2626'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}