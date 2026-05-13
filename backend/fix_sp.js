/**
 * fix_sp.js
 * Drops and recreates sp_GenerarFactura using IF/ELSE (no labeled blocks).
 * Run from: backend/   →   node ../fix_sp.js   (or wherever node_modules/mysql2 is reachable)
 */
const mysql = require('mysql2/promise');

const SP_DROP = `DROP PROCEDURE IF EXISTS sp_GenerarFactura`;

const SP_CREATE = `
CREATE PROCEDURE sp_GenerarFactura(
  IN  p_id_pedido   INT,
  IN  p_id_usuario  INT,
  IN  p_medio_pago  ENUM('efectivo','transferencia','tarjeta'),
  OUT p_numero_fac  VARCHAR(20)
)
BEGIN
  DECLARE v_total          DECIMAL(10,2);
  DECLARE v_id_mesa        INT;
  DECLARE v_estado         VARCHAR(20);
  DECLARE v_conteo         INT;
  DECLARE v_ya_facturado   INT DEFAULT 0;

  -- Si ya existe factura para este pedido, retornar la existente sin error
  SELECT COUNT(*), MIN(numero_factura)
    INTO v_ya_facturado, p_numero_fac
    FROM factura
    WHERE id_pedido = p_id_pedido;

  IF v_ya_facturado > 0 THEN
    -- Reparar estado por si quedó inconsistente
    UPDATE pedido SET estado = 'facturado'
      WHERE id_pedido = p_id_pedido AND estado = 'abierto';
    SELECT id_mesa INTO v_id_mesa
      FROM pedido WHERE id_pedido = p_id_pedido;
    UPDATE mesa SET estado = 'disponible'
      WHERE id_mesa = v_id_mesa AND estado = 'ocupada';
  ELSE
    -- Validar estado del pedido
    SELECT estado, total, id_mesa INTO v_estado, v_total, v_id_mesa
      FROM pedido WHERE id_pedido = p_id_pedido;

    IF v_estado != 'abierto' THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Solo se pueden facturar pedidos en estado abierto';
    END IF;

    -- Validar que tenga al menos un producto
    SELECT COUNT(*) INTO v_conteo
      FROM detalle_pedido WHERE id_pedido = p_id_pedido;

    IF v_conteo = 0 THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'El pedido no tiene productos registrados';
    END IF;

    -- Generar número de factura consecutivo
    SET p_numero_fac = CONCAT('FAC-', LPAD(p_id_pedido, 6, '0'));

    -- Insertar factura
    INSERT INTO factura
      (id_pedido, id_usuario, total, medio_pago, numero_factura)
    VALUES
      (p_id_pedido, p_id_usuario, v_total, p_medio_pago, p_numero_fac);

    -- Cerrar el pedido
    UPDATE pedido SET estado = 'facturado'
      WHERE id_pedido = p_id_pedido;

    -- Liberar la mesa
    UPDATE mesa SET estado = 'disponible'
      WHERE id_mesa = v_id_mesa;
  END IF;
END
`;

async function run() {
  let conn;
  try {
    conn = await mysql.createConnection({
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: '11user11',
      database: 'sazonapp',
      multipleStatements: false
    });

    console.log('✅ Conectado a MySQL');

    await conn.query(SP_DROP);
    console.log('🗑️  sp_GenerarFactura eliminado');

    await conn.query(SP_CREATE);
    console.log('✅ sp_GenerarFactura creado exitosamente');

    // Quick verification
    const [rows] = await conn.query(
      "SELECT ROUTINE_NAME FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA='sazonapp' AND ROUTINE_NAME='sp_GenerarFactura'"
    );
    if (rows.length > 0) {
      console.log('✅ Verificación: procedimiento existe en la base de datos');
    } else {
      console.log('⚠️  El procedimiento no aparece en information_schema — revisar manualmente');
    }

    await conn.end();
    console.log('\n🎉 Listo. Reinicia el backend para aplicar los cambios.');
  } catch (err) {
    console.error('❌ Error:', err.message);
    if (conn) await conn.end().catch(() => {});
    process.exit(1);
  }
}

run();
