// backend/models/Vuelo.js
const db = require('../db');

const Vuelo = {
  async obtenerTodos() {
    const res = await db.query('SELECT * FROM vuelos ORDER BY id ASC');
    return res.rows;
  },

  async crear(data) {
    const { vuelo, lotes, porcentaje, total_has, user, tipo_proceso, checkprocess, procesados, finalizado, und, pendientes, pendiente, estado } = data;
    const res = await db.query(
      `INSERT INTO vuelos
        (vuelo, lotes, porcentaje, total_has, usuario, tipo_proceso, checkprocess, procesados, finalizado, und, pendientes, pendiente, estado)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [vuelo, lotes, porcentaje, total_has, user, tipo_proceso, checkprocess, procesados, finalizado, und, pendientes, pendiente, estado]
    );
    return res.rows[0];
  },

  async eliminar(id) {
    const res = await db.query('DELETE FROM vuelos WHERE id = $1 RETURNING *', [id]);
    return res.rows[0];
  },

  async actualizar(id, data) {
    const campos = Object.keys(data);
    const valores = Object.values(data);
    const sets = campos.map((campo, i) => `${campo} = $${i + 1}`).join(', ');
    const res = await db.query(`UPDATE vuelos SET ${sets} WHERE id = $${campos.length + 1} RETURNING *`, [...valores, id]);
    return res.rows[0];
  }
};

module.exports = Vuelo;
