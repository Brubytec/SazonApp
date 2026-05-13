const jwt = require('jsonwebtoken');

/**
 * Middleware que verifica el token JWT en el encabezado Authorization.
 * Uso: agregar como segundo argumento en cualquier ruta protegida.
 * Ejemplo: router.get('/ruta', verificarToken, controller.metodo)
 */
const verificarToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario   = payload;  // { id_usuario, email, rol }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado.' });
  }
};

/**
 * Middleware que restringe el acceso solo al rol 'administrador'.
 * Debe usarse después de verificarToken.
 */
const soloAdmin = (req, res, next) => {
  if (req.usuario?.rol !== 'administrador') {
    return res.status(403).json({ error: 'Acceso restringido a administradores.' });
  }
  next();
};

module.exports = { verificarToken, soloAdmin };
