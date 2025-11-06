const express = require('express');
const router = express.Router();
const axios = require('axios');

// @ruta    GET /api/videos
router.get('/', async (req, res) => {
  try {
    // Leemos el token desde el archivo .env
    const MI_TOKEN = process.env.SCOREBAT_TOKEN; 
    
    if (!MI_TOKEN) {
      console.error('¡Error Fatal: SCOREBAT_TOKEN no está definido en .env!');
      return res.status(500).json({ message: 'Error de configuración.' });
    }

    const url = `https://www.scorebat.com/video-api/v3/feed/?token=${MI_TOKEN}`; 
    const response = await axios.get(url);
    
    // Diagnóstico en terminal
    //console.log('Respuesta de ScoreBat:', JSON.stringify(response.data, null, 2));

    // Enviamos la respuesta al frontend
    res.json(response.data.response); 

  } catch (error) {
    console.error('Error al obtener videos:', error.message);
    res.status(500).json({ message: 'Error al cargar los videos.' });
  }
});

module.exports = router;