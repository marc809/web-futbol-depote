require('dotenv').config(); // ¡Siempre primero!
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');

const app = express();

// --- Configuración de Passport ---
require('./config/passport')(passport); // [cite: uploaded:depote_full/config/passport.js]

// --- Conexión MongoDB ---
mongoose.connect(process.env.MONGO_URI) // [cite: uploaded:depote_full/.env]
  .then(() => console.log('MongoDB Conectado...'))
  .catch(err => console.error(err));

// --- Middlewares ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// --- Middleware de Sesión (Requerido por Passport) ---
app.use(
  session({
    secret: process.env.SESSION_SECRET, // [cite: uploaded:depote_full/.env]
    resave: false,
    saveUninitialized: false // No guardar sesiones vacías
  })
);

// --- Inicializar Passport ---
app.use(passport.initialize());
app.use(passport.session()); // Para usar las sesiones

// --- Rutas ---
app.use('/auth', require('./routes/auth')); // [cite: uploaded:depote_full/routes/auth.js]
app.use('/api/ligas', require('./routes/ligas')); // [cite: uploaded:depote_full/routes/ligas.js]
app.use('/api/quiz', require('./routes/quiz')); // [cite: uploaded:depote_full/routes/quiz.js]
app.use('/api/leaderboard', require('./routes/leaderboard')); // [cite: uploaded:depote_full/routes/leaderboard.js]

// --- ¡¡NUEVA RUTA PARA VIDEOS!! ---
app.use('/api/videos', require('./routes/videos'));


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
  console.log(`Prueba tu app en: http://localhost:${PORT}/`);
});