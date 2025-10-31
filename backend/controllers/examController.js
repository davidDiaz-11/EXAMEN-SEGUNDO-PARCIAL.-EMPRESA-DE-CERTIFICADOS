import { users } from "../models/users.json" assert {type: "json"};
import questions from "../models/questions.json" assert {type: "json"}; // Indica a Node que lea el archivo como JSON estructurado, no como un módulo de JavaScript.

export const startExam = (req, res) => {
  const user = users.find(u => u.id === req.userId);
    // Verificaciones
  if (!user.paid)
    return res.status(403).json({ message: "Debe pagar antes de iniciar el examen" });
  if (user.hasTakenExam)
    return res.status(403).json({ message: "El examen solo puede hacerse una vez" });

  // Mezclar preguntas y tomar 8
  const shuffled = [...questions].sort(() => 0.5 - Math.random());
  const examQuestions = shuffled.slice(0, 8).map(q => ({
    id: q.id,
    question: q.pregunta,
    options: q.opciones.sort(() => 0.5 - Math.random())
  }));
    // Guardar las preguntas en el usuario para después evaluarlas
  user.examQuestions = examQuestions;

  res.json({ exam: examQuestions });
};