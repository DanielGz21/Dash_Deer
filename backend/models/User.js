// backend/models/User.js
const db = require('../db');

const User = {
  async crear({ nombre, clave, rol }) {
    const res = await db.query(
      'INSERT INTO usuarios (nombre, clave, rol) VALUES ($1, $2, $3) RETURNING *',
      [nombre, clave, rol]
    );
    return res.rows[0];
  },

  async buscarPorNombre(nombre) {
    const res = await db.query('SELECT * FROM usuarios WHERE nombre = $1', [nombre]);
    return res.rows[0];
  }
};

module.exports = User;
