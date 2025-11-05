const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Asegúrate que la ruta sea correcta
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');

// --- RUTAS DE LOGIN/REGISTRO NORMAL (con JWT) ---
// (Estas rutas no las hemos usado aún, pero están listas para el futuro)
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ msg: 'Por favor, incluye todos los campos' });
  }

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'El email ya está registrado' });
    }
    
    user = await User.findOne({ username });
    if (user) {
      return res.status(400).json({ msg: 'El nombre de usuario ya existe' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({ 
      username, 
      email, 
      password: hashedPassword 
    });
    
    await user.save();
    const payload = { user: { id: user.id } };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ msg: 'Por favor, incluye email y password' });
  }

  try {
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Credenciales inválidas' });
    }
    
    if (!user.password) {
      return res.status(400).json({ msg: 'Inicia sesión con Google' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Credenciales inválidas' });
    }
    const payload = { user: { id: user.id } };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
});


// --- RUTAS DE LOGIN CON GOOGLE (con Passport y Sesiones) ---

// @ruta    GET /auth/google
// @desc    Iniciar el proceso de login con Google
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'] 
}));

// @ruta    GET /auth/google/callback
// @desc    Callback de Google después de autenticar
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }), // Si falla, vuelve al inicio
  (req, res) => {
    // Si tiene éxito, redirige al frontend (index.html)
    res.redirect('/');
  }
);

// @ruta    GET /auth/logout
// @desc    Cerrar sesión (MODIFICADA)
router.get('/logout', (req, res, next) => {
  req.logout((err) => { 
    if (err) { return next(err); }
    // Enviamos JSON para que el frontend sepa que funcionó
    res.json({ message: 'Logout exitoso' });
  });
});


// @ruta    GET /auth/me
// @desc    Devuelve el usuario actual si está logueado (NUEVA)
router.get('/me', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ user: req.user });
  } else {
    res.json({ user: null });
  }
});


module.exports = router;