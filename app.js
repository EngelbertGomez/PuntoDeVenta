const API_URL = 'http://192.168.0.104'; 

async function probarConexion() {
    try {
        // Haremos una petición al endpoint por defecto del clima que trae la plantilla de .NET
        const respuesta = await fetch(`${API_URL}/weatherforecast`);
        const datos = await respuesta.json();
        console.log("¡Conexión exitosa desde la Mac!", datos);
    } catch (error) {
        console.error("Error conectando al backend:", error);
    }
}

probarConexion();