require('dotenv').config(); // ¡Siempre primero!
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');

const app = express();

// --- Configuración de Passport ---
// Le pasamos 'passport' a nuestra configuración
require('./config/passport')(passport);

// --- Conexión MongoDB ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Conectado...'))
  .catch(err => console.error(err));

// --- Middlewares ---
// Para entender JSON que viene del frontend
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ¡IMPORTANTE! Sirve los archivos estáticos de la carpeta 'public'
app.use(express.static('public'));

// --- Middleware de Sesión (Requerido por Passport) ---
app.use(
  session({
    secret: process.env.SESSION_SECRET, // ¡De tu .env!
    resave: false,
    saveUninitialized: false // No guardar sesiones vacías
  })
);

// --- Inicializar Passport ---
app.use(passport.initialize());
app.use(passport.session()); // Para usar las sesiones

// --- Rutas ---
app.use('/auth', require('./routes/auth'));
app.use('/api/ligas', require('./routes/ligas'));
app.use('/api/quiz', require('./routes/quiz'));

// --- ¡¡ASEGÚRATE DE TENER ESTA LÍNEA!! ---
app.use('/api/leaderboard', require('./routes/leaderboard'));


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
  console.log(`Prueba tu app en: http://localhost:${PORT}/`);
  console.log(`Prueba el quiz en: http://localhost:${PORT}/api/quiz/start`);
});
