const mongoose = require('mongoose');

const CacheSchema = new mongoose.Schema({
  // Clave única para identificar el dato (ej: 'leagues_list')
  key: { 
    type: String,
    required: true,
    unique: true
  },
  // El JSON completo que devuelve la API
  data: { 
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  // La fecha en que se guardó este dato por última vez
  createdAt: { 
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Cache', CacheSchema);