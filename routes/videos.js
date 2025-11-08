const express = require('express');
const router = express.Router();
const axios = require('axios');
const Cache = require('../models/Cache'); // Importamos el modelo de Caché

// Constantes
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutos en milisegundos

// --- FUNCIÓN CENTRAL DE CACHEO PARA VIDEOS ---
const fetchAndCacheVideos = async () => {
    const CACHE_KEY = 'latest_videos'; // Clave única
    
    // 1. Intentar encontrar el cache en MongoDB
    const cachedData = await Cache.findOne({ key: CACHE_KEY });
    const now = new Date();

    // 2. Revisar si el cache existe Y no ha expirado
    if (cachedData && (now.getTime() - cachedData.createdAt.getTime() < CACHE_DURATION_MS)) {
        console.log('CACHE HIT: Sirviendo lista de videos desde MongoDB. (Cache válido)');
        return cachedData.data; // Devolver los datos de la BD
    }

    // 3. CACHE MISS o EXPIRADO: Llamar a la API externa (ScoreBat)
    console.log('CACHE MISS/EXPIRADO: Llamando a la API de ScoreBat...');
    
    const MI_TOKEN = process.env.SCOREBAT_TOKEN; 
    if (!MI_TOKEN) {
        throw new Error('¡Error Fatal: SCOREBAT_TOKEN no está definido en .env!');
    }
    const url = `https://www.scorebat.com/video-api/v3/feed/?token=${MI_TOKEN}`; 
    
    try {
        const response = await axios.get(url);
        
        // La API devuelve los datos que queremos guardar y servir
        const freshData = response.data; 
        
        // 4. Guardar/Actualizar en la BD con la nueva fecha
        await Cache.findOneAndUpdate(
            { key: CACHE_KEY },
            { data: freshData, createdAt: now },
            { upsert: true, new: true }
        );
        
        return freshData;
    } catch (error) {
        console.error('Error al llamar a la API externa de ScoreBat:', error.message);

        // 5. Fallback: Si la API externa falla, intentar servir el dato viejo
        if (cachedData) {
            console.warn('FALLÓ LA API EXTERNA DE VIDEOS. Sirviendo cache viejo como fallback.');
            return cachedData.data;
        }

        throw error;
    }
}


// @ruta    GET /api/videos
// @desc    Obtener videos destacados (CACHEDA)
router.get('/', async (req, res) => {
  try {
    const data = await fetchAndCacheVideos();
    // La respuesta del frontend espera directamente el array de videos (que viene en data.response)
    res.json(data.response || data); 
  } catch (error) {
    res.status(503).json({ message: 'Error de servicio: no se pudo obtener la lista de videos.' });
  }
});

module.exports = router;