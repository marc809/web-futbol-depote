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

// ¡¡NUEVA VARIABLE!!
let leaderboardContainer;

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

    // ¡¡NUEVA LÍNEA!!
    leaderboardContainer = document.getElementById('leaderboard-container');

    // 2. Configuramos el botón de "Volver"
    backButton.addEventListener('click', mostrarLigas);

    // 3. Añadimos el "click listener" al botón de empezar quiz
    if (startQuizButton) {
        startQuizButton.addEventListener('click', iniciarQuiz);
    }

    // 4. Revisamos si el usuario está logueado
    checkLoginStatus();

    // 5. Cargamos la lista de ligas
    cargarLigas();
    
    // 6. ¡¡NUEVA LLAMADA!! Cargamos el leaderboard al iniciar
    cargarLeaderboard();
});

// --- Función para ver el Login (Con Mejora 2) ---
async function checkLoginStatus() {
    try {
        const response = await fetch('/auth/me'); //
        const data = await response.json();

        if (data.user) {
            const username = data.user.username || data.user.email;
            const highScore = data.user.highScore || 0;
            
            authContainer.innerHTML = `
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-lg">¡Hola, <span class="font-bold text-cyan-400">${username}</span>!</p>
                        <p class="text-sm text-gray-400">Tu récord en el Quiz: <span class="font-bold text-yellow-400">${highScore}</span></p>
                    </div>
                    <button id="logout-button" class="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200">
                        Cerrar Sesión
                    </button>
                </div>
            `;
            
            document.getElementById('logout-button').addEventListener('click', async () => {
                await fetch('/auth/logout'); //
                location.reload(); 
            });

        } else {
            authContainer.innerHTML = `
                <a href="/auth/google" class="inline-block bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200">
                    Iniciar Sesión con Google
                </a>
            `;
        }
    } catch (error) {
        console.error('Error revisando el login:', error);
        authContainer.innerHTML = '<p class="text-red-500">Error al cargar estado de autenticación.</p>';
    }
}


