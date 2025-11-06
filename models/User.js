const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    sparse: true 
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String 
  },
  googleId: {
    type: String 
  },
  // Récord de una sola partida (lo mantenemos por si acaso quieres mostrarlo luego)
  highScore: {
    type: Number,
    default: 0
  },
  // --- ¡¡NUEVO CAMPO ACUMULATIVO!! ---
  // Aquí se sumarán todos los puntos de todas las partidas
  totalScore: {
    type: Number,
    default: 0
  },
  // ------------------------------------
  fechaRegistro: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', UserSchema);