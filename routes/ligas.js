const express = require('express');
const router = express.Router();
const axios = require('axios');
const Cache = require('../models/Cache'); // ¡Importamos el nuevo modelo!

// Constantes de la API
const API_BASE_URL = 'https://api.football-data.org/v4';
const API_KEY = process.env.API_FUTBOL_KEY;
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutos en milisegundos

const config = {
  headers: {
    'X-Auth-Token': API_KEY
  }
};

// --- FUNCIÓN CENTRAL DE CACHEO ---
// Revisa si el cache es válido; si no, llama a la API y actualiza la BD.
const fetchAndCacheLeagues = async () => {
    const CACHE_KEY = 'leagues_list';
    
    // 1. Intentar encontrar el cache en MongoDB
    const cachedData = await Cache.findOne({ key: CACHE_KEY });
    const now = new Date();

    // 2. Revisar si el cache existe Y no ha expirado (si el tiempo transcurrido es menor a 30 min)
    if (cachedData && (now.getTime() - cachedData.createdAt.getTime() < CACHE_DURATION_MS)) {
        console.log('CACHE HIT: Sirviendo lista de ligas desde MongoDB. (Cache válido)');
        return cachedData.data; // Devolver los datos de la BD
    }

    // 3. CACHE MISS o EXPIRADO: Llamar a la API externa
    console.log('CACHE MISS/EXPIRADO: Llamando a la API externa...');
    const url = `${API_BASE_URL}/competitions`;
    
    try {
        const response = await axios.get(url, config);
        const freshData = response.data;
        
        // 4. Guardar/Actualizar en la BD con la nueva fecha
        await Cache.findOneAndUpdate(
            { key: CACHE_KEY },
            { data: freshData, createdAt: now },
            { upsert: true, new: true } // upsert: true crea el documento si no existe
        );
        
        return freshData;
    } catch (error) {
        console.error('Error al llamar a la API externa:', error.message);

        // 5. Si la API externa falla, intentar servir el dato viejo (fallback de emergencia)
        if (cachedData) {
            console.warn('FALLÓ LA API EXTERNA. Sirviendo cache viejo como fallback.');
            return cachedData.data;
        }

        // Si falla y no hay cache, lanzar el error
        throw error;
    }
}

// @ruta    GET /api/ligas/
// @desc    Obtener lista de competiciones (CACHEDA)
router.get('/', async (req, res) => {
  try {
    const data = await fetchAndCacheLeagues();
    res.json(data);
  } catch (error) {
    // Si no hay datos (la BD o la API externa fallaron), enviamos un error
    res.status(503).send('Error de servicio: no se pudo obtener la lista de ligas');
  }
});

// --- Rutas Secundarias (SIN CACHÉ) ---
// NOTA: Por complejidad, estas rutas aún llaman a la API directa con cada solicitud.
// Caching para éstas requeriría una clave por ID (ej: cache_standings_PL).

// @ruta    GET /api/ligas/:id/standings
// @desc    Obtener la tabla de posiciones de UNA liga
router.get('/:id/standings', async (req, res) => {
  
  const leagueId = req.params.id;
  const url = `${API_BASE_URL}/competitions/${leagueId}/standings`;

  try {
    const response = await axios.get(url, config);
    res.json(response.data);
  } catch (error)
 {
    console.error('Error al llamar a la API de fútbol (standings):', error.response ? error.response.data : error.message);
    res.status(500).send('Error al obtener los datos de la API de fútbol');
  }
});

// @ruta    GET /api/ligas/:id/matches
// @desc    Obtener los próximos partidos de UNA liga
router.get('/:id/matches', async (req, res) => {
  
  const leagueId = req.params.id;
  const url = `${API_BASE_URL}/competitions/${leagueId}/matches?status=SCHEDULED&limit=10`;

  try {
    const response = await axios.get(url, config);
    res.json(response.data);
  } catch (error) {
    console.error('Error al llamar a la API de fútbol (matches):', error.response ? error.response.data : error.message);
    res.status(500).send('Error al obtener los datos de la API de fútbol');
  }
});

module.exports = router;