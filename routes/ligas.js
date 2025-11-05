const express = require('express');
const router = express.Router();
const axios = require('axios'); // ¡Recuerda tenerlo instalado!

// Esta es la URL base de la API
const API_BASE_URL = 'https://api.football-data.org/v4';
const API_KEY = process.env.API_FUTBOL_KEY;

const config = {
  headers: {
    'X-Auth-Token': API_KEY
  }
};

// @ruta    GET /api/ligas/
// @desc    Obtener lista de competiciones
router.get('/', async (req, res) => {
  const url = `${API_BASE_URL}/competitions`;

  try {
    const response = await axios.get(url, config);
    res.json(response.data);
  } catch (error) {
    console.error('Error al llamar a la API de fútbol (ligas):', error.response ? error.response.data : error.message);
    res.status(500).send('Error al obtener los datos de la API de fútbol');
  }
});

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
// @desc    Obtener los próximos partidos de UNA liga (NUEVA)
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
// (¡Ya no está la llave extra aquí!)