const express = require('express');
const router = express.Router();
const Question = require('../models/Question'); //
// ¡¡NUEVO!! Importamos el modelo User para guardar el récord
const User = require('../models/User'); //

const TOTAL_QUESTIONS_PER_GAME = 10;

// --- RUTA: GET /api/quiz/start ---
router.get('/start', async (req, res) => {
  try {
    // 1. Inicia la sesión del quiz
    req.session.quiz = {
      score: 0,
      questionCount: 0,
      questionsAnswered: [] 
    };

    // 2. Buscamos la PRIMERA pregunta aleatoria
    const randomQuestion = await Question.aggregate([
      { $sample: { size: 1 } }
    ]);

    if (!randomQuestion.length) {
      return res.status(404).json({ message: 'No se encontraron preguntas en la base de datos.' });
    }
    const pregunta = randomQuestion[0];
    req.session.quiz.questionsAnswered.push(pregunta._id);

    const preguntaParaFrontend = {
      id: pregunta._id,
      texto: pregunta.pregunta,
      opciones: pregunta.opciones
    };

    // 5. Enviamos la pregunta y el estado inicial del juego
    // (Esto es de la Mejora 1 que ya funciona)
    res.status(200).json({
      message: '¡Quiz iniciado!',
      pregunta: preguntaParaFrontend,
      score: 0,
      questionCount: 1, // Esta es la pregunta 1
      totalQuestions: TOTAL_QUESTIONS_PER_GAME
    });

  } catch (error) {
    console.error('Error al iniciar el quiz:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// --- RUTA: POST /api/quiz/submit ---
router.post('/submit', async (req, res) => {
  try {
    if (!req.session.quiz) {
      return res.status(400).json({ message: 'No has iniciado un quiz. Por favor, refresca la página.' });
    }

    const { questionId, answerIndex } = req.body;
    let sessionData = req.session.quiz;

    const preguntaCorrecta = await Question.findById(questionId);
    if (!preguntaCorrecta) {
      return res.status(404).json({ message: 'Esa pregunta ya no existe.' });
    }

    let esCorrecto = false;
    if (parseInt(answerIndex) === preguntaCorrecta.respuestaCorrecta) {
      esCorrecto = true;
      sessionData.score += 1; 
    }
    sessionData.questionCount += 1; 

    // Variables para enviar al frontend
    let newHighScore = false;
    let userHighScore = 0;

    // 4. ¿El juego ha terminado?
    if (sessionData.questionCount >= TOTAL_QUESTIONS_PER_GAME) {
      const finalScore = sessionData.score;
      
      // --- ¡¡LÓGICA DE MEJORA 2!! ---
      // 
      // Comprobamos si el usuario está autenticado
      if (req.isAuthenticated()) { //
        userHighScore = req.user.highScore || 0;
        if (finalScore > userHighScore) {
          userHighScore = finalScore;
          newHighScore = true;
          // Actualizamos el récord en la BD
          await User.findByIdAndUpdate(req.user.id, { highScore: finalScore });
        }
      }
      // ---------------------------------
      
      req.session.quiz = null; // Limpiamos la sesión

      return res.json({
        message: esCorrecto ? '¡Correcto!' : `Incorrecto. La respuesta era: ${preguntaCorrecta.opciones[preguntaCorrecta.respuestaCorrecta]}`,
        quizTerminado: true,
        finalScore: finalScore,
        totalQuestions: TOTAL_QUESTIONS_PER_GAME,
        correctAnswerIndex: preguntaCorrecta.respuestaCorrecta,
        newHighScore: newHighScore, // Enviamos 'true' si hay nuevo récord
        userHighScore: userHighScore // Enviamos el récord (nuevo o antiguo)
      });
    }

    // 5. Si el juego NO ha terminado, buscamos la siguiente pregunta
    const siguientePreguntaArray = await Question.aggregate([
      { $match: { _id: { $nin: sessionData.questionsAnswered } } },
      { $sample: { size: 1 } }
    ]);

    if (!siguientePreguntaArray.length) {
      //... (Misma lógica de fin de juego si se acaban las preguntas)
      const finalScore = sessionData.score;
      if (req.isAuthenticated()) {
        userHighScore = req.user.highScore || 0;
        if (finalScore > userHighScore) {
          userHighScore = finalScore;
          newHighScore = true;
          await User.findByIdAndUpdate(req.user.id, { highScore: finalScore });
        }
      }
      req.session.quiz = null;
      return res.json({
        message: esCorrecto ? '¡Correcto!' : `Incorrecto. La respuesta era: ${preguntaCorrecta.opciones[preguntaCorrecta.respuestaCorrecta]}`,
        quizTerminado: true,
        finalScore: finalScore,
        totalQuestions: sessionData.questionCount,
        correctAnswerIndex: preguntaCorrecta.respuestaCorrecta,
        newHighScore: newHighScore,
        userHighScore: userHighScore
      });
    }

    // 6. Preparamos y enviamos la siguiente pregunta
    const siguientePregunta = siguientePreguntaArray[0];
    sessionData.questionsAnswered.push(siguientePregunta._id);
    req.session.quiz = sessionData;

    const siguientePreguntaParaFrontend = {
      id: siguientePregunta._id,
      texto: siguientePregunta.pregunta,
      opciones: siguientePregunta.opciones
    };

    const mensajeFeedback = esCorrecto ? '¡Correcto!' : `Incorrecto. La respuesta era: ${preguntaCorrecta.opciones[preguntaCorrecta.respuestaCorrecta]}`;

    res.json({
      message: mensajeFeedback,
      siguientePregunta: siguientePreguntaParaFrontend,
      quizTerminado: false,
      score: sessionData.score,
      questionCount: sessionData.questionCount + 1, 
      totalQuestions: TOTAL_QUESTIONS_PER_GAME,
      correctAnswerIndex: preguntaCorrecta.respuestaCorrecta
    });

  } catch (error) {
    console.error('Error al enviar respuesta:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});


// Ruta de resultados (no la usamos activamente, pero es bueno tenerla)
router.get('/results', (req, res) => {
  try {
    const puntajeFinal = req.session.quiz ? req.session.quiz.score : 0;
    res.status(200).json({ 
      message: 'Puntaje final', 
      score: puntajeFinal 
    });
  } catch (error) {
    console.error('Error al obtener resultados:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

module.exports = router;