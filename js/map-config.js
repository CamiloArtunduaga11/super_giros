// --- SECCIÓN 0: CONFIGURACIÓN GLOBAL Y VARIABLES ---
// 📢 DEFINICIÓN DE CRS PARA EL PROYECTO (DEBE ESTAR AL INICIO)
if (typeof proj4 !== 'undefined') {
    proj4.defs("EPSG:3115", "+proj=tmerc +lat_0=4.596200416666666 +lon_0=-74.0775079 +k=1 +x_0=1000000 +y_0=1000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs");
} else {
    console.error("Proj4 no está cargado. La reproyección 3115 fallará.");
}

// --- SECCIÓN 0: CONFIGURACIÓN GLOBAL Y VARIABLES ---
// Variable global para almacenar la capa de SuperGiros...
// ... (El resto de tus variables y constantes) ...
// Variable global para almacenar la capa de SuperGiros y que sea accesible por el control de capas
let superGirosLayer;
// Capa global para el clustering
let clusterLayer; 
// Capa global para dibujar los resultados del análisis (Buffers, etc.)
let analysisLayer;
// Almacena todas las features GeoJSON originales para poder filtrarlas y resetearlas (CRÍTICO PARA BÚSQUEDA)
let allSuperGirosFeatures = [];
// Variable para el control de ruteo
let routingControl = null;

// --- Constantes de URLs (¡ACTUALIZADAS A LA IP PÚBLICA DE TU VM!) ---

// 📢 IP Pública de tu VM donde corren GeoServer (8080) y la API (5000)
const IP_PUBLICA_VM = 'http://136.113.233.154'; 

// GeoServer: Usa el puerto 8080 para las solicitudes WMS
const geoServerUrl = IP_PUBLICA_VM + ':8080/geoserver/proyecto_lineab/wms'; 

// API Backend: Usa el puerto 5000 para las solicitudes de datos y análisis
const SUPERGIROS_API_URL = IP_PUBLICA_VM + ':5000/api/v1/supergiros/geojson';
const BUFFER_API_URL = IP_PUBLICA_VM + ':5000/api/v1/analisis/buffer';
const INTERSECCION_API_URL = IP_PUBLICA_VM + ':5000/api/v1/analisis/interseccion';

// Coordenadas aproximadas de Florencia, Caquetá (Latitud, Longitud)
const FLORENCIA_COORDS = [1.6147, -75.6046];

// Variable global para el mapa (será definida en map-init.js)
let map;

// Variables globales para las capas base (serán definidas en map-init.js)
let osm, satelitalWMS, barriosWMS, viasWMS, hidrografiaWMS, poiWMS;

