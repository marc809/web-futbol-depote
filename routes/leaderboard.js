const express = require('express');
const router = express.Router();
const User = require('../models/User');

// @ruta    GET /api/leaderboard
// @desc    Obtener los 20 mejores puntajes acumulados (Top 20 Total)
router.get('/', async (req, res) => {
  try {
    // Buscamos usuarios, los ordenamos por totalScore descendente (de mayor a menor),
    // limitamos a 20 resultados y seleccionamos el nombre y los puntajes.
    const leaderboard = await User.find()
      .sort({ totalScore: -1 }) 
      .limit(20)                
      .select('username totalScore highScore'); 

    res.json(leaderboard);
  } catch (error) {
    console.error('Error al cargar el leaderboard:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;