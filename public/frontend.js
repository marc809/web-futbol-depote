// --- Contenedores Principales (Secciones) ---
let authContainer, homeMenu, ligasContainer, standingsContainer, videosSection, quizSection, leaderboardSection;
// --- Elementos de Ligas ---
let ligasLista, standingsTable, standingsTitle, backButton, matchesList;
// --- Elementos de Quiz ---
let startQuizButton, quizContainer, questionText, optionsContainer, feedbackContainer, quizStatsContainer, currentQuestionId = null, loginWarningDiv;
// --- Elementos de Leaderboard y Videos ---
let leaderboardContainer, videosContainer;

// Array con todas las secciones principales para ocultarlas fácilmente
let todasLasSecciones = [];

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. Cachear todos los elementos del DOM ---
    authContainer = document.getElementById('auth-container');
    homeMenu = document.getElementById('home-menu');
    ligasContainer = document.getElementById('ligas-container');
    standingsContainer = document.getElementById('standings-container');
    videosSection = document.getElementById('videos-section');
    quizSection = document.getElementById('quiz-section');
    leaderboardSection = document.getElementById('leaderboard-section');
    
    // Guardamos todas las secciones en un array para la navegación
    todasLasSecciones = [homeMenu, ligasContainer, standingsContainer, videosSection, quizSection, leaderboardSection];

    // Elementos internos de las secciones
    ligasLista = document.getElementById('ligas-lista');
    standingsTable = document.getElementById('standings-table');
    standingsTitle = document.getElementById('standings-title');
    backButton = document.getElementById('back-button'); // Botón de "Volver a Ligas"
    matchesList = document.getElementById('matches-list');
    startQuizButton = document.getElementById('start-quiz-button');
    quizContainer = document.getElementById('quiz-container');
    questionText = document.getElementById('question-text');
    optionsContainer = document.getElementById('options-container');
    feedbackContainer = document.getElementById('feedback-container');
    quizStatsContainer = document.getElementById('quiz-stats-container'); 
    leaderboardContainer = document.getElementById('leaderboard-container');
    videosContainer = document.getElementById('videos-container');

    // --- 2. Crear Aviso de Login Dinámicamente ---
    loginWarningDiv = document.createElement('div');
    loginWarningDiv.className = 'hidden bg-yellow-600 bg-opacity-20 border-l-4 border-yellow-500 text-yellow-100 p-3 mb-4 rounded';
    loginWarningDiv.innerHTML = '<p class="font-bold">¡Atención!</p><p>Estás jugando como invitado. Tu puntaje <span class="font-bold">NO se guardará</span>. <a href="#" id="login-link-warning" class="underline hover:text-white">Inicia sesión</a> para acumular puntos.</p>';
    quizSection.insertBefore(loginWarningDiv, startQuizButton); // Lo ponemos en la sección de Quiz
    
    loginWarningDiv.querySelector('#login-link-warning').addEventListener('click', (e) => {
        e.preventDefault();
        // Hacemos scroll hasta arriba donde está el botón de Google
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // --- 3. Configurar Event Listeners de Navegación ---
    
    // Botones del Menú Principal
    document.getElementById('btn-nav-ligas').addEventListener('click', () => mostrarSeccion('ligas-container'));
    document.getElementById('btn-nav-quiz').addEventListener('click', () => mostrarSeccion('quiz-section'));
    document.getElementById('btn-nav-videos').addEventListener('click', () => mostrarSeccion('videos-section'));
    document.getElementById('btn-nav-leaderboard').addEventListener('click', () => mostrarSeccion('leaderboard-section'));

    // Botones para "Volver al Inicio"
    // Usamos querySelectorAll para tomar todos los botones con la clase .btn-back
    document.querySelectorAll('.btn-back').forEach(button => {
        button.addEventListener('click', () => mostrarSeccion('home-menu'));
    });

    // Botón especial "Volver a Ligas" (dentro de Standings)
    backButton.addEventListener('click', () => mostrarSeccion('ligas-container'));

    // Listeners de funcionalidad
    if (startQuizButton) startQuizButton.addEventListener('click', iniciarQuiz);

    // --- 4. Cargas Iniciales ---
    checkLoginStatus();
    cargarLigas();
    cargarLeaderboard();
    cargarVideos();
    
    // Al inicio, mostramos solo el menú
    mostrarSeccion('home-menu');
});

