// Contenedores principales
let ligasContainer;
let standingsContainer;
let ligasLista;
let standingsTable;
let standingsTitle;
let backButton;
let authContainer;
let matchesList;

// Variables para el Quiz
let startQuizButton;
let quizContainer;
let questionText;
let optionsContainer;
let feedbackContainer; 
let quizStatsContainer; 
let currentQuestionId = null; 

let leaderboardContainer;
let loginWarningDiv; // Para el aviso de login

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. "Cacheamos" los elementos del DOM
    ligasContainer = document.getElementById('ligas-container');
    standingsContainer = document.getElementById('standings-container');
    ligasLista = document.getElementById('ligas-lista');
    standingsTable = document.getElementById('standings-table');
    standingsTitle = document.getElementById('standings-title');
    backButton = document.getElementById('back-button');
    authContainer = document.getElementById('auth-container');
    matchesList = document.getElementById('matches-list');

    startQuizButton = document.getElementById('start-quiz-button');
    quizContainer = document.getElementById('quiz-container');
    questionText = document.getElementById('question-text');
    optionsContainer = document.getElementById('options-container');
    feedbackContainer = document.getElementById('feedback-container');
    quizStatsContainer = document.getElementById('quiz-stats-container'); 
    leaderboardContainer = document.getElementById('leaderboard-container');

    // --- Aviso de Login (Fase 2) ---
    loginWarningDiv = document.createElement('div');
    loginWarningDiv.className = 'hidden bg-yellow-600 bg-opacity-20 border-l-4 border-yellow-500 text-yellow-100 p-3 mb-4 rounded';
    loginWarningDiv.innerHTML = '<p class="font-bold">¡Atención!</p><p>Estás jugando como invitado. Tu puntaje <span class="font-bold">NO se guardará</span> en el Leaderboard. <a href="#" id="login-link-warning" class="underline hover:text-white">Inicia sesión</a> para acumular puntos.</p>';
    startQuizButton.parentNode.insertBefore(loginWarningDiv, startQuizButton);
    loginWarningDiv.querySelector('#login-link-warning').addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    // ---------------------------------

    backButton.addEventListener('click', mostrarLigas);

    if (startQuizButton) {
        startQuizButton.addEventListener('click', iniciarQuiz);
    }

    checkLoginStatus();
    cargarLigas();
    cargarLeaderboard();
});

