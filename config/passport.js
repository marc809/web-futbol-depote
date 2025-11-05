const GoogleStrategy = require('passport-google-oauth20').Strategy;
const mongoose = require('mongoose');
const User = require('../models/User'); // Asegúrate que la ruta sea correcta

module.exports = function(passport) {
  
  // 1. Definimos la URL de callback
  // Usa la variable de entorno RENDER_SERVICE_URL (producción) o la local (desarrollo)
  const callbackURL = process.env.RENDER_SERVICE_URL 
    ? `${process.env.RENDER_SERVICE_URL}/auth/google/callback` 
    : '/auth/google/callback'; 
    
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: callbackURL // <-- Usamos la variable
      },
      async (accessToken, refreshToken, profile, done) => {
        const newUser = {
          googleId: profile.id,
          username: profile.displayName,
          email: profile.emails[0].value
        };

        try {
          let user = await User.findOne({ googleId: profile.id });

          if (user) {
            done(null, user);
          } else {
            user = await User.findOne({ email: profile.emails[0].value });
            
            if(user) {
              user.googleId = profile.id;
              user = await user.save();
              done(null, user);
            } else {
              user = await User.create(newUser);
              done(null, user);
            }
          }
        } catch (err) {
          console.error(err);
          done(err, null);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id); 
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user); 
    } catch (err) {
      done(err, null);
    }
  });
};