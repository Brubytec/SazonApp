/**
 * Middleware global de manejo de errores.
 * Captura cualquier error lanzado con next(error) en los controladores.
 */
const errorMiddleware = (err, req, res, next) => {
  console.error(`❌ [${new Date().toISOString()}] ${err.message}`);

  // Error de MySQL (código duplicado, FK, etc.)
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ error: 'Ya existe un registro con ese valor único.' });
  }
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({ error: 'Referencia inválida: el registro relacionado no existe.' });
  }

  // Error de negocio lanzado desde el SP (SIGNAL SQLSTATE)
  if (err.sqlMessage) {
    return res.status(400).json({ error: err.sqlMessage });
  }

  // Error genérico
  const status  = err.status  || 500;
  const message = err.message || 'Error interno del servidor';
  res.status(status).json({ error: message });
};

module.exports = errorMiddleware;
