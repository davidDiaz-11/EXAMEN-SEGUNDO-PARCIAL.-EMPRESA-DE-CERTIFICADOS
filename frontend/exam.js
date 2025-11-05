// =======================
// CONFIGURACIÓN PRINCIPAL
// =======================
const API_URL = "http://localhost:3000/api";

// Elementos del DOM
const examContent = document.getElementById("examContent");
const errorMessage = document.getElementById("errorMessage");
const userNameSpan = document.getElementById("userName");
const logoutBtn = document.getElementById("logoutBtn");
const countdownSpan = document.getElementById("countdown");
const timerContainer = document.getElementById("timer");

// =======================
// FUNCIÓN DE AUTENTICACIÓN
// =======================
function checkAuth() {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");

  if (!token || !user) {
    window.location.href = "index.html";
    return null;
  }

  return { token, user: JSON.parse(user) };
}

// =======================
// FUNCIÓN PARA MOSTRAR ERRORES
// =======================
function showError(message) {
  errorMessage.textContent = message;
  errorMessage.style.display = "block";
}

// =======================
// MOSTRAR PANTALLA INICIAL DE ESPERA
// =======================
function showReadyScreen() {
  const auth = checkAuth();
  if (!auth) return;

  const user = auth.user;
  userNameSpan.textContent = user.name || user.account;

  // Si el usuario no tiene la propiedad 'paid', la consideramos false
  const hasPaid = !!user.paid;

  examContent.innerHTML = `
    <div class="ready-screen" style="text-align: center; padding: 50px;">
      <h2>Hola, ${user.name || user.account} 👋</h2>
      <p>Cuando estés listo, presiona el botón para comenzar tu examen.</p>
      <div style="margin-top:20px; display:flex; gap:12px; justify-content:center;">
        ${
          hasPaid
            ? ""
            : '<button id="btnPay" class="pay-btn" style="width:auto;">Pagar Examen</button>'
        }
        <button id="btnReady" class="submit-btn" style="width:auto;" ${
          hasPaid ? "" : "disabled"
        }>
          Estoy listo para comenzar
        </button>
      </div>
    </div>
  `;

  const btnReady = document.getElementById("btnReady");
  const btnPay = document.getElementById("btnPay");

  // Manejo del botón de pago (solo si existe)
  if (btnPay) {
    btnPay.addEventListener("click", async () => {
      // Llamada al backend para procesar pago
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/exam/pay`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (res.ok) {
          // Actualizar user en localStorage
          const stored = JSON.parse(localStorage.getItem("user") || "{}");
          stored.paid = true;
          localStorage.setItem("user", JSON.stringify(stored));

          Swal.fire(
            "Pago exitoso",
            data.message || "Pago registrado.",
            "success"
          );

          // Quitar botón de pago y habilitar inicio
          btnPay.remove();
          if (btnReady) btnReady.disabled = false;
        } else {
          Swal.fire(
            "Error",
            data.message || "No se pudo procesar el pago.",
            "error"
          );
        }
      } catch (err) {
        console.error(err);
        Swal.fire("Error", "No se pudo conectar con el servidor.", "error");
      }
    });
  }

  // Manejo del botón de inicio: solo permite iniciar si pagó
  if (btnReady) {
    btnReady.addEventListener("click", async () => {
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      if (!stored.paid) {
        await Swal.fire({
          icon: "warning",
          title: "Pago requerido",
          text: "Debes pagar el examen antes de poder comenzarlo.",
        });
        return;
      }

      const confirmed = await Swal.fire({
        icon: "question",
        title: "¿Estás seguro?",
        text: "Una vez que inicies, el examen comenzará y se activará el temporizador.",
        showCancelButton: true,
        confirmButtonText: "Sí, comenzar",
        cancelButtonText: "Cancelar",
      });

      if (confirmed.isConfirmed) {
        loadExam(); // ← aquí recién se carga el examen real
      }
    });
  }
}

// =======================
// CARGAR EXAMEN DESDE EL BACKEND
// =======================
async function loadExam() {
  const auth = checkAuth();
  if (!auth) return;

  userNameSpan.textContent = auth.user.name || auth.user.account;

  try {
    const res = await fetch(`${API_URL}/exam/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${auth.token}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      showError(data.message || "Error al cargar el examen");
      return;
    }

    renderExam(data.exam);
  } catch (err) {
    showError("Error de conexión con el servidor");
    console.error(err);
  }
}

// =======================
// RENDERIZAR EXAMEN EN HTML
// =======================
function renderExam(questions) {
  window._currentExamQuestions = questions;
  startCountdown(1200, questions);

  let html = '<form id="examForm">';

  questions.forEach((question, index) => {
    html += `
      <div class="question-container">
        <div class="question-number">Pregunta ${index + 1} de ${
      questions.length
    }</div>
        <div class="question-text">${question.question}</div>
        <div class="options">
    `;

    question.options.forEach((option, optIndex) => {
      const optionId = `q${question.id}_opt${optIndex}`;
      html += `
        <div class="option">
          <input type="radio" id="${optionId}" name="question_${question.id}" value="${option}" required>
          <label for="${optionId}">${option}</label>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;
  });

  html +=
    '<button type="submit" class="submit-btn">Enviar Examen</button></form>';
  examContent.innerHTML = html;

  const form = document.getElementById("examForm");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    stopCountdown();
    await submitExam(questions);
  });
}

// =======================
// ENVIAR EXAMEN
// =======================
async function submitExam(questions) {
  const auth = checkAuth();
  if (!auth) return;

  const answers = {};
  questions.forEach((question) => {
    const selected = document.querySelector(
      `input[name="question_${question.id}"]:checked`
    );
    if (selected) {
      answers[question.id] = selected.value;
    }
  });

  try {
    const res = await fetch(`${API_URL}/exam/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${auth.token}`,
      },
      body: JSON.stringify({ answers }),
    });

    const data = await res.json();

    if (res.ok) {
      // Esperar al usuario cierre el modal antes de proceder (evita que se cierre al instante)
      await Swal.fire({
        icon: data.score <= 5 ? "error" : "success",
        title: "Examen enviado",
        text: `Puntuación: ${data.score}/${data.total}${
          data.score <= 5 ? " - REPROBADO" : ""
        }`,
        confirmButtonText: "Aceptar",
      });

      if (data.certificate) {
        window.open(`http://localhost:3000${data.certificate}`, "_blank");
      }

      // Redirigir después de que el usuario cierre el modal
      window.location.href = "index.html";
    } else {
      showError(data.message || "Error al enviar el examen");
    }
  } catch (err) {
    showError("Error de conexión al enviar el examen");
    console.error(err);
  }
}

// =======================
// TEMPORIZADOR
// =======================
let _examTimerInterval = null;
let _remainingSeconds = 0;

function startCountdown(seconds = 10, questions = null) {
  stopCountdown();

  _remainingSeconds = seconds;
  if (countdownSpan) countdownSpan.textContent = String(_remainingSeconds);
  if (timerContainer) timerContainer.style.display = "flex";

  _examTimerInterval = setInterval(async () => {
    _remainingSeconds -= 1;
    if (countdownSpan) countdownSpan.textContent = String(_remainingSeconds);

    if (_remainingSeconds <= 0) {
      stopCountdown();
      await Swal.fire({
        icon: "info",
        title: "Tiempo terminado",
        text: "El examen se enviará automáticamente.",
      });
      const qs = questions || window._currentExamQuestions || [];
      await submitExam(qs);
    }
  }, 1000);
}

function stopCountdown() {
  if (_examTimerInterval) clearInterval(_examTimerInterval);
  _examTimerInterval = null;
  if (timerContainer) timerContainer.style.display = "none";
}

// =======================
// LOGOUT
// =======================
logoutBtn.addEventListener("click", async () => {
  const auth = checkAuth();
  if (!auth) return;

  try {
    await fetch(`${API_URL}/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    console.log(
      `[LOGOUT] Usuario: ${
        auth.user.name || auth.user.account
      } ha cerrado sesión`
    );
  } catch (err) {
    console.error(err);
  }

  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "index.html";
});

// =======================
// ALERTAS CON SWEETALERT
// =======================
if (typeof Swal !== "undefined" && !window._examSwalPolyfilled) {
  window._examSwalPolyfilled = true;
  window.alert = (msg) => Swal.fire({ icon: "info", text: String(msg) });
  window.confirm = (msg) =>
    Swal.fire({
      title: String(msg),
      showCancelButton: true,
      confirmButtonText: "Sí",
      cancelButtonText: "No",
    }).then((r) => !!r.isConfirmed);
}

// =======================
// INICIO CONTROLADO
// =======================
showReadyScreen(); // 👈 En lugar de loadExam()
