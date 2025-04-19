// backend/controllers/vueloController.js
// Servicios de acceso a datos para vuelos (retornan datos, no manejan la respuesta HTTP)
const pool = require('../db');

/**
 * Devuelve todas las filas de la tabla 'vuelos'
 * @returns {Promise<Array>} Lista de vuelos
 */
exports.obtenerVuelos = async () => {
  const result = await pool.query(
    "SELECT * FROM vuelos ORDER BY vuelo ASC"
  );
  return result.rows;
};

/**
 * Inserta un nuevo vuelo y retorna la fila creada
 * @param {Object} data  Datos del vuelo
 * @returns {Promise<Object>} Vuelo creado
 */
exports.crearVuelo = async (data) => {
  const {
    vuelo, lotes, porcentaje, total_has,
    usuario, tipo_proceso, checkprocess,
    procesados, finalizado, und,
    pendientes, pendiente, estado
  } = data;

  const result = await pool.query(
    `INSERT INTO vuelos
      (vuelo, lotes, porcentaje, total_has,
       usuario, tipo_proceso, checkprocess,
       procesados, finalizado, und,
       pendientes, pendiente, estado)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     RETURNING *`,
    [
      vuelo, lotes, porcentaje, total_has,
      usuario, tipo_proceso, checkprocess,
      procesados, finalizado, und,
      pendientes, pendiente, estado
    ]
  );
  return result.rows[0];
};

/**
 * Actualiza un vuelo por su ID y retorna la fila actualizada
 * @param {number} id     ID del vuelo
 * @param {Object} data   Campos a actualizar
 * @returns {Promise<Object>} Vuelo actualizado
 */
exports.actualizarVuelo = async (id, data) => {
  const keys   = Object.keys(data);
  const values = Object.values(data);
  const set    = keys.map((k,i) => `${k} = $${i+1}`).join(', ');

  const query = `UPDATE vuelos SET ${set} WHERE id = $${keys.length + 1} RETURNING *`;
  const result = await pool.query(query, [...values, id]);
  return result.rows[0];
};

/**
 * Elimina un vuelo por su ID
 * @param {number} id  ID del vuelo
 * @returns {Promise<void>}
 */
exports.eliminarVuelo = async (id) => {
  await pool.query(
    "DELETE FROM vuelos WHERE id = $1", [id]
  );
};

