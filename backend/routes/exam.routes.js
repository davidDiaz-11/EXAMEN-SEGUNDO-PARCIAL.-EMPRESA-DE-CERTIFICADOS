const express = require("express");
const {
  startExam,
  submitExam,
  payExam,
  generateCertificate,
} = require("../controllers/examController");
const { verifyToken } = require("../middleware/auth.middleware");
const router = express.Router();

router.post("/start", verifyToken, startExam); // Ruta para iniciar el examen (requiere autenticación)
router.post("/submit", verifyToken, submitExam); // Ruta para enviar respuestas del examen (requiere autenticación)
router.post("/pay", verifyToken, payExam); // Ruta para procesar pago (marca paid=true)

module.exports = router;