// ===================================
// --- [NUEVO] FUNCIÓN DE NAVEGACIÓN ---
// ===================================
function mostrarSeccion(idDeSeccion) {
    // 1. Ocultar todas las secciones
    todasLasSecciones.forEach(seccion => {
        if (seccion) seccion.classList.add('hidden');
    });

    // 2. Mostrar solo la sección deseada
    const seccionActiva = document.getElementById(idDeSeccion);
    if (seccionActiva) {
        seccionActiva.classList.remove('hidden');
    }
    
    // 3. Asegurarnos que el contenedor de auth (login/saludo) siempre esté visible
    if (authContainer) {
        authContainer.classList.remove('hidden');
    }
}

// ===================================
// --- LÓGICA DE LA APLICACIÓN ---
// (Funciones antiguas, ligeramente modificadas para la nueva navegación)
// ===================================

// --- Videos ---
async function cargarVideos() {
    try {
        const response = await fetch('/api/videos');
        const videos = await response.json(); 
        if (!videos || videos.length === 0) {
            videosContainer.innerHTML = '<p class="text-gray-400">No hay videos recientes disponibles.</p>';
            return;
        }
        videosContainer.innerHTML = '';
        const videosToShow = videos.slice(0, 8); // Mostramos 8 videos
        videosToShow.forEach(match => {
            const videoDiv = document.createElement('div');
            videoDiv.className = 'bg-gray-800 rounded-lg shadow-md overflow-hidden';
            const embedCode = match.videos && match.videos[0] ? match.videos[0].embed : '<p>Video no disponible</p>';
            videoDiv.innerHTML = `
                <div class="p-3 bg-gray-700">
                    <h3 class="font-semibold truncate" title="${match.title}">${match.title}</h3>
                    <p class="text-sm text-gray-400">${match.competition}</p>
                </div>
                <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden;">
                    ${embedCode.replace(/width='100%'|height='100%'|style='[^']+'/g, 'style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"')}
                </div>`;
            videosContainer.appendChild(videoDiv);
        });
    } catch (error) { console.error('Error al cargar videos:', error); videosContainer.innerHTML = '<p class="text-red-500">No se pudieron cargar los videos.</p>'; }
}

// --- Autenticación ---
async function checkLoginStatus() {
    try {
        const response = await fetch('/auth/me');
        const data = await response.json();
        if (data.user) {
            const username = data.user.username || data.user.email;
            const totalScore = data.user.totalScore || 0;
            authContainer.innerHTML = `
                <div class="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0">
                    <div class="text-center sm:text-left">
                        <p class="text-lg">¡Hola, <span class="font-bold text-cyan-400">${username}</span>!</p>
                        <p class="text-sm text-gray-400">Puntaje Total Acumulado: <span class="font-bold text-yellow-400">${totalScore}</span></p>
                    </div>
                    <button id="logout-button" class="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200">Cerrar Sesión</button>
                </div>`;
            document.getElementById('logout-button').addEventListener('click', async () => { await fetch('/auth/logout'); location.reload(); });
            loginWarningDiv.classList.add('hidden'); // Ocultar aviso si está logueado
        } else {
            authContainer.innerHTML = `<a href="/auth/google" class="inline-block bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200">Iniciar Sesión con Google</a>`;
            loginWarningDiv.classList.remove('hidden'); // Mostrar aviso si no está logueado
        }
    } catch (error) { console.error('Error login:', error); authContainer.innerHTML = '<p class="text-red-500">Error auth.</p>'; }
}

// --- Ligas ---
async function cargarLigas() {
    try {
        const response = await fetch('/api/ligas'); const data = await response.json(); ligasLista.innerHTML = '';
        data.competitions.forEach(liga => {
            if (liga.plan === 'TIER_ONE') {
                const link = document.createElement('a'); link.href = '#'; link.textContent = `${liga.name} (${liga.area.name})`; link.dataset.id = liga.id; link.dataset.name = liga.name;
                link.className = "flex items-center p-3 md:p-4 text-base md:text-lg bg-gray-800 rounded-lg shadow-md mb-3 hover:bg-gray-700 transition duration-200";
                if (liga.area.flag) { const img = document.createElement('img'); img.src = liga.area.flag; img.className = 'w-6 h-auto ml-auto rounded-sm'; link.appendChild(img); }
                link.addEventListener('click', (e) => { e.preventDefault(); mostrarTabla(e.currentTarget.dataset.id, e.currentTarget.dataset.name); });
                ligasLista.appendChild(link);
            }
        });
    } catch (error) { console.error('Error ligas:', error); ligasLista.textContent = 'Error al cargar ligas.'; }
}

