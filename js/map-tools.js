// map-tools.js

/**
 * map-tools.js
 * Contiene todas las funciones que se ejecutan al hacer click en el panel de control,
 * incluyendo Búsqueda, Análisis Espacial y Ruteo.
 * * * Dependencias: map-config.js (variables globales), Toastify (librería de notificaciones)
 */

// ----------------------------------------------------------------------
// 0. UTILIDAD: TOAST NOTIFICATIONS (Reemplaza los alert())
// ----------------------------------------------------------------------

/**
 * Muestra una notificación Toastify en lugar de un alert nativo.
 * @param {string} message Mensaje a mostrar.
 * @param {string} type Tipo de mensaje (success, error, warning, info).
 */
function showToast(message, type = 'info') {
    let backgroundColor;
    switch (type) {
        case 'success':
            backgroundColor = "#4CAF50"; // Verde
            break;
        case 'error':
            backgroundColor = "#F44336"; // Rojo
            break;
        case 'warning':
            backgroundColor = "#FF9800"; // Naranja
            break;
        case 'info':
        default:
            backgroundColor = "#004696"; // Azul SuperGiros
            break;
    }

    if (typeof Toastify !== 'undefined') {
        Toastify({
            text: message,
            duration: 3000,
            close: true,
            gravity: "bottom", // show on the bottom
            position: "right", // align to the right
            stopOnFocus: true,
            style: {
                background: backgroundColor,
                borderRadius: "5px"
            }
        }).showToast();
    } else {
        // Fallback si Toastify no cargó
        console.warn("Toastify no cargado. Usando alert():", message);
        alert(message);
    }
}


// ----------------------------------------------------------------------
// 4. MÓDULO DE BÚSQUEDA (ACTUALIZADO PARA CLÚSTERES)
// ----------------------------------------------------------------------

function searchSuperGiros() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();

    if (!superGirosLayer || !searchTerm) {
        resetSuperGirosView();
        return;
    }

    // 🔹 Filtrar las features
    const filteredFeatures = allSuperGirosFeatures.filter(feature =>
        feature.properties.nombrepv &&
        feature.properties.nombrepv.toLowerCase().includes(searchTerm)
    );

    // 🔹 Limpiar los clústeres actuales
    superGirosLayer.clearLayers();

    if (filteredFeatures.length > 0) {
        // 🔹 Crear nueva capa GeoJSON con los resultados
        const filteredGeoJSON = L.geoJSON({
            type: 'FeatureCollection',
            features: filteredFeatures
        }, {
            pointToLayer: function (feature, latlng) {
                return L.marker(latlng, {
                    icon: createSuperGirosIcon(feature.properties.nombrepv)
                });
            },
            onEachFeature: function (feature, layer) {
                const p = feature.properties;
                const wktGeom = `POINT(${feature.geometry.coordinates[0]} ${feature.geometry.coordinates[1]})`;

                const popupContent = `
                    <div class="custom-popup">
                        <h3>${p.nombrepv}</h3>
                        <div class="id">ID: ${p.gid}</div>
                        <hr>
                        <div class="btn-container">
                            <button onclick="showReportForm('${p.gid}', '${p.nombrepv}', '${wktGeom}')">📝 Registrar</button>
                            <button onclick="calculateBuffer('${wktGeom}', '${p.nombrepv}')">🌀 Buffer 500m</button>
                            <button onclick="findInterseccion('${wktGeom}', '${p.nombrepv}')">🏙️ Ver Barrio</button>
                        </div>
                    </div>
                `;

                layer.bindPopup(popupContent);
            }
        });

        // 🔹 Añadir los resultados filtrados al grupo de clústeres
        superGirosLayer.addLayer(filteredGeoJSON);

        // 🔹 Ajustar el zoom al resultado
        map.fitBounds(superGirosLayer.getBounds());
        showToast(`✅ ${filteredFeatures.length} puntos encontrados.`, 'success');
    } else {
        showToast('❌ No se encontraron puntos de SuperGiros con ese nombre.', 'warning');
    }
}


