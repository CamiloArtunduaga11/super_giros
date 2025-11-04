// --- SECCIÓN 0: CONFIGURACIÓN GLOBAL Y VARIABLES ---
// 📢 DEFINICIÓN DE CRS PARA EL PROYECTO (DEBE ESTAR AL INICIO)
if (typeof proj4 !== 'undefined') {
    proj4.defs(
        "EPSG:3115",
        "+proj=tmerc +lat_0=4.596200416666666 +lon_0=-74.0775079 +k=1 +x_0=1000000 +y_0=1000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs"
    );
} else {
    console.error("Proj4 no está cargado. La reproyección 3115 fallará.");
}

// --- VARIABLES GLOBALES ---
let superGirosLayer;         // Capa de SuperGiros accesible globalmente
let clusterLayer;            // Capa de clustering
let analysisLayer;           // Capa de resultados de análisis (buffers, intersecciones, etc.)
let allSuperGirosFeatures = []; // Features GeoJSON originales
let routingControl = null;   // Control de ruteo

// --- CONFIGURACIÓN DE URLs ---
// 🌍 GeoServer (WMS)
const geoServerUrl = 'https://136.113.233.154/geoserver/wms';

// 🧩 GeoServer (WFS - capa SuperGiros)
const SUPERGIROS_API_URL =
  'https://136.113.233.154/geoserver/proyecto_lineab/ows?' +
  'service=WFS&version=1.0.0&request=GetFeature&' +
  'typeName=proyecto_lineab:supergiros&' +
  'outputFormat=application/json&srsName=EPSG:4326';

// ⚙️ Endpoints del backend (ajústalos si tienes tu propia API)
const BUFFER_API_URL = '/api/v1/analisis/buffer';
const INTERSECCION_API_URL = '/api/v1/analisis/interseccion';
const REGISTER_API_URL = '/api/v1/reportes/registrar';

// 📍 Coordenadas base (Florencia, Caquetá)
const FLORENCIA_COORDS = [1.6147, -75.6046];

// 🌎 Variables globales para el mapa
let map;

// 🗺️ Capas base (se inicializan en map-init.js)
let osm, satelitalWMS, barriosWMS, viasWMS, hidrografiaWMS, poiWMS;