// --- Función para ver el Login (¡¡RESPONSIVE!!) ---
async function checkLoginStatus() {
    try {
        const response = await fetch('/auth/me'); // [cite: depote_full/routes/auth.js]
        const data = await response.json();

        if (data.user) {
            const username = data.user.username || data.user.email;
            const totalScore = data.user.totalScore || 0;
            
            // ¡CAMBIO! 'flex-col sm:flex-row' -> Se apila en móvil, se pone en fila en pantallas 'sm' (small) y más grandes
            // 'gap-4 sm:gap-0' -> Añade espacio en móvil cuando está apilado
            authContainer.innerHTML = `
                <div class="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0">
                    <div class="text-center sm:text-left">
                        <p class="text-lg">¡Hola, <span class="font-bold text-cyan-400">${username}</span>!</p>
                        <p class="text-sm text-gray-400">Puntaje Total Acumulado: <span class="font-bold text-yellow-400">${totalScore}</span></p>
                    </div>
                    <!-- ¡CAMBIO! 'w-full sm:w-auto' -> Botón ocupa todo el ancho en móvil -->
                    <button id="logout-button" class="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200">
                        Cerrar Sesión
                    </button>
                </div>
            `;
            
            document.getElementById('logout-button').addEventListener('click', async () => {
                await fetch('/auth/logout'); // [cite: depote_full/routes/auth.js]
                location.reload(); 
            });

            loginWarningDiv.classList.add('hidden');

        } else {
            authContainer.innerHTML = `
                <a href="/auth/google" class="inline-block bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200">
                    Iniciar Sesión con Google
                </a>
            `;
            loginWarningDiv.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error revisando el login:', error);
        authContainer.innerHTML = '<p class="text-red-500">Error al cargar estado de autenticación.</p>';
    }
}


// --- Función para Cargar Ligas ---
async function cargarLigas() {
    try {
        const response = await fetch('/api/ligas'); // [cite: depote_full/routes/ligas.js]
        const data = await response.json();
        
        ligasLista.innerHTML = ''; 

        data.competitions.forEach(liga => {
            if (liga.plan === 'TIER_ONE') {
                const link = document.createElement('a');
                link.href = '#'; 
                // ¡CAMBIO! Texto más pequeño en móvil
                link.textContent = `${liga.name} (${liga.area.name})`;
                link.dataset.id = liga.id; 
                link.dataset.name = liga.name;
                link.className = "flex items-center p-3 md:p-4 text-base md:text-lg bg-gray-800 rounded-lg shadow-md mb-3 hover:bg-gray-700 transition duration-200";

                if (liga.area.flag) {
                    const img = document.createElement('img');
                    img.src = liga.area.flag;
                    img.className = 'w-6 h-auto ml-auto rounded-sm'; 
                    link.appendChild(img);
                }
                
                link.addEventListener('click', (e) => {
                    e.preventDefault(); 
                    const id = e.currentTarget.dataset.id;
                    const name = e.currentTarget.dataset.name;
                    mostrarTabla(id, name);
                });

                ligasLista.appendChild(link);
            }
        });

    } catch (error) {
        console.error('Error al cargar las ligas:', error);
        ligasLista.textContent = 'Error al cargar las ligas. Intenta recargar.';
    }
}

// --- Función para Mostrar la Tabla (¡¡RESPONSIVE!!) ---
async function mostrarTabla(id, nombre) {
    ligasContainer.classList.add('hidden');
    standingsContainer.classList.remove('hidden');
    standingsTitle.textContent = `Tabla de - ${nombre}`;
    standingsTable.innerHTML = '<p class="text-center text-lg">Cargando tabla...</p>';
    try {
        const response = await fetch(`/api/ligas/${id}/standings`); // [cite: depote_full/routes/ligas.js]
        const data = await response.json();
        cargarPartidos(id); 
        const tablaData = data.standings[0].table;
        
        // ¡CAMBIO! Padding y texto más pequeños en móvil (p-2, text-xs)
        let tableHtml = `
            <table class="min-w-full bg-gray-800 rounded-lg">
                <thead class="bg-gray-700">
                    <tr>
                        <th class="p-2 text-xs sm:p-3 sm:text-sm font-semibold text-left">Pos</th>
                        <th class="p-2 text-xs sm:p-3 sm:text-sm font-semibold text-left" colspan="2">Equipo</th>
                        <th class="p-2 text-xs sm:p-3 sm:text-sm font-semibold text-center">Pts</th>
                        <!-- ¡CAMBIO! Ocultamos 'PJ' y 'DG' en pantallas pequeñas (hidden md:table-cell) -->
                        <th class="p-2 text-xs sm:p-3 sm:text-sm font-semibold text-center hidden md:table-cell">PJ</th>
                        <th class="p-2 text-xs sm:p-3 sm:text-sm font-semibold text-center hidden md:table-cell">DG</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-700">
        `;

        tablaData.forEach(equipo => {
            // ¡CAMBIO! Padding y texto más pequeños en móvil
            tableHtml += `
                <tr class="hover:bg-gray-700">
                    <td class="p-2 text-xs sm:p-3 sm:text-sm">${equipo.position}</td>
                    <td class="p-2 text-xs sm:p-3 sm:text-sm">
                        <img src="${equipo.team.crest}" alt="${equipo.team.name}" class="w-6 h-6 inline-block mr-2">
                    </td>
                    <td class="p-2 text-xs sm:p-3 sm:text-sm font-medium">${equipo.team.name}</td>
                    <td class="p-2 text-xs sm:p-3 sm:text-sm text-center font-bold">${equipo.points}</td>
                    <!-- ¡CAMBIO! Ocultamos 'PJ' y 'DG' en pantallas pequeñas -->
                    <td class="p-2 text-xs sm:p-3 sm:text-sm text-center hidden md:table-cell">${equipo.playedGames}</td>
                    <td class="p-2 text-xs sm:p-3 sm:text-sm text-center hidden md:table-cell">${equipo.goalDifference}</td>
                </tr>
            `;
        });
        tableHtml += '</tbody></table>';
        standingsTable.innerHTML = tableHtml;
    } catch (error) {
        console.error('Error al cargar la tabla:', error);
        standingsTable.innerHTML = '<p class="text-center text-red-500">Error al cargar la tabla.</p>';
        matchesList.innerHTML = ''; 
    }
}

function mostrarLigas() {
    standingsContainer.classList.add('hidden');
    ligasContainer.classList.remove('hidden');
}

// --- Función para Cargar Partidos (¡¡RESPONSIVE!!) ---
async function cargarPartidos(id) {
    matchesList.innerHTML = '<p class="text-center text-lg">Cargando próximos partidos...</p>';
    try {
        const response = await fetch(`/api/ligas/${id}/matches`); // [cite: depote_full/routes/ligas.js]
        const data = await response.json();
        if (data.matches.length === 0) {
            matchesList.innerHTML = '<p class="text-center text-gray-400">No hay próximos partidos programados.</p>';
            return;
        }
        matchesList.innerHTML = '';
        data.matches.forEach(match => {
            const fecha = new Date(match.utcDate).toLocaleString('es-ES', {
                day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
            });
            const matchElement = document.createElement('div');
            matchElement.className = 'p-4 bg-gray-800 rounded-lg shadow-md mb-3';
            
            // ¡CAMBIO! 'flex-col sm:flex-row' -> Se apila en móvil
            // 'items-start sm:items-center' -> Se alinea diferente en móvil
            matchElement.innerHTML = `
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <span class="font-bold text-cyan-400">Jornada ${match.matchday}</span>
                    <span class="text-sm text-gray-400">${fecha}</span>
                </div>
                <!-- ¡CAMBIO! Texto más pequeño (text-base) en móvil -->
                <div class="flex items-center justify-center text-base md:text-lg mt-4">
                    <!-- ¡CAMBIO! 'w-full sm:w-2/5' -> Ocupa todo el ancho en móvil y se centra -->
                    <div class="w-full sm:w-2/5 text-center sm:text-right font-semibold truncate order-2 sm:order-1">${match.homeTeam.name}</div>
                    <img src="${match.homeTeam.crest}" class="w-6 h-6 mx-2 md:mx-4 order-2 sm:order-1" alt="${match.homeTeam.name}">
                    <span class="text-gray-400 text-sm order-2 sm:order-1">vs</span>
                    <img src="${match.awayTeam.crest}" class="w-6 h-6 mx-2 md:mx-4 order-2 sm:order-1" alt="${match.awayTeam.name}">
                    <div class="w-full sm:w-2/5 text-center sm:text-left font-semibold truncate order-2 sm:order-1">${match.awayTeam.name}</div>
                </div>
            `;
            matchesList.appendChild(matchElement);
        });
    } catch (error) {
        console.error('Error al cargar los partidos:', error);
        matchesList.innerHTML = '<p class="text-center text-red-500">Error al cargar los partidos.</p>';
    }
}

// ===================================
// --- LÓGICA DEL QUIZ (Fase 1) ---
// ===================================

function actualizarEstadisticas(score, count, total) {
    quizStatsContainer.textContent = `Puntaje: ${score} | Pregunta: ${count} / ${total}`;
}

async function iniciarQuiz() {
    startQuizButton.classList.add('hidden');
    loginWarningDiv.classList.add('hidden'); 
    quizContainer.classList.remove('hidden');
    startQuizButton.textContent = '¡Empezar Quiz!'; 
    try {
        const response = await fetch('/api/quiz/start'); // [cite: depote_full/routes/quiz.js]
        if (!response.ok) { throw new Error('No se pudo cargar la pregunta'); }
        const data = await response.json();
        mostrarPregunta(data.pregunta);
        actualizarEstadisticas(data.score, data.questionCount, data.totalQuestions);
    } catch (error) {
        console.error('Error al iniciar el quiz:', error);
        questionText.textContent = 'Error al cargar el quiz. Inténtalo de nuevo.';
    }
}

function mostrarPregunta(pregunta) {
    currentQuestionId = pregunta.id; 
    questionText.textContent = pregunta.texto;
    optionsContainer.innerHTML = '';
    feedbackContainer.innerHTML = ''; 
    pregunta.opciones.forEach((opcion, index) => {
        const button = document.createElement('button');
        button.textContent = opcion;
        button.className = 'w-full bg-cyan-600 hover:bg-cyan-700 p-3 rounded-lg text-left transition duration-150';
        button.dataset.index = index; 
        button.addEventListener('click', enviarRespuesta);
        optionsContainer.appendChild(button);
    });
}

async function enviarRespuesta(event) {
    const selectedIndex = event.target.dataset.index;
    const clickedButton = event.target; 
    const buttons = optionsContainer.querySelectorAll('button');
    buttons.forEach(btn => {
        btn.disabled = true;
        btn.classList.remove('hover:bg-cyan-700'); 
        btn.classList.add('opacity-70'); 
    });
    try {
        const response = await fetch('/api/quiz/submit', { // [cite: depote_full/routes/quiz.js]
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ questionId: currentQuestionId, answerIndex: selectedIndex })
        });
        const data = await response.json();
        const correctButton = optionsContainer.querySelector(`button[data-index="${data.correctAnswerIndex}"]`);
        if (data.message.startsWith('¡Correcto!')) {
            feedbackContainer.className = 'mt-4 text-lg font-semibold text-green-400';
            clickedButton.className = 'w-full bg-green-500 text-white p-3 rounded-lg text-left transition duration-150';
        } else {
            feedbackContainer.className = 'mt-4 text-lg font-semibold text-red-400';
            clickedButton.className = 'w-full bg-red-500 text-white p-3 rounded-lg text-left transition duration-150';
            if (correctButton) {
                correctButton.className = 'w-full bg-green-500 text-white p-3 rounded-lg text-left transition duration-150';
            }
        }
        feedbackContainer.textContent = data.message;
        if (data.quizTerminado) {
            quizStatsContainer.innerHTML = ''; 
            setTimeout(() => {
                questionText.textContent = '¡Quiz Completado!';
                let finalMessage = `<p class="text-xl md:text-2xl text-center">Puntaje de la partida: <span class="font-bold text-cyan-400">${data.finalScore} / ${data.totalQuestions}</span></p>`;
                if (data.userTotalScore !== undefined && data.userTotalScore > 0) {
                     finalMessage += `<p class="text-lg md:text-xl text-center text-gray-300 mt-2">Tu puntaje total acumulado es ahora: <span class="font-bold text-yellow-400">${data.userTotalScore}</span></p>`;
                } else {
                    finalMessage += `<p class="text-sm text-center text-yellow-200 mt-4 bg-yellow-900 bg-opacity-50 p-2 rounded">Este puntaje no se guardó porque jugaste como invitado.</p>`;
                }
                if (data.newHighScore) {
                    finalMessage += `<p class="text-lg md:text-xl text-center text-yellow-400 mt-2">🎉 ¡Nuevo récord de partida! 🎉</p>`;
                }
                checkLoginStatus(); 
                cargarLeaderboard(); 
                optionsContainer.innerHTML = finalMessage;
                feedbackContainer.innerHTML = ''; 
                startQuizButton.classList.remove('hidden');
                startQuizButton.textContent = 'Jugar de Nuevo';
                checkLoginStatus(); // Revisa si debe mostrar el aviso de login
            }, 2000); 
        } else if (data.siguientePregunta) {
            setTimeout(() => {
                mostrarPregunta(data.siguientePregunta);
                actualizarEstadisticas(data.score, data.questionCount, data.totalQuestions);
            }, 2000); 
        }
    } catch (error) {
        console.error('Error al enviar respuesta:', error);
        feedbackContainer.textContent = 'Error al enviar tu respuesta.';
    }
}

