const crypto = require("crypto");
const users = require("../models/users.json");
const {
  createSession,
  deleteSession,
} = require("../middleware/auth.middleware");

// Función controladora para manejar el login
exports.login = (req, res) => {
  // Extrae 'account' del body de la petición (protección contra body undefined)
  const { account } = req.body || {};
  // Acepta 'password' o 'contraseña' (con/sin ñ) usando optional chaining
  const password = req.body?.password ?? req.body?.["contraseña"];

  // Valida que vengan ambos campos requeridos
  if (!account || !password) {
    // Responde 400 Bad Request si faltan datos
    return res.status(400).json({
      error: "Faltan campos obligatorios: 'account' y 'password'.",
      ejemplo: { account: "gina", password: "1234" },
    });
  }

  // Busca un usuario que coincida exactamente con account Y contraseña
  const match = users.find(
    (u) => u.account === account && u.password === password
  );

  // Si no encuentra coincidencia, credenciales incorrectas
  if (!match) {
    // Responde 401 Unauthorized
    return res.status(401).json({ error: "Credenciales inválidas." });
  }

  // Login exitoso: generar token de sesión
  const token = createSession(match.account); // Usamos 'account' como userId

  console.log(
    `[LOGIN] Usuario: ${match.account} | Token: ${token} | Procede el login`
  );

  return res.status(200).json({
    mensaje: "Acceso permitido",
    usuario: {
      account: match.account,
      name: match.name,
      paid: !!match.paid,
      hasTakenExam: !!match.hasTakenExam,
    }, // Devuelve información básica sin contraseña
    token: token, // Token de sesión para usar en peticiones protegidas
  });
};

// Función controladora para manejar el logout
exports.logout = (req, res) => {
  const token = req.token; // El token viene del middleware verifyToken
  const userId = req.userId; // El userId viene del middleware verifyToken

  console.log(
    `[LOGOUT] Usuario en sesión: ${userId} | Token: ${token} | Procede el logout`
  );

  // Eliminar la sesión
  const deleted = deleteSession(token);

  if (deleted) {
    return res.status(200).json({
      mensaje: "Sesión cerrada correctamente",
    });
  } else {
    return res.status(404).json({
      error: "Sesión no encontrada",
    });
  }
};

// Función controladora para obtener el perfil del usuario autenticado
exports.getProfile = (req, res) => {
  const userId = req.userId; // El userId viene del middleware verifyToken

  // Buscar el usuario en la base de datos
  const user = users.find((u) => u.account === userId);

  if (!user) {
    return res.status(404).json({
      error: "Usuario no encontrado",
    });
  }

  // Devolver información del usuario (sin contraseña)
  return res.status(200).json({
    usuario: {
      account: user.account,
      name: user.name,
      paid: !!user.paid,
      hasTakenExam: !!user.hasTakenExam,
    },
  });
};