// ----------------------------------------------------------------------
// Restablecer vista completa
// ----------------------------------------------------------------------
function resetSuperGirosView() {
    if (superGirosLayer && allSuperGirosFeatures.length > 0) {
        superGirosLayer.clearLayers();

        const allGeoJSON = L.geoJSON({
            type: 'FeatureCollection',
            features: allSuperGirosFeatures
        }, {
            pointToLayer: (feature, latlng) =>
                L.marker(latlng, { icon: createSuperGirosIcon(feature.properties.nombrepv) })
        });

        superGirosLayer.addLayer(allGeoJSON);
        map.fitBounds(superGirosLayer.getBounds());
        showToast('Vista de SuperGiros restablecida.', 'info');
    }
}



// ----------------------------------------------------------------------
// 6. FUNCIÓN DE ANÁLISIS ESPACIAL (CÁLCULO DE BUFFER)
// ----------------------------------------------------------------------

/**
 * Recibe una geometría de punto y calcula un buffer de 500 metros
 * usando la API de Flask.
 */
function calculateBuffer(wkt_geom, nombre_punto) {
    analysisLayer.clearLayers();
    const DISTANCE_METERS = 500;
    const dataToSend = { wkt_geom: wkt_geom, distancia: DISTANCE_METERS };

    fetch(BUFFER_API_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dataToSend)
    })
        .then(response => response.json())
        .then(result => {
            if (result.message && result.message.startsWith('Error')) {
                showToast(`❌ Error en el análisis: ${result.message}`, 'error');
                console.error(result.details);
                return;
            }
            const bufferGeoJSON = result;
            L.geoJSON(bufferGeoJSON, {
                style: { color: '#FFD700', weight: 3, opacity: 0.6, fillColor: '#FFD700', fillOpacity: 0.3 },
                onEachFeature: function (feature, layer) {
                    layer.bindPopup(`Zona de influencia (Buffer) de ${DISTANCE_METERS}m alrededor de ${nombre_punto}`);
                }
            }).addTo(analysisLayer);
            showToast(`✅ Buffer de ${DISTANCE_METERS}m calculado para ${nombre_punto}.`, 'success');
        })
        .catch(error => {
            console.error("Error de red al calcular el buffer:", error);
            showToast('❌ Error de conexión con el servidor de análisis (Flask).', 'error');
        });
}

// ----------------------------------------------------------------------
// 7. FUNCIÓN DE ANÁLISIS ESPACIAL (INTERSECCIÓN - Ver Barrio)
// ----------------------------------------------------------------------

/**
 * Recibe una geometría de punto y busca el polígono de barrio que lo contiene.
 */
function findInterseccion(wkt_geom, nombre_punto) {
    analysisLayer.clearLayers();
    const dataToSend = { wkt_geom: wkt_geom, layer_name: 'barrios_florencia' };

    fetch(INTERSECCION_API_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dataToSend)
    })
        .then(response => response.json())
        .then(result => {
            if (result.message) {
                showToast(`⚠️ Resultado: ${result.message}`, 'warning');
                return;
            }
            const barrioGeoJSON = result;
            const geoJsonLayer = L.geoJSON(barrioGeoJSON, {
                style: { color: '#33A02C', weight: 4, opacity: 0.8, fillColor: '#B2DF8A', fillOpacity: 0.5 },
                onEachFeature: function (feature, layer) {
                    const nombreBarrio = feature.properties.nombre || feature.properties.nom_barrio || 'Desconocido';
                    layer.bindPopup(`Punto "${nombre_punto}" se encuentra en el barrio: <b>${nombreBarrio}</b>`);
                }
            }).addTo(analysisLayer);
            map.fitBounds(geoJsonLayer.getBounds());
            showToast(`✅ Intersección calculada. Se ha resaltado el barrio.`, 'success');
        })
        .catch(error => {
            console.error("Error de red al calcular la intersección:", error);
            showToast('❌ Error de conexión con el servidor de análisis (Flask).', 'error');
        });
}


// ----------------------------------------------------------------------
// 8. FUNCIONES AUXILIARES
// ----------------------------------------------------------------------

/**
 * Función global para borrar todos los resultados de análisis espacial y ruteo.
 */
function clearAnalysis() {
    // Limpiar Buffers e Intersecciones
    if (analysisLayer) {
        analysisLayer.clearLayers();
    }

    // Limpiar marcador del usuario
    if (userMarker) {
        map.removeLayer(userMarker);
        userMarker = null;
    }

    // Limpiar la ruta del mapa
    if (routeControl) {
        map.removeControl(routeControl);
        routeControl = null;
    }

    // Limpiar la visualización de reportes (sin eliminar de la base de datos)
    const reportContainer = document.getElementById("reportes-container");
    if (reportContainer) {
        reportContainer.innerHTML = "";  // Vacia el contenedor
    }

    // Restaurar ancho original del panel
    const panel = document.getElementById("control-panel");
    if (panel) {
        panel.style.transition = "width 0.4s ease"; // animación suave
        panel.style.width = "250px"; // ancho original
    }

    showToast('Resultados de análisis, ruta y reportes eliminados del mapa. Panel restaurado.', 'info');
}



// ----------------------------------------------------------------------
// 9. FUNCIONALIDAD DE RUTEO (PUNTO MÁS CERCANO)
// ----------------------------------------------------------------------

let routeControl;
let userMarker;

/**
 * Activa el modo de "selección de ruta".
 */
function activateRoutingMode() {
    showToast('Modo de Ruteo Activado: Haga clic en el mapa para marcar su ubicación de inicio.', 'info');
    L.DomUtil.addClass(map._container, 'crosshair-cursor-enabled');

    map.once('click', function (e) {
        L.DomUtil.removeClass(map._container, 'crosshair-cursor-enabled');
        calculateRouteToNearest(e.latlng);
    });
}

/**
 * Calcula la ruta desde un punto de inicio (startLatLng) al punto de SuperGiros más cercano.
 */
function calculateRouteToNearest(startLatLng) {
    analysisLayer.clearLayers();
    if (!allSuperGirosFeatures || allSuperGirosFeatures.length === 0) {
        showToast('Los datos de SuperGiros aún no se han cargado. Por favor, espere.', 'warning');
        return;
    }

    // ✅ Obtener ubicación del usuario automáticamente
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function (position) {
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;

                // Centrar el mapa
                map.setView([userLat, userLng], 15);

                // Crear marcador de la ubicación del usuario
                const iconHtml = `
                    <div class="custom-location-label">
                        <span>📍 Tu ubicación</span>
                        <img src="https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png" alt="Ubicación">
                    </div>
                `;

                const userIcon = L.divIcon({
                    className: "custom-location-icon",
                    html: iconHtml,
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                });

                if (userMarker) map.removeLayer(userMarker);
                userMarker = L.marker([userLat, userLng], { icon: userIcon }).addTo(map);
            },
            function () {
                showToast('No se pudo obtener la ubicación actual.', 'warning');
            }
        );
    } else {
        showToast("⚠️ Tu navegador no soporta geolocalización.", 'error');
    }

    // ✅ Calcular punto más cercano
    let minDistance = Infinity;
    let closestFeature = null;

    allSuperGirosFeatures.forEach(feature => {
        const [lon, lat] = feature.geometry.coordinates;
        const distance = map.distance(startLatLng, [lat, lon]);
        if (distance < minDistance) {
            minDistance = distance;
            closestFeature = feature;
        }
    });

    if (!closestFeature) {
        showToast('❌ No se encontró ningún punto de SuperGiros cercano.', 'error');
        return;
    }

    const [nearestLon, nearestLat] = closestFeature.geometry.coordinates;
    const nombre = closestFeature.properties.nombrepv;

    // ✅ Crear la ruta sin panel lateral
    if (routeControl) map.routingControl(routeControl);

    routeControl = L.Routing.control({
        waypoints: [
            L.latLng(startLatLng),
            L.latLng(nearestLat, nearestLon),
        ],
        lineOptions: {
            styles: [{ color: "#FF6600", weight: 5, opacity: 0.8 }],
        },
        routeWhileDragging: false,
        addWaypoints: false,
        draggableWaypoints: false,
        show: false,
        createMarker: function (i, wp, nWps) {
            if (i === 0) {
                const iconHtml = `
                    <div class="custom-location-label">
                        <span>Punto seleccionado</span>
                        <img src="https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png" alt="icono">
                    </div>
                `;
                const customIcon = L.divIcon({
                    className: "custom-selected-icon",
                    html: iconHtml,
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                });
                return L.marker(wp.latLng, { icon: customIcon });
            }
            return null;
        },
    })
        .on("routesfound", function (e) {
            const route = e.routes[0];
            const distancia = (route.summary.totalDistance / 1000).toFixed(2);

            const popupContent = `
            <b>🚗 Ruta seleccionada automáticamente</b><br>
            <b>🏠 Punto de venta:</b> ${nombre}<br>
            <b>📏 Distancia:</b> ${distancia} km
        `;

            L.popup()
                .setLatLng([nearestLat, nearestLon])
                .setContent(popupContent)
                .openOn(map);
        })
        .addTo(map);

    // Ocultar panel lateral
    setTimeout(() => {
        document.querySelectorAll(".leaflet-routing-container")
            .forEach(el => el.style.display = "none");
    }, 500);

    showToast(`🚗 Ruta al PV más cercano (${nombre}) calculada.`, 'success');
}


// ----------------------------------------------------------------------
// 10. FUNCIONES REPORTES
// ----------------------------------------------------------------------

/**
 * Función global mostrar los reportes.
 */

document.addEventListener("DOMContentLoaded", () => {
    const btnVerReportes = document.getElementById('btnVerReportes');
    const reportModal = document.getElementById('reportModal');
    const closeModal = document.getElementById('closeModal');
    const reportList = document.getElementById('reportList');

    if (btnVerReportes) btnVerReportes.addEventListener('click', loadReportes);
    if (closeModal) closeModal.addEventListener('click', () => reportModal.style.display = 'none');
});




// Función para cargar reportes y mostrar modal
function loadReportes() {
    fetch(REPORTES_API_URL)
        .then(res => res.json())
        .then(data => {
            // Limpiar lista anterior
            reportList.innerHTML = '';

            if (!data || data.length === 0) {
                reportList.innerHTML = '<p>No hay reportes registrados.</p>';
                reportModal.style.display = 'block';
                return;
            }

            // Crear HTML para cada reporte
            data.forEach(r => {
                const item = document.createElement('div');
                item.classList.add('report-item');
                item.innerHTML = `
                    <strong>Nombre:</strong> ${r.nombre_usuario} <br>
                    <strong>Email:</strong> ${r.email_usuario} <br>
                    <strong>ID Punto:</strong> ${r.id_elemento_consultado} <br>
                    <strong>Nombre Punto:</strong> ${r.nombre_elemento} <br>
                    <strong>Geom:</strong> ${r.geom} <br>
                `;
                reportList.appendChild(item);
            });

            // Mostrar modal
            reportModal.style.display = 'block';
        })
        .catch(err => {
            console.error(err);
            alert('Error al cargar los reportes.');
        });
}

// Cerrar modal al hacer clic en la "X"
closeModal.addEventListener('click', () => {
    reportModal.style.display = 'none';
});

// Cerrar modal al hacer clic fuera del contenido
window.addEventListener('click', (e) => {
    if (e.target == reportModal) {
        reportModal.style.display = 'none';
    }
});


document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ DOM completamente cargado");

  const boton = document.getElementById("boton");
  if (!boton) {
    console.error("❌ No se encontró el elemento con id 'boton'");
  } else {
    console.log("✅ Elemento 'boton' encontrado");
    boton.addEventListener("click", () => console.log("Botón presionado"));
  }
});
