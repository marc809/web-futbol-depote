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
  // --- ¡¡NUEVO CAMPO!! ---
  highScore: {
    type: Number,
    default: 0
  },
  // -------------------------
  fechaRegistro: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', UserSchema);