// --- Tablas (Standings) ---
async function mostrarTabla(id, nombre) {
    // ¡CAMBIO! Usamos la nueva navegación
    mostrarSeccion('standings-container'); 
    
    standingsTitle.textContent = `Tabla de - ${nombre}`;
    standingsTable.innerHTML = '<p class="text-center text-lg">Cargando tabla...</p>';
    try {
        const response = await fetch(`/api/ligas/${id}/standings`); const data = await response.json(); cargarPartidos(id);
        let tableHtml = `<table class="min-w-full bg-gray-800 rounded-lg"><thead class="bg-gray-700"><tr><th class="p-2 text-xs sm:p-3 sm:text-sm font-semibold text-left">Pos</th><th class="p-2 text-xs sm:p-3 sm:text-sm font-semibold text-left" colspan="2">Equipo</th><th class="p-2 text-xs sm:p-3 sm:text-sm font-semibold text-center">Pts</th><th class="p-2 text-xs sm:p-3 sm:text-sm font-semibold text-center hidden md:table-cell">PJ</th><th class="p-2 text-xs sm:p-3 sm:text-sm font-semibold text-center hidden md:table-cell">DG</th></tr></thead><tbody class="divide-y divide-gray-700">`;
        data.standings[0].table.forEach(eq => { tableHtml += `<tr class="hover:bg-gray-700"><td class="p-2 text-xs sm:p-3 sm:text-sm">${eq.position}</td><td class="p-2 text-xs sm:p-3 sm:text-sm"><img src="${eq.team.crest}" class="w-6 h-6 inline-block mr-2"></td><td class="p-2 text-xs sm:p-3 sm:text-sm font-medium">${eq.team.name}</td><td class="p-2 text-xs sm:p-3 sm:text-sm text-center font-bold">${eq.points}</td><td class="p-2 text-xs sm:p-3 sm:text-sm text-center hidden md:table-cell">${eq.playedGames}</td><td class="p-2 text-xs sm:p-3 sm:text-sm text-center hidden md:table-cell">${eq.goalDifference}</td></tr>`; });
        standingsTable.innerHTML = tableHtml + '</tbody></table>';
    } catch (error) { console.error('Error tabla:', error); standingsTable.innerHTML = '<p class="text-red-500">Error tabla.</p>'; matchesList.innerHTML = ''; }
}

