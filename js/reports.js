// js/reports.js

const REGISTER_API_URL = 'http://localhost:5000/api/v1/reportes/registrar';
const REPORTES_API_URL = 'http://localhost:5000/api/v1/reportes'; // ✅ Ruta GET para listar reportes

// 1️⃣ Muestra un formulario para registrar un reporte
function showReportForm(id_punto, nombre_punto, wkt_geom) {
    const user_name = prompt("Ingrese su nombre:");
    if (!user_name) return;
    
    const user_email = prompt("Ingrese su email:");
    if (!user_email) return;

    const reportData = {
        nombre: user_name,
        email: user_email,
        id_punto: id_punto,
        nombre_punto: nombre_punto,
        wkt_geom: wkt_geom
    };
    
    sendReportToFlask(reportData);
}

// 2️⃣ Envía la información al backend Flask
function sendReportToFlask(data) {
    console.log("Enviando reporte:", data);
    
    fetch(REGISTER_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
        if (result.message?.startsWith('Error')) {
            alert("❌ FALLÓ EL REGISTRO: " + result.message);
        } else {
            alert("✅ Registro Exitoso: " + result.message);
        }
    })
    .catch(error => {
        console.error('Error de red:', error);
        alert('Error de conexión con el servidor Flask.');
    });
}



// js/reports.js
function loadReportes() {
    // 1️⃣ Expandir el panel lateral suavemente
    const panel = document.getElementById("control-panel");
    if (panel) {
        panel.style.transition = "width 0.4s ease"; // animación suave
        panel.style.width = "410px"; // ancho expandido
    }

    // 2️⃣ Contenedor de reportes
    const container = document.getElementById("reportes-container");
    if (!container) return;

    container.innerHTML = "<p>Cargando reportes...</p>"; // mensaje de carga

    // 3️⃣ Llamada a la API
    fetch('http://localhost:5000/api/v1/reportes')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error al cargar reportes: ${response.status}`);
            }
            return response.json();
        })
        .then(reportes => {
            if (reportes.length === 0) {
                container.innerHTML = "<p>No hay reportes registrados.</p>";
                return;
            }

            // 4️⃣ Construir tabla
            let html = `
                <h3>Reportes Registrados</h3>
                <div class="table-wrapper" style="max-height:400px; overflow-y:auto;">
                    <table class="report-table" style="width:100%; font-size:12px; border-collapse:collapse; text-align:center;">
                        <thead>
                            <tr style="background-color:#f0f0f0;">
                                <th>Nombre Usuario</th>
                                <th>Email</th>
                                <th>ID Punto</th>
                                <th>Nombre Punto</th>
                                <th>Geometría</th>
                            </tr>
                        </thead>
                        <tbody>`;

            reportes.forEach(r => {
                html += `<tr style="border-bottom:1px solid #ddd;">
                            <td>${r.nombre_usuario}</td>
                            <td>${r.email_usuario}</td>
                            <td>${r.id_elemento_consultado}</td>
                            <td>${r.nombre_elemento}</td>
                            <td>${r.geom}</td>
                        </tr>`;
            });

            html += "</tbody></table></div>";
            container.innerHTML = html;
        })
        .catch(err => {
            console.error(err);
            container.innerHTML = `<p style="color:red;">Error al cargar los reportes.</p>`;
        });
}
