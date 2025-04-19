// backend/controllers/authController.js

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
require("dotenv").config();

exports.login = async (req, res) => {
  const { nombre, clave } = req.body;

  try {
    const usuario = await User.buscarPorNombre(nombre);

    if (!usuario || !(await bcrypt.compare(clave, usuario.clave))) {
      return res.status(401).json({ mensaje: "Credenciales inválidas" });
    }

    // ✅ Generación del token con 8 horas de duración
    const token = jwt.sign(
      { id: usuario.id, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.json({
      auth: true,
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        rol: usuario.rol
      }
    });
  } catch (error) {
    console.error("❌ Error en login:", error);
    res.status(500).json({ mensaje: "Error del servidor" });
  }
};
