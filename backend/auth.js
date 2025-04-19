// backend/auth.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

function verificarToken(req, res, next) {
  const token = req.headers['authorization'];

  if (!token) return res.status(403).send({ auth: false, message: 'Token requerido' });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).send({ auth: false, message: 'Token inválido' });

    req.user = decoded;
    next();
  });
}

module.exports = verificarToken;