// --- Función para Cargar Ligas ---
async function cargarLigas() {
    try {
        const response = await fetch('/api/ligas'); //
        const data = await response.json();
        
        ligasLista.innerHTML = ''; 

        data.competitions.forEach(liga => {
            if (liga.plan === 'TIER_ONE') {
                const link = document.createElement('a');
                link.href = '#'; 
                link.textContent = `${liga.name} (${liga.area.name})`;
                link.dataset.id = liga.id; 
                link.dataset.name = liga.name;
                link.className = "flex items-center p-4 bg-gray-800 rounded-lg shadow-md mb-3 hover:bg-gray-700 transition duration-200";

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

// --- Función para Mostrar la Tabla ---
async function mostrarTabla(id, nombre) {
    ligasContainer.classList.add('hidden');
    standingsContainer.classList.remove('hidden');

    standingsTitle.textContent = `Tabla de - ${nombre}`;
    standingsTable.innerHTML = '<p class="text-center text-lg">Cargando tabla...</p>';

    try {
        const response = await fetch(`/api/ligas/${id}/standings`); //
        const data = await response.json();
        
        cargarPartidos(id); 

        const tablaData = data.standings[0].table;
        
        let tableHtml = `
            <table class="min-w-full bg-gray-800 rounded-lg">
                <thead class="bg-gray-700">
                    <tr>
                        <th class="p-3 text-sm font-semibold text-left">Pos</th>
                        <th class="p-3 text-sm font-semibold text-left" colspan="2">Equipo</th>
                        <th class="p-3 text-sm font-semibold text-center">Pts</th>
                        <th class="p-3 text-sm font-semibold text-center">PJ</th>
                        <th class="p-3 text-sm font-semibold text-center">DG</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-700">
        `;

        tablaData.forEach(equipo => {
            tableHtml += `
                <tr class="hover:bg-gray-700">
                    <td class="p-3 text-sm">${equipo.position}</td>
                    <td class="p-3 text-sm">
                        <img src="${equipo.team.crest}" alt="${equipo.team.name}" class="w-6 h-6 inline-block mr-2">
                    </td>
                    <td class="p-3 text-sm font-medium">${equipo.team.name}</td>
                    <td class="p-3 text-sm text-center font-bold">${equipo.points}</td>
                    <td class="p-3 text-sm text-center">${equipo.playedGames}</td>
                    <td class="p-3 text-sm text-center">${equipo.goalDifference}</td>
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

// --- Función para volver atrás ---
function mostrarLigas() {
    standingsContainer.classList.add('hidden');
    ligasContainer.classList.remove('hidden');
}

// --- Función para Cargar Partidos ---
async function cargarPartidos(id) {
    matchesList.innerHTML = '<p class="text-center text-lg">Cargando próximos partidos...</p>';

    try {
        const response = await fetch(`/api/ligas/${id}/matches`); //
        const data = await response.json();

        if (data.matches.length === 0) {
            matchesList.innerHTML = '<p class="text-center text-gray-400">No hay próximos partidos programados.</p>';
            return;
        }

        matchesList.innerHTML = '';

        data.matches.forEach(match => {
            const fecha = new Date(match.utcDate).toLocaleString('es-ES', {
                day: 'numeric',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit'
            });

            const matchElement = document.createElement('div');
            matchElement.className = 'p-4 bg-gray-800 rounded-lg shadow-md mb-3';
            
            matchElement.innerHTML = `
                <div class="flex justify-between items-center">
                    <span class="font-bold text-cyan-400">Jornada ${match.matchday}</span>
                    <span class="text-sm text-gray-400">${fecha}</span>
                </div>
                <div class="flex items-center justify-center text-lg mt-2">
                    <span class="font-semibold text-right w-2/5">${match.homeTeam.name}</span>
                    <img src="${match.homeTeam.crest}" class="w-6 h-6 mx-4" alt="${match.homeTeam.name}">
                    <span class="text-gray-400">vs</span>
                    <img src="${match.awayTeam.crest}" class="w-6 h-6 mx-4" alt="${match.awayTeam.name}">
                    <span class="font-semibold text-left w-2/5">${match.awayTeam.name}</span>
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
// --- LÓGICA DEL QUIZ (CON MEJORA 3) ---
// ===================================

// Función para actualizar el contador
function actualizarEstadisticas(score, count, total) {
    quizStatsContainer.textContent = `Puntaje: ${score} | Pregunta: ${count} / ${total}`;
}

// Función para empezar el quiz
async function iniciarQuiz() {
    console.log('¡Iniciando el quiz!');
    
    startQuizButton.classList.add('hidden');
    quizContainer.classList.remove('hidden');
    startQuizButton.textContent = '¡Empezar Quiz!'; 

    try {
        const response = await fetch('/api/quiz/start'); //
        
        if (!response.ok) {
            throw new Error('No se pudo cargar la pregunta');
        }
        const data = await response.json();
        
        mostrarPregunta(data.pregunta);
        actualizarEstadisticas(data.score, data.questionCount, data.totalQuestions);

    } catch (error) {
        console.error('Error al iniciar el quiz:', error);
        questionText.textContent = 'Error al cargar el quiz. Inténtalo de nuevo.';
    }
}

// Función para mostrar la pregunta y las opciones
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

// Función para enviar la respuesta al backend (Con Mejora 3)
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
        const response = await fetch('/api/quiz/submit', { //
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                questionId: currentQuestionId,
                answerIndex: selectedIndex
            })
        });

        const data = await response.json();

        // --- LÓGICA MEJORA 3: FEEDBACK VISUAL ---
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
        // -------------------------------------------

        feedbackContainer.textContent = data.message;

        // Cargamos la siguiente pregunta o terminamos el quiz
        if (data.quizTerminado) {
            // ¡EL JUEGO TERMINÓ!
            quizStatsContainer.innerHTML = ''; 
            
            setTimeout(() => {
                questionText.textContent = '¡Quiz Completado!';
                let finalMessage = `<p class="text-2xl text-center">Tu puntaje final es: <span class="font-bold text-cyan-400">${data.finalScore} / ${data.totalQuestions}</span></p>`;
                
                // (Mejora 2: Mensaje de Récord)
                if (data.newHighScore) {
                    finalMessage += `<p class="text-2xl text-center text-yellow-400 mt-2">🎉 ¡¡NUEVO RÉCORD PERSONAL!! 🎉</p>`;
                    checkLoginStatus(); // Actualiza el saludo
                    cargarLeaderboard(); // ¡¡NUEVA LLAMADA!! Actualiza el leaderboard
                }
                optionsContainer.innerHTML = finalMessage;
                feedbackContainer.innerHTML = ''; 
                
                startQuizButton.classList.remove('hidden');
                startQuizButton.textContent = 'Jugar de Nuevo';
            }, 2000); // 2 segundos

        } else if (data.siguientePregunta) {
            // Si hay otra pregunta, la mostramos después de 2 segundos
            setTimeout(() => {
                mostrarPregunta(data.siguientePregunta);
                actualizarEstadisticas(data.score, data.questionCount, data.totalQuestions);
            }, 2000); // 2 segundos
        }

    } catch (error) {
        console.error('Error al enviar respuesta:', error);
        feedbackContainer.textContent = 'Error al enviar tu respuesta.';
    }
}

// ===================================
// --- ¡¡NUEVA FUNCIÓN: LEADERBOARD!! ---
// ===================================
async function cargarLeaderboard() {
    try {
        // 
        const response = await fetch('/api/leaderboard'); // Llama a la nueva ruta
        const users = await response.json();

        if (users.length === 0) {
            leaderboardContainer.innerHTML = '<p>Aún no hay puntajes. ¡Sé el primero!</p>';
            return;
        }

        // Usamos una lista ordenada (ol) para el ranking
        let leaderboardHtml = '<ol class="list-decimal list-inside space-y-2">';

        users.forEach((user, index) => {
            leaderboardHtml += `
                <li class="text-lg flex justify-between items-center p-2 rounded ${index === 0 ? 'bg-yellow-600 bg-opacity-30' : ''} ${index === 1 ? 'bg-gray-500 bg-opacity-30' : ''} ${index === 2 ? 'bg-yellow-800 bg-opacity-30' : ''}">
                    <span>
                        <span class="font-bold w-6 inline-block">${index + 1}.</span>
                        ${user.username}
                    </span>
                    <span class="font-bold text-cyan-400">${user.highScore} pts</span>
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