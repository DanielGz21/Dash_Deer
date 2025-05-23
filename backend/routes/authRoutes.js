// backend/routes/authRoutes.js

const express = require('express');
const { login } = require('../controllers/authController');

const router = express.Router();

// Ruta de login conectada al controlador
router.post('/login', login);

module.exports = router;
