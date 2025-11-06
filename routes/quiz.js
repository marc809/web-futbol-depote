const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const User = require('../models/User');

const TOTAL_QUESTIONS_PER_GAME = 10;

// --- RUTA: GET /api/quiz/start ---
// Inicia una nueva sesión y PRE-CARGA las 10 preguntas
router.get('/start', async (req, res) => {
  try {
    // 1. Seleccionamos 10 preguntas aleatorias de una sola vez.
    // Esto garantiza que NO haya repetidas en esta partida.
    const questionsForGame = await Question.aggregate([
      { $sample: { size: TOTAL_QUESTIONS_PER_GAME } }
    ]);

    // Por seguridad, si la base de datos tiene menos de 10 preguntas
    if (questionsForGame.length < TOTAL_QUESTIONS_PER_GAME) {
        // (Opcional: podrías dejar jugar con menos, pero mejor avisar)
        // console.warn("Menos de 10 preguntas encontradas");
    }

    // 2. Guardamos la lista COMPLETA de preguntas en la sesión del usuario
    req.session.quiz = {
      score: 0,
      currentQuestionIndex: 0, // Empezamos por la primera pregunta (índice 0)
      questionsList: questionsForGame 
    };

    // 3. Preparamos la primera pregunta para enviarla al frontend
    const primeraPregunta = questionsForGame[0];
    const preguntaParaFrontend = {
      id: primeraPregunta._id,
      texto: primeraPregunta.pregunta,
      opciones: primeraPregunta.opciones
    };

    // 4. Enviamos la respuesta inicial
    res.status(200).json({
      message: '¡Quiz iniciado!',
      pregunta: preguntaParaFrontend,
      score: 0,
      questionCount: 1,
      totalQuestions: TOTAL_QUESTIONS_PER_GAME
    });

  } catch (error) {
    console.error('Error al iniciar el quiz:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// --- RUTA: POST /api/quiz/submit ---
// Recibe una respuesta, verifica y manda la siguiente de la lista guardada
router.post('/submit', async (req, res) => {
  try {
    // Verificamos si existe una sesión de quiz activa
    if (!req.session.quiz || !req.session.quiz.questionsList) {
      return res.status(400).json({ message: 'Sesión expirada o inválida. Por favor, reinicia el juego.' });
    }

    const { questionId, answerIndex } = req.body;
    let sessionData = req.session.quiz;

    // 1. Obtenemos la pregunta ACTUAL desde la sesión (sin llamar a la BD de nuevo)
    const currentQuestion = sessionData.questionsList[sessionData.currentQuestionIndex];

    // Verificación de seguridad: ¿El usuario está respondiendo la pregunta correcta?
    if (!currentQuestion || currentQuestion._id.toString() !== questionId) {
       return res.status(400).json({ message: 'Error de sincronización. Reinicia el juego.' });
    }

    // 2. Comprobamos si la respuesta es correcta
    let esCorrecto = false;
    if (parseInt(answerIndex) === currentQuestion.respuestaCorrecta) {
      esCorrecto = true;
      sessionData.score += 1; // Sumamos 1 punto a la partida actual
    }

    // 3. Avanzamos el índice a la siguiente pregunta
    sessionData.currentQuestionIndex += 1;

    // 4. ¿El juego ha terminado (llegamos a 10)?
    if (sessionData.currentQuestionIndex >= TOTAL_QUESTIONS_PER_GAME) {
      const finalScore = sessionData.score;
      let newHighScore = false;
      let userTotalScore = 0;

      // --- ACTUALIZACIÓN DE PUNTAJES EN LA BD ---
      if (req.isAuthenticated()) {
        // Buscamos al usuario en la BD para actualizar sus stats
        const user = await User.findById(req.user.id);
        
        // ACUMULATIVO: Sumamos los puntos de esta partida al total histórico
        user.totalScore = (user.totalScore || 0) + finalScore;
        userTotalScore = user.totalScore;

        // RÉCORD: Si esta partida fue su mejor histórica, actualizamos highScore también
        if (finalScore > user.highScore) {
          user.highScore = finalScore;
          newHighScore = true;
        }
        await user.save();
      }
      // -------------------------------------------

      req.session.quiz = null; // Limpiamos la sesión porque el juego terminó

      return res.json({
        message: esCorrecto ? '¡Correcto!' : `Incorrecto. La respuesta era: ${currentQuestion.opciones[currentQuestion.respuestaCorrecta]}`,
        quizTerminado: true,
        finalScore: finalScore,
        totalQuestions: TOTAL_QUESTIONS_PER_GAME,
        correctAnswerIndex: currentQuestion.respuestaCorrecta,
        userTotalScore: userTotalScore, // Enviamos el nuevo total acumulado para mostrarlo
        newHighScore: newHighScore
      });
    }

    // 5. Si el juego NO ha terminado, obtenemos la SIGUIENTE pregunta de la lista
    const siguientePregunta = sessionData.questionsList[sessionData.currentQuestionIndex];
    
    // Guardamos el progreso en la sesión
    req.session.quiz = sessionData;

    // Enviamos la siguiente pregunta al frontend
    res.json({
      message: esCorrecto ? '¡Correcto!' : `Incorrecto. La respuesta era: ${currentQuestion.opciones[currentQuestion.respuestaCorrecta]}`,
      siguientePregunta: {
        id: siguientePregunta._id,
        texto: siguientePregunta.pregunta,
        opciones: siguientePregunta.opciones
      },
      quizTerminado: false,
      score: sessionData.score,
      questionCount: sessionData.currentQuestionIndex + 1, // Para mostrar "Pregunta 2/10", etc.
      totalQuestions: TOTAL_QUESTIONS_PER_GAME,
      correctAnswerIndex: currentQuestion.respuestaCorrecta
    });

  } catch (error) {
    console.error('Error al enviar respuesta:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

module.exports = router;