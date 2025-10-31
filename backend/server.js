const express = require("express");
const cors = require('cors');
const authRoutes = require("./routes/auth.routes");


const app = express();
const PORT = 3000;

//Middleware
app.use(cors());
app.use(express.json());

// Ruta base
app.get('/', (req, res) => {
  res.send('Servidor funcionando correctamente 🚀');
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
