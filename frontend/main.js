// =======================
// CONFIGURACIÓN GENERAL
// =======================
const API_URL = "http://localhost:3000/api";

// =======================
// VENTANA "NOSOTROS"
// =======================
const modal = document.getElementById("modalNosotros");
const btnNosotros = document.getElementById("btnNosotros");
const cerrarModal = document.getElementById("cerrarModal");

if (btnNosotros && modal) {
  btnNosotros.addEventListener("click", () => {
    modal.style.display = "flex";
  });
}
if (cerrarModal && modal) {
  cerrarModal.addEventListener("click", () => {
    modal.style.display = "none";
  });
}

// Cierra el modal si se da clic fuera del recuadro
window.addEventListener("click", (e) => {
  if (modal && e.target === modal) modal.style.display = "none";
});

// =======================
// MODAL LOGIN
// =======================
const modalLogin = document.getElementById("modalLogin");
const btnLogin = document.querySelector(".btn-login");
const cerrarLogin = document.getElementById("cerrarLogin");
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");

let isLoggedIn = false;

// --- Inicializar estado de sesión desde localStorage (si existe)
try {
  const _token = localStorage.getItem("token");
  const _user = localStorage.getItem("user");
  if (_token && _user) {
    isLoggedIn = true;
    if (btnLogin) btnLogin.textContent = "Cerrar Sesión";
  }
} catch (e) {
  console.error("Error leyendo localStorage:", e);
}

// Abrir modal de login
if (btnLogin && modalLogin) {
  btnLogin.addEventListener("click", (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      modalLogin.style.display = "flex";
    } else {
      // Cerrar sesión
      isLoggedIn = false;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      btnLogin.textContent = "Iniciar Sesión";
      Swal.fire("Sesión cerrada", "Has cerrado sesión correctamente.", "info");
    }
  });
}

// Cerrar modal de login (botón)
if (cerrarLogin && modalLogin) {
  cerrarLogin.addEventListener("click", () => {
    modalLogin.style.display = "none";
    loginForm.reset();
    loginError.style.display = "none";
  });
}

// Cierra modales al hacer clic fuera
window.addEventListener("click", (e) => {
  if (modalLogin && e.target === modalLogin) {
    modalLogin.style.display = "none";
    loginForm.reset();
    loginError.style.display = "none";
  }
});

// =======================
// BOTÓN "VER CERTIFICACIONES"
// =======================
const ctaBtn = document.querySelector(".cta-btn");
if (ctaBtn) {
  ctaBtn.addEventListener("click", () => {
    const certMenu = document.getElementById("certificacionesMenu");
    if (certMenu) {
      certMenu.style.display = "block";
      certMenu.scrollIntoView({ behavior: "smooth" });
    }
  });
}

// =======================
// SWEETALERT2 POLYFILLS
// =======================
if (typeof Swal !== "undefined") {
  window.alert = (msg) => Swal.fire({ icon: "info", text: String(msg) });
  window.confirmSwal = (msg) =>
    Swal.fire({
      title: String(msg),
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí",
      cancelButtonText: "No",
    }).then((r) => !!r.isConfirmed);
  window.promptSwal = (msg, def = "") =>
    Swal.fire({
      title: String(msg),
      input: "text",
      inputValue: def,
      showCancelButton: true,
    }).then((r) => (r.isConfirmed ? r.value : null));
}

// =======================
// LOGIN (FETCH AL BACKEND)
// =======================
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const account = document.getElementById("account").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!account || !password) {
      Swal.fire("Error", "Usuario y contraseña son requeridos.", "error");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account, password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.usuario));
        isLoggedIn = true;
        btnLogin.textContent = "Cerrar Sesión";

        Swal.fire(
          "Bienvenido",
          `Hola ${data.usuario.name || account}`,
          "success"
        );

  // Mantener en la misma página pero con la sesión iniciada.
  modalLogin.style.display = "none";
  // Actualizar texto del botón (ya lo actualizamos arriba, pero aseguramos aquí)
  if (btnLogin) btnLogin.textContent = "Cerrar Sesión";
  // Opcional: mostrar un toast o indicar en UI que la sesión está activa
  // (no hacemos redirect para que el usuario permanezca en la misma página)
      } else {
        Swal.fire("Error", data.error || "Credenciales incorrectas", "error");
      }
    } catch (err) {
      Swal.fire("Error", "No se pudo conectar con el servidor.", "error");
      console.error(err);
    }
  });
}

// =======================
// CERTIFICACIÓN (BOTÓN EXAMEN)
// =======================
const certBtn = document.querySelector(".cert-btn.active");
if (certBtn) {
  certBtn.addEventListener("click", (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));

    if (!token || !user) {
      modalLogin.style.display = "flex";
      return;
    }

    if (user.hasTakenExam) {
      Swal.fire(
        "Aviso",
        "Ya has realizado el examen. Solo se puede hacer una vez.",
        "warning"
      );
      return;
    }

    window.location.href = "exam.html";
    user.hasTakenExam = true;
    localStorage.setItem("user", JSON.stringify(user));
  });
}

// =======================
// BOTÓN CONTACTO (SCROLL SUAVE)
// =======================
const btnContacto = document.getElementById("btnContacto");
if (btnContacto) {
  btnContacto.addEventListener("click", () => {
    const contacto = document.getElementById("contacto");
    if (contacto) contacto.scrollIntoView({ behavior: "smooth" });
  });
}

// =======================
// FORMULARIO DE CONTACTO
// =======================
const contactForm = document.getElementById("contactForm");
if (contactForm) {
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("contactName").value.trim();
    const email = document.getElementById("contactEmail").value.trim();
    const subject = document.getElementById("contactSubject").value.trim();
    const message = document.getElementById("contactMessage").value.trim();

    if (!name || !email || !subject || !message) {
      Swal.fire("Error", "Por favor completa todos los campos.", "error");
      return;
    }

    try {
      // Envía los datos al backend
      const res = await fetch(`${API_URL}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });

      const data = await res.json();

      if (res.ok) {
        Swal.fire(
          "Enviado",
          data.message || "Mensaje enviado correctamente.",
          "success"
        );
        contactForm.reset();
      } else {
        Swal.fire(
          "Error",
          data.error || "Error al enviar el mensaje.",
          "error"
        );
      }
    } catch (err) {
      Swal.fire("Error", "No se pudo conectar con el servidor.", "error");
      console.error(err);
    }
  });
}
