const express = require("express");
const cors = require('cors');
const examRoutes = require("./routes/exam.routes");
const authRoutes = require("./routes/auth.routes");
const path = require("path");


const app = express();
const PORT = 3000;

const ALLOWED_ORIGINS = ["http://localhost:5500", "http://127.0.0.1:5500", "http://localhost:3000", "http://10.13.140.92:5500", "http://10.13.125.180:5500"];
app.use(cors({
  origin:"*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  optionsSuccessStatus: 200
}));
app.use("/download", express.static(path.join(__dirname, "data/certificates")));


//Middleware
app.use(express.json());
app.use(cors());

app.use("/api", authRoutes);

//Middleware temporal (solo para pruebas)
// app.use((req, res, next) => {
//   req.userId = 1;
//   next();
// });

// Ruta base
app.get('/', (req, res) => {
  res.send('Servidor funcionando correctamente 🚀');
});

app.use("/api/exam", examRoutes);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

