// backend/routes/userRoutes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const verificarToken = require('../auth');

const router = express.Router();

// GET: Todos los usuarios (solo admin)
router.get('/', verificarToken, async (req, res) => {
  if (req.user.rol !== 'administrador') {
    return res.status(403).json({ mensaje: 'Acceso restringido' });
  }
  const resDB = await db.query('SELECT id, nombre, rol FROM usuarios ORDER BY id ASC');
  res.json(resDB.rows);
});

// POST: Crear nuevo usuario (admin)
router.post('/', verificarToken, async (req, res) => {
  if (req.user.rol !== 'administrador') {
    return res.status(403).json({ mensaje: 'Acceso restringido' });
  }
  const { nombre, clave, rol } = req.body;
  const hash = await bcrypt.hash(clave, 10);
  const nuevo = await db.query('INSERT INTO usuarios (nombre, clave, rol) VALUES ($1, $2, $3) RETURNING id, nombre, rol', [nombre, hash, rol]);
  res.json(nuevo.rows[0]);
});

// PUT: Cambiar contraseña (usuario o admin)
router.put('/cambiar-clave/:id', verificarToken, async (req, res) => {
  const { clave } = req.body;
  const hash = await bcrypt.hash(clave, 10);
  const result = await db.query('UPDATE usuarios SET clave = $1 WHERE id = $2 RETURNING id, nombre', [hash, req.params.id]);
  res.json(result.rows[0]);
});

module.exports = router;
