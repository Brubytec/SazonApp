-- ============================================================
--  fix_sp_GenerarFactura.sql
--  Abre este archivo en MySQL Workbench y presiona Ctrl+Shift+Enter
-- ============================================================

USE sazonapp;

DROP PROCEDURE IF EXISTS sp_GenerarFactura;

DELIMITER $$

CREATE PROCEDURE sp_GenerarFactura(
  IN  p_id_pedido   INT,
  IN  p_id_usuario  INT,
  IN  p_medio_pago  ENUM('efectivo','transferencia','tarjeta'),
  OUT p_numero_fac  VARCHAR(20)
)
BEGIN
  DECLARE v_total        DECIMAL(10,2);
  DECLARE v_id_mesa      INT;
  DECLARE v_estado       VARCHAR(20);
  DECLARE v_conteo       INT;
  DECLARE v_existe       INT DEFAULT 0;

  SELECT COUNT(*), MIN(numero_factura)
    INTO v_existe, p_numero_fac
    FROM factura
    WHERE id_pedido = p_id_pedido;

  IF v_existe > 0 THEN
    SELECT id_mesa INTO v_id_mesa FROM pedido WHERE id_pedido = p_id_pedido;
    UPDATE pedido SET estado = 'facturado' WHERE id_pedido = p_id_pedido AND estado = 'abierto';
    UPDATE mesa   SET estado = 'disponible' WHERE id_mesa  = v_id_mesa   AND estado = 'ocupada';
  ELSE
    SELECT estado, total, id_mesa INTO v_estado, v_total, v_id_mesa
      FROM pedido WHERE id_pedido = p_id_pedido;

    IF v_estado != 'abierto' THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Solo se pueden facturar pedidos en estado abierto';
    END IF;

    SELECT COUNT(*) INTO v_conteo FROM detalle_pedido WHERE id_pedido = p_id_pedido;

    IF v_conteo = 0 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El pedido no tiene productos registrados';
    END IF;

    SET p_numero_fac = CONCAT('FAC-', LPAD(p_id_pedido, 6, '0'));

    INSERT INTO factura (id_pedido, id_usuario, total, medio_pago, numero_factura)
    VALUES (p_id_pedido, p_id_usuario, v_total, p_medio_pago, p_numero_fac);

    UPDATE pedido SET estado = 'facturado'  WHERE id_pedido = p_id_pedido;
    UPDATE mesa   SET estado = 'disponible' WHERE id_mesa   = v_id_mesa;
  END IF;
END$$

DELIMITER ;

-- Verificación
SELECT ROUTINE_NAME, LAST_ALTERED FROM information_schema.ROUTINES
  WHERE ROUTINE_SCHEMA = 'sazonapp' AND ROUTINE_NAME = 'sp_GenerarFactura';
