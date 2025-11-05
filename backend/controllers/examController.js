// Importa el array de usuarios y preguntas desde el archivo JSON (se carga una sola vez al iniciar)
const users = require("../models/users.json");
const questions = require("../models/questions.json");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const usersFile = path.join(__dirname, "../models/users.json");

// Mezclar de forma aleatoria (Fisher–Yates)
function shuffleArray(array) {
  const arr = [...array]; // crear copia para no modificar el original
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function startExam(req, res) {
  const user = users.find((u) => u.account === req.userId);
  if (!user) return res.status(401).json({ message: "Usuario no encontrado" });
  if (!user.paid)
    return res
      .status(403)
      .json({ message: "Debe pagar antes de iniciar el examen" });
  if (user.hasTakenExam)
    return res
      .status(403)
      .json({ message: "El examen solo puede hacerse una vez" });

  const shuffled = shuffleArray(questions);
  const examQuestions = shuffled.slice(0, 8).map((q) => ({
    id: q.id,
    question: q.question,
    options: shuffleArray(q.options),
  }));

  user.examQuestions = examQuestions;

  res.json({ exam: examQuestions });
}

function submitExam(req, res) {
  const userId = req.userId;
  const { answers } = req.body;

  const user = users.find((u) => u.account === userId);
  if (!user) return res.status(401).json({ message: "Usuario no encontrado" });

  if (!user.examQuestions)
    return res.status(400).json({ message: "No hay examen iniciado" });

  let score = 0;
  user.examQuestions.forEach((question) => {
    const correctAnswer = questions.find((q) => q.id === question.id)?.correct;
    if (answers[question.id] === correctAnswer) score++;
  });

  user.hasTakenExam = true;

  // Guardar estado actualizado en users.json
  try {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2), "utf-8");
  } catch (err) {
    console.error("Error al guardar users.json:", err);
  }

  let pdfPath = null;
  // Generar el certificado (si aplica). Aquí se asume que se genera siempre —
  // si necesita condición de aprobacion, ajuste 'score' según criterio.
  try {
    if (score >= 6) {
      pdfPath = generateCertificate(user, "Certificación C++", score);
      console.log(`[CERTIFICADO] Generado para ${user.name}`);
    } else {
      console.log(
        `[NO APROBADO] ${user.name} obtuvo ${score}/8 — sin certificado`
      );
    }
  } catch (err) {
    console.error("Error generando certificado:", err);
    pdfPath = null;
  }

  console.log(
    `[EXAM SUBMIT] Usuario: ${userId} | Puntuación: ${score}/${user.examQuestions.length}`
  );

  res.json({
    message: "Examen enviado correctamente",
    score: score,
    total: user.examQuestions.length,
    percentage: Math.round((score / user.examQuestions.length) * 100),
    passed: score >= 6,
    certificate: pdfPath ? `/download/${path.basename(pdfPath)}` : null,
  });
}

function payExam(req, res) {
  const userId = req.userId;
  const user = users.find((u) => u.account === userId);
  if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

  if (user.paid)
    return res
      .status(200)
      .json({ message: "Usuario ya tiene pago registrado" });

  user.paid = true;

  try {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2), "utf-8");
    console.log(`[PAY] Usuario ${userId} marcado como pagado`);
    return res.status(200).json({ message: "Pago registrado correctamente" });
  } catch (err) {
    console.error("Error al escribir users.json:", err);
    return res.status(500).json({ message: "Error al procesar el pago" });
  }
}

function generateCertificate(user, certificationName, score) {
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const filePath = path.join(
    __dirname,
    `../data/certificates/${user.name}_certificate.pdf`
  );
  doc.pipe(fs.createWriteStream(filePath));

  const pageWidth = doc.page.width;

  // === LOGO CENTRADO ===
  const logoPath = path.join(__dirname, "../img/logo.png");
  if (fs.existsSync(logoPath)) {
    const logoWidth = 100;
    const xLogo = (pageWidth - logoWidth) / 2;
    doc.image(logoPath, xLogo, 50, { width: logoWidth });
  }

  doc
    .font("Times-Bold")
    .fontSize(32)
    .fillColor("#0A3871")
    .text("Certificado de Aprobación", { align: "center" });

  doc.moveDown(2);

  doc
    .moveTo(100, 150)
    .lineTo(pageWidth - 100, 150)
    .lineWidth(2)
    .stroke("#0A3871");

  doc.moveDown(2);

  doc
    .font("Times-Roman")
    .fontSize(20)
    .fillColor("black")
    .text(`Nombre: ${user.name}`, { align: "center" })
    .text(`CodeCertify`, { align: "center" })
    .moveDown(0.5)
    .text(`Certificación: ${certificationName}`, { align: "center" })
    .moveDown(0.5)
    .text(`Instructor: Ana López`, { align: "center" })
    .moveDown(0.5)
    .text(`Puntuación: ${score} de 8`, { align: "center" })
    .moveDown(0.5)
    .text(`Fecha: ${new Date().toLocaleDateString()}`, { align: "center" })
    .moveDown(0.5)
    .text(`Ciudad: Aguascalientes`, { align: "center" });

  // === FIRMAS ===
  const ceoSignature = path.join(__dirname, "../img/firma2.jpeg");
  const instructorSignature = path.join(__dirname, "../img/firma1.jpeg");

  const sigWidth = 150;
  const sigHeight = 70;
  const ySignature = 550;
  const marginSide = 100;
  const lineY = ySignature + sigHeight + 10;

  // Firma CEO (izquierda)
  if (fs.existsSync(ceoSignature)) {
    doc.image(ceoSignature, marginSide, ySignature, {
      width: sigWidth,
      height: sigHeight,
    });
  }

  doc
    .moveTo(marginSide, lineY)
    .lineTo(marginSide + sigWidth, lineY)
    .lineWidth(1)
    .stroke("#0A3871")
    .fontSize(14)
    .fillColor("black")
    .text("CEO - CodeCertify", marginSide, lineY + 5, {
      width: sigWidth,
      align: "center",
    });

  // Firma Instructor (derecha)
  if (fs.existsSync(instructorSignature)) {
    doc.image(
      instructorSignature,
      pageWidth - sigWidth - marginSide,
      ySignature,
      { width: sigWidth, height: sigHeight }
    );
  }

  doc
    .moveTo(pageWidth - sigWidth - marginSide, lineY)
    .lineTo(pageWidth - marginSide, lineY)
    .lineWidth(1)
    .stroke("#0A3871")
    .fontSize(14)
    .fillColor("black")
    .text(
      "Instructor: Ana López",
      pageWidth - sigWidth - marginSide,
      lineY + 5,
      {
        width: sigWidth,
        align: "center",
      }
    );

  doc.end();
  return filePath;
}

module.exports = { startExam, submitExam, generateCertificate, payExam };
