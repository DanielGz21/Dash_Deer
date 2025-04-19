const express = require('express');
const http = require('http');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const authRoutes  = require('./routes/authRoutes');
const vueloRoutes = require('./routes/vueloRoutes');
const userRoutes  = require('./routes/userRoutes');

const app    = express();
const server = http.createServer(app);
const io     = require('socket.io')(server, {
  cors: { origin: '*', methods: ['GET','POST','PUT','DELETE'] }
});

// Middleware para exponer "io" en cada request
app.use((req, _, next) => {
  req.io = io;
  next();
});

app.use(cors());
app.use(bodyParser.json());

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/vuelos', vueloRoutes);
app.use('/api/usuarios', userRoutes);

// Servir frontend (SPA)
app.use(express.static(path.join(__dirname, '../frontend')));
app.get('*', (_, res) =>
  res.sendFile(path.join(__dirname, '../frontend/index.html'))
);

// Arrancar servidor
const PORT = process.env.PORT || 3005;
server.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  io.on('connection', socket =>
    console.log('🔌 Cliente conectado:', socket.id)
  );
});