// --- FUNCIÓN LEADERBOARD (¡¡RESPONSIVE!!) ---
async function cargarLeaderboard() {
    try {
        const response = await fetch('/api/leaderboard'); // [cite: depote_full/routes/leaderboard.js]
        const users = await response.json();
        if (users.length === 0) {
            leaderboardContainer.innerHTML = '<p>Aún no hay puntajes. ¡Sé el primero!</p>';
            return;
        }
        let leaderboardHtml = '<ol class="list-decimal list-inside space-y-2">';
        users.forEach((user, index) => {
            let rankStyle = '';
            if (index === 0) rankStyle = 'bg-yellow-600 bg-opacity-30';
            if (index === 1) rankStyle = 'bg-gray-400 bg-opacity-30';
            if (index === 2) rankStyle = 'bg-yellow-800 bg-opacity-30';
            
            // ¡CAMBIO! Texto más pequeño (text-base) en móvil
            leaderboardHtml += `
                <li class="text-base sm:text-lg flex justify-between items-center p-2 rounded ${rankStyle}">
                    <span class="truncate mr-2">
                        <span class="font-bold w-6 inline-block">${index + 1}.</span>
                        ${user.username}
                    </span>
                    <span class="font-bold text-cyan-400 whitespace-nowrap">${user.totalScore} pts</span>
                </li>
            `;
        });
        leaderboardHtml += '</ol>';
        leaderboardContainer.innerHTML = leaderboardHtml;
    } catch (error) {
        console.error('Error al cargar el leaderboard:', error);
        leaderboardContainer.innerHTML = '<p class="text-red-500">Error al cargar los puntajes.</p>';
    }
}