const express = require('express');
const router = express.Router();
const User = require('../models/User'); // [cite: uploaded:depote_full/models/User.js]

// @ruta    GET /api/leaderboard
// @desc    Obtener los 10 mejores puntajes (Top 10)
router.get('/', async (req, res) => {
  try {
    // 
    // Buscamos usuarios, los ordenamos por highScore de forma descendente,
    // limitamos a 10 resultados y seleccionamos solo el username y el highScore.
    const leaderboard = await User.find()
      .sort({ highScore: -1 }) // -1 para orden descendente
      .limit(10)                // Límite de 10 usuarios
      .select('username highScore'); // Solo traer nombre y puntaje (para seguridad)

    res.json(leaderboard);
  } catch (error) {
    console.error('Error al cargar el leaderboard:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;