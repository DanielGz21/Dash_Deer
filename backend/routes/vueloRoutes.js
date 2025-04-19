// backend/routes/vueloRoutes.js

const express = require('express');
const router = express.Router();
const vueloController = require('../controllers/vueloController');
const verificarToken  = require('../middlewares/verificarToken');

/**
 * Nota: para este enfoque, asumimos que los métodos de
 * vueloController retornan Promesas que resuelven en datos:
 *   - obtenerVuelos(): Array de vuelos
 *   - crearVuelo(data): vuelo creado
 *   - actualizarVuelo(id, data): vuelo actualizado
 *   - eliminarVuelo(id): void
 *
 * Si tus controladores envían directamente la respuesta (res.json),
 * tendrás que extraer la lógica de acceso a datos a funciones de servicio
 * que devuelvan valores, y usarlas aquí.
 */

// GET: todos los vuelos
router.get('/', verificarToken, async (req, res, next) => {
  try {
    const vuelos = await vueloController.obtenerVuelos();
    res.json(vuelos);
  } catch (err) {
    next(err);
  }
});

// POST: crear vuelo + emitir evento
router.post('/', verificarToken, async (req, res, next) => {
  try {
    const nuevo = await vueloController.crearVuelo(req.body);
    // Recargamos lista y notificamos a todos los clientes
    const todos = await vueloController.obtenerVuelos();
    req.io.emit('vuelo_updated', todos);
    res.status(201).json(nuevo);
  } catch (err) {
    next(err);
  }
});

// PUT: actualizar vuelo + emitir evento
router.put('/:id', verificarToken, async (req, res, next) => {
  try {
    const actualizado = await vueloController.actualizarVuelo(req.params.id, req.body);
    const todos       = await vueloController.obtenerVuelos();
    req.io.emit('vuelo_updated', todos);
    res.json(actualizado);
  } catch (err) {
    next(err);
  }
});

// DELETE: eliminar vuelo + emitir evento
router.delete('/:id', verificarToken, async (req, res, next) => {
  try {
    await vueloController.eliminarVuelo(req.params.id);
    const todos = await vueloController.obtenerVuelos();
    req.io.emit('vuelo_updated', todos);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
