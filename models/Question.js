const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  pregunta: {
    type: String,
    required: true
  },
  // Un array de strings, ej: ["Alemania", "Brasil", "Argentina"]
  opciones: {
    type: [String],
    required: true
  },
  // El NÚMERO (índice) de la respuesta correcta en el array 'opciones'
  // ej: si opciones[1] es la correcta, este valor será 1
  respuestaCorrecta: {
    type: Number,
    required: true
  }
});

module.exports = mongoose.model('Question', QuestionSchema);