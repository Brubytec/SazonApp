require('dotenv').config();
const db = require('./src/config/db');

(async () => {
  try {
    await db.query(`
CREATE OR REPLACE VIEW vista_detalle_pedido_completo AS
SELECT
  dp.id_detalle,
  dp.id_pedido,
  m.numero           AS numero_mesa,
  cat.nombre         AS categoria,
  pr.nombre          AS producto,
  dp.cantidad,
  dp.precio_unitario,
  dp.subtotal,
  p.estado           AS estado_pedido
FROM detalle_pedido dp
  JOIN pedido   p   ON dp.id_pedido   = p.id_pedido
  JOIN producto pr  ON dp.id_producto = pr.id_producto
  JOIN categoria cat ON pr.id_categoria = cat.id_categoria
  JOIN mesa      m  ON p.id_mesa      = m.id_mesa
ORDER BY dp.id_pedido, cat.nombre;
`);
    console.log('Vista actualizada');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit();
  }
})();