// --- Partidos (Matches) ---
async function cargarPartidos(id) {
    matchesList.innerHTML = '<p class="text-center text-lg">Cargando partidos...</p>';
    try {
        const response = await fetch(`/api/ligas/${id}/matches`); const data = await response.json();
        if (data.matches.length === 0) { matchesList.innerHTML = '<p class="text-gray-400">No hay partidos.</p>'; return; }
        matchesList.innerHTML = '';
        data.matches.forEach(m => {
            const fecha = new Date(m.utcDate).toLocaleString('es-ES', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
            const el = document.createElement('div'); el.className = 'p-4 bg-gray-800 rounded-lg shadow-md mb-3';
            el.innerHTML = `<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center"><span class="font-bold text-cyan-400">Jornada ${m.matchday}</span><span class="text-sm text-gray-400">${fecha}</span></div><div class="flex items-center justify-center text-base md:text-lg mt-4"><div class="w-full sm:w-2/5 text-center sm:text-right font-semibold truncate order-2 sm:order-1">${m.homeTeam.name}</div><img src="${m.homeTeam.crest}" class="w-6 h-6 mx-2 md:mx-4 order-2 sm:order-1"><span class="text-gray-400 text-sm order-2 sm:order-1">vs</span><img src="${m.awayTeam.crest}" class="w-6 h-6 mx-2 md:mx-4 order-2 sm:order-1"><div class="w-full sm:w-2/5 text-center sm:text-left font-semibold truncate order-2 sm:order-1">${m.awayTeam.name}</div></div>`;
            matchesList.appendChild(el);
        });
    } catch (error) { console.error('Error partidos:', error); matchesList.innerHTML = '<p class="text-red-500">Error partidos.</p>'; }
}

// --- Botón especial "Volver a Ligas" ---
function mostrarLigas() { 
    // ¡CAMBIO! Usamos la nueva navegación
    mostrarSeccion('ligas-container');
}

// --- Quiz ---
function actualizarEstadisticas(s, c, t) { quizStatsContainer.textContent = `Puntaje: ${s} | Pregunta: ${c} / ${t}`; }

async function iniciarQuiz() {
    startQuizButton.classList.add('hidden'); 
    loginWarningDiv.classList.add('hidden'); 
    quizContainer.classList.remove('hidden'); // Mostramos el contenedor del juego
    startQuizButton.textContent = '¡Empezar Quiz!';
    try { const res = await fetch('/api/quiz/start'); if (!res.ok) throw new Error(); const data = await res.json(); mostrarPregunta(data.pregunta); actualizarEstadisticas(data.score, data.questionCount, data.totalQuestions); }
    catch (e) { questionText.textContent = 'Error al cargar el quiz.'; }
}

function mostrarPregunta(p) {
    currentQuestionId = p.id; questionText.textContent = p.texto; optionsContainer.innerHTML = ''; feedbackContainer.innerHTML = '';
    p.opciones.forEach((op, i) => { const btn = document.createElement('button'); btn.textContent = op; btn.className = 'w-full bg-cyan-600 hover:bg-cyan-700 p-3 rounded-lg text-left transition duration-150'; btn.dataset.index = i; btn.addEventListener('click', enviarRespuesta); optionsContainer.appendChild(btn); });
}

async function enviarRespuesta(e) {
    const idx = e.target.dataset.index; const clicked = e.target;
    optionsContainer.querySelectorAll('button').forEach(b => { b.disabled = true; b.classList.remove('hover:bg-cyan-700'); b.classList.add('opacity-70'); });
    try {
        const res = await fetch('/api/quiz/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ questionId: currentQuestionId, answerIndex: idx }) });
        const data = await res.json();
        const correctBtn = optionsContainer.querySelector(`button[data-index="${data.correctAnswerIndex}"]`);
        if (data.message.startsWith('¡Correcto!')) { feedbackContainer.className = 'mt-4 text-lg font-semibold text-green-400'; clicked.className = 'w-full bg-green-500 text-white p-3 rounded-lg text-left transition duration-150'; }
        else { feedbackContainer.className = 'mt-4 text-lg font-semibold text-red-400'; clicked.className = 'w-full bg-red-500 text-white p-3 rounded-lg text-left transition duration-150'; if (correctBtn) correctBtn.className = 'w-full bg-green-500 text-white p-3 rounded-lg text-left transition duration-150'; }
        feedbackContainer.textContent = data.message;
        if (data.quizTerminado) {
            quizStatsContainer.innerHTML = '';
            setTimeout(() => {
                questionText.textContent = '¡Quiz Completado!';
                let msg = `<p class="text-xl md:text-2xl text-center">Puntaje: <span class="font-bold text-cyan-400">${data.finalScore} / ${data.totalQuestions}</span></p>`;
                if (data.userTotalScore > 0) msg += `<p class="text-lg md:text-xl text-center text-gray-300 mt-2">Total acumulado: <span class="font-bold text-yellow-400">${data.userTotalScore}</span></p>`;
                else msg += `<p class="text-sm text-center text-yellow-200 mt-4 bg-yellow-900 bg-opacity-50 p-2 rounded">Puntaje no guardado (invitado).</p>`;
                if (data.newHighScore) msg += `<p class="text-lg md:text-xl text-center text-yellow-400 mt-2">🎉 ¡Nuevo récord! 🎉</p>`;
                checkLoginStatus(); cargarLeaderboard(); optionsContainer.innerHTML = msg; feedbackContainer.innerHTML = ''; startQuizButton.classList.remove('hidden'); startQuizButton.textContent = 'Jugar de Nuevo'; 
                // Al terminar, volvemos a revisar el login para mostrar el aviso amarillo si es necesario
                checkLoginStatus(); 
            }, 2000);
        } else if (data.siguientePregunta) { setTimeout(() => { mostrarPregunta(data.siguientePregunta); actualizarEstadisticas(data.score, data.questionCount, data.totalQuestions); }, 2000); }
    } catch (e) { feedbackContainer.textContent = 'Error al enviar respuesta.'; }
}

// --- Leaderboard ---
async function cargarLeaderboard() {
    try {
        const res = await fetch('/api/leaderboard'); const users = await res.json();
        if (users.length === 0) { leaderboardContainer.innerHTML = '<p>Aún no hay puntajes.</p>'; return; }
        let html = '<ol class="list-decimal list-inside space-y-2">';
        users.forEach((u, i) => {
            let style = i === 0 ? 'bg-yellow-600 bg-opacity-30' : i === 1 ? 'bg-gray-400 bg-opacity-30' : i === 2 ? 'bg-yellow-800 bg-opacity-30' : '';
            html += `<li class="text-base sm:text-lg flex justify-between items-center p-2 rounded ${style}"><span class="truncate mr-2"><span class="font-bold w-6 inline-block">${i + 1}.</span>${u.username}</span><span class="font-bold text-cyan-400 whitespace-nowrap">${u.totalScore} pts</span></li>`;
        });
        leaderboardContainer.innerHTML = html + '</ol>';
    } catch (e) { leaderboardContainer.innerHTML = '<p class="text-red-500">Error leaderboard.</p>'; }
}