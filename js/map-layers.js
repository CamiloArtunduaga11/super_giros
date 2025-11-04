// map-layers.js
/**
 * map-layers.js
 * Diseño mejorado para la leyenda y control de capas.
 * Paleta: rgba(1, 97, 175), negro y blanco.
 */

// ----------------------------------------------------------------------
// Función para cargar la capa de SuperGiros (sin cambios principales)
// ----------------------------------------------------------------------




function loadSuperGirosLayer() {
    // 📢 NUEVA URL WFS: Construye la solicitud WFS.
    // Se pide que los datos de SALIDA (srsName) sean EPSG:4326, forzando la reproyección en GeoServer.
    const WFS_URL = `${geoServerUrl.replace('/wms', '/ows')}?service=WFS&version=1.1.0&request=GetFeature&typeName=proyecto_lineab:supergiros&outputFormat=application/json&srsName=EPSG:4326`;

    fetch(WFS_URL)
        .then(response => {
            if (!response.ok) throw new Error(`Error HTTP: ${response.status} de WFS.`);
            return response.json();
        })
        .then(data => {
            // Verifica si el GeoJSON es válido
            if (!data.features) {
                throw new Error("Respuesta WFS no contiene features válidas.");
            }
            
            allSuperGirosFeatures = data.features;

            const pvIcon = L.icon({
                iconUrl: '../imagenes/icono.png',
                iconSize: [30, 30],
                iconAnchor: [15, 30],
                popupAnchor: [0, -30]
            });

            // 📢 CLAVE: Ya NO se necesita 'crs: L.Proj.get('EPSG:3115')' porque los datos ya vienen en 4326.
            superGirosLayer = L.geoJSON(data, {
                // Leaflet asume EPSG:4326 (el CRS que le pedimos a GeoServer) por defecto.
                
                pointToLayer: (feature, latlng) => L.marker(latlng, { icon: pvIcon }),
                onEachFeature: (feature, layer) => {
                    const props = feature.properties;
                    // Las coordenadas de GeoJSON ahora son Lat/Lon (4326)
                    const wktGeom = `POINT(${feature.geometry.coordinates[0]} ${feature.geometry.coordinates[1]})`;

                    layer.bindPopup(`
                        <div class="popup-container">
                            <h4>${props.nombrepv}</h4>
                            <p>ID: ${props.gid}</p>
                            <div class="popup-buttons">
                                <button onclick="showReportForm('${props.gid}', '${props.nombrepv}', '${wktGeom}')">Registrar Consulta</button>
                                <button onclick="calculateBuffer('${wktGeom}', '${props.nombrepv}')">Calcular Buffer (500m)</button>
                                <button onclick="findInterseccion('${wktGeom}', '${props.nombrepv}')">Ver Barrio</button>
                            </div>
                        </div>
                    `);
                }
            });
            
            // Crea e inicializa el Cluster Layer
            clusterLayer = L.markerClusterGroup({
                iconCreateFunction: cluster => {
                    const count = cluster.getChildCount();
                    return L.divIcon({
                        html: `<div class="cluster-icon">${count}</div>`,
                        className: 'custom-cluster',
                        iconSize: L.point(40, 40)
                    });
                },
                disableClusteringAtZoom: 16
            });

            clusterLayer.addLayer(superGirosLayer).addTo(map);
            map.fitBounds(clusterLayer.getBounds());
            setupLayerControl();
        })
        .catch(err => {
            console.error(err);
            // Mostrar un error claro de conexión
            showToast(`Error al cargar datos WFS/GeoServer: ${err.message}. Revise el puerto 8080.`, 'error');
        });
}


// 🔸 Ícono personalizado con logo + nombre del punto

function createSuperGirosIcon(nombre_punto) {
  return L.divIcon({
    className: 'custom-supergiros-icon',
    html: `
      <div class="icon-wrapper">
        <img src="../imagenes/icono.png" alt="icono" class="supergiros-logo">
        <span class="point-name">${nombre_punto}</span>
      </div>
    `,
    iconSize: [60, 60],
    iconAnchor: [30, 60],
    popupAnchor: [0, -55]
  });
}




// ----------------------------------------------------------------------
// Panel de control de capas personalizado
// ----------------------------------------------------------------------


function setupLayerControl() {
  const baseLayers = {
    "Mapa Base (OSM)": osm,
    "Imagen Satelital (GeoServer)": satelitalWMS
  };

  const overlayMaps = {
    "Puntos SuperGiros": superGirosLayer, // 👈 cambio importante
    "Barrios (WMS)": barriosWMS,
    "Comunas (WMS)": viasWMS
  };

  const control = L.control.layers(baseLayers, overlayMaps, { collapsed: false });
  control.addTo(map);

  styleLayerControl();
  addLegend();

  L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);
}


// ----------------------------------------------------------------------
// Estilizar el panel de capas (modifica el DOM tras crear el control)
// ----------------------------------------------------------------------

function styleLayerControl() {
  const layerControl = document.querySelector('.leaflet-control-layers');
  if (!layerControl) return;

  layerControl.style.background = 'rgba(255, 255, 255, 0.95)';
  layerControl.style.color = '#121212';
  layerControl.style.border = '1px solid rgba(1, 97, 175, 0.3)';
  layerControl.style.borderRadius = '8px';
  layerControl.style.padding = '10px 12px';
  layerControl.style.fontFamily = 'Roboto, sans-serif';
  layerControl.style.fontSize = '0.9em';
  layerControl.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
  layerControl.style.backdropFilter = 'blur(6px)';
}

// ----------------------------------------------------------------------
// Leyenda profesional y estética
// ----------------------------------------------------------------------

function addLegend() {
  const legend = L.control({ position: 'bottomright' });

  legend.onAdd = function () {
    const div = L.DomUtil.create('div', 'custom-legend-container');

    div.innerHTML = `
            <div class="legend-header">Leyenda del Visor</div>
            <div class="legend-item">
                <img src="../imagenes/icono.png" class="legend-icon-img"> 
                <span>Punto de Venta (PV)</span>
            </div>
            <div class="legend-item">
                <span class="legend-line" style="background: rgba(1,97,175,1);"></span> 
                <span>Ruta al PV más cercano</span>
            </div>
            <div class="legend-item">
                <span class="legend-box" style="background: rgba(255,215,0,0.4); border: 2px solid #FFD700;"></span>
                <span>Buffer de 500m</span>
            </div>
            <div class="legend-item">
                <span class="legend-box" style="background: rgba(51,160,44,0.4); border: 2px solid #33A02C;"></span>
                <span>Barrio Intersectado</span>
            </div>
        `;
    return div;
  };

  legend.addTo(map);
}




