// map-init.js

// ----------------------------------------------------------------------
// 1. INICIALIZACIÓN DEL MAPA
// ----------------------------------------------------------------------

// Inicializa el mapa y lo asigna a la variable global (de map-config.js)
map = L.map('map').setView(FLORENCIA_COORDS, 13);

// Inicializa la capa de análisis y la añade al mapa
analysisLayer = L.layerGroup().addTo(map);

// ----------------------------------------------------------------------
// 2. Definición de Capas Base (Tiles y WMS) 
// ----------------------------------------------------------------------

// Mapa Base (OpenStreetMap)
osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
});
osm.addTo(map); // Añade OSM como capa base por defecto

// Capa Satelital WMS (Ráster)
satelitalWMS = L.tileLayer.wms(geoServerUrl, {
  layers: 'proyecto_lineab:florencia',  // <- nombre correcto
  format: 'image/png',                  // formato compatible con Leaflet
  transparent: false,
  version: '1.1.1',
  attribution: 'Imagen Satelital Florencia'
});


// Capas Base Vectoriales WMS (Consumo de servicios publicados en GeoServer)
barriosWMS = L.tileLayer.wms(geoServerUrl, {
    layers: 'proyecto_lineab:barrios_florencia', // <- NOMBRE REAL DE LA CAPA BARRIOS
    format: 'image/png',
    transparent: true,
    version: '1.1.1',
    attribution: 'Barrios Florencia',
    opacity: 0.5
});
barriosWMS.addTo(map); // Se añade para prueba inicial

// Capa de COMUNAS (WMS - ANTES Vías Principales)
viasWMS = L.tileLayer.wms(geoServerUrl, {
    layers: 'proyecto_lineab:comunas', // <--- RUTA CORREGIDA A LA CAPA COMUNAS
    format: 'image/png',
    transparent: true,
    version: '1.1.1',
    attribution: 'Comunas' // <--- ATRIBUCIÓN CAMBIADA
});

// Capa de Hidrografía (WMS - Nombre Asumido)
hidrografiaWMS = L.tileLayer.wms(geoServerUrl, {
    layers: 'proyecto_lineab:Hidrografia', // Nombre asumido
    format: 'image/png',
    transparent: true,
    version: '1.1.1',
    attribution: 'Hidrografía'
});

// Capa de Puntos de Interés (WMS - Nombre Asumido)
poiWMS = L.tileLayer.wms(geoServerUrl, {
    layers: 'proyecto_lineab:Puntos_Interes', // Nombre asumido
    format: 'image/png',
    transparent: true,
    version: '1.1.1',
    attribution: 'POI'
});


// ------------------




// ----------------------------------------------------



// INICIO DE LA APLICACIÓN
// ----------------------------------------------------------------------

// Llama a la función principal (definida en map-layers.js) para cargar los datos de SuperGiros
// Esto inicia la carga de la capa de clustering.
loadSuperGirosLayer();

