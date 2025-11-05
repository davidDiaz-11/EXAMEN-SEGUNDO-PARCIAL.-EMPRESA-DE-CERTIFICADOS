const { generateCertificate } = require("./controllers/examController");

const user = { name: "Juan Perez" };
const score = 7;
const pdfPath = generateCertificate(user, "Certificación de Node.js", score);

console.log("PDF generado en:", pdfPath);
