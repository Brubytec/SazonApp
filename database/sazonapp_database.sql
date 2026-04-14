-- ============================================================
--  SAZONAPP — Script completo de base de datos
--  Restaurante Sazón y Sabor · Popayán, Cauca
--  Asignatura : Sistema de Información Empresarial
--  Autor      : Bryan Rubiel Gaviria Carlosama
--  Fecha      : 2026
--  Motor      : MySQL 8.0+
-- ============================================================
--  Contenido:
--    1. DDL  — Creación de base de datos y tablas
--    2. DCL  — Usuarios y permisos
--    3. DML  — Datos iniciales de prueba (seed)
--    4. Procedimientos almacenados
--    5. Funciones
--    6. Triggers
--    7. Vistas
--    8. DQL  — Consultas de ejemplo
-- ============================================================


-- ============================================================
--  SECCIÓN 1: DDL — CREACIÓN DE BASE DE DATOS Y TABLAS
-- ============================================================

DROP DATABASE IF EXISTS sazonapp;
CREATE DATABASE sazonapp
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE sazonapp;

-- ── Tabla: USUARIO ──────────────────────────────────────────
-- Almacena los administradores con acceso al sistema.
CREATE TABLE usuario (
  id_usuario   INT            NOT NULL AUTO_INCREMENT,
  nombre       VARCHAR(100)   NOT NULL,
  email        VARCHAR(100)   NOT NULL UNIQUE,
  password     VARCHAR(255)   NOT NULL COMMENT 'Hash bcrypt',
  rol          ENUM('administrador','cajero') NOT NULL DEFAULT 'cajero',
  activo       BOOLEAN        NOT NULL DEFAULT TRUE,
  created_at   DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_usuario PRIMARY KEY (id_usuario)
) ENGINE=InnoDB COMMENT='Usuarios con acceso al sistema de gestión';

-- ── Tabla: MESA ──────────────────────────────────────────────
-- Registra las mesas físicas del restaurante.
CREATE TABLE mesa (
  id_mesa    INT          NOT NULL AUTO_INCREMENT,
  numero     INT          NOT NULL UNIQUE,
  capacidad  INT          NOT NULL,
  estado     ENUM('disponible','ocupada','reservada') NOT NULL DEFAULT 'disponible',
  ubicacion  VARCHAR(80)  NULL COMMENT 'Ej: Terraza, Interior',
  CONSTRAINT pk_mesa PRIMARY KEY (id_mesa),
  CONSTRAINT chk_capacidad CHECK (capacidad BETWEEN 1 AND 20)
) ENGINE=InnoDB COMMENT='Mesas físicas del restaurante';

-- ── Tabla: CATEGORIA ─────────────────────────────────────────
-- Agrupa los productos del menú.
CREATE TABLE categoria (
  id_categoria INT          NOT NULL AUTO_INCREMENT,
  nombre       VARCHAR(80)  NOT NULL UNIQUE,
  descripcion  TEXT         NULL,
  CONSTRAINT pk_categoria PRIMARY KEY (id_categoria)
) ENGINE=InnoDB COMMENT='Categorías del menú';

-- ── Tabla: PRODUCTO ──────────────────────────────────────────
-- Platos y bebidas disponibles en el menú.
CREATE TABLE producto (
  id_producto  INT             NOT NULL AUTO_INCREMENT,
  id_categoria INT             NOT NULL,
  nombre       VARCHAR(100)    NOT NULL,
  descripcion  TEXT            NULL,
  precio       DECIMAL(10,2)   NOT NULL,
  disponible   BOOLEAN         NOT NULL DEFAULT TRUE,
  created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_producto   PRIMARY KEY (id_producto),
  CONSTRAINT fk_prod_cat   FOREIGN KEY (id_categoria)
             REFERENCES categoria(id_categoria) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_precio    CHECK (precio > 0)
) ENGINE=InnoDB COMMENT='Productos del menú del restaurante';

-- ── Tabla: CLIENTE ───────────────────────────────────────────
-- Datos básicos de clientes que realizan reservas.
CREATE TABLE cliente (
  id_cliente INT          NOT NULL AUTO_INCREMENT,
  nombre     VARCHAR(100) NOT NULL,
  telefono   VARCHAR(20)  NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_cliente PRIMARY KEY (id_cliente)
) ENGINE=InnoDB COMMENT='Clientes que realizan reservas';

-- ── Tabla: RESERVA ───────────────────────────────────────────
-- Reservas de mesas con fecha, hora y datos del cliente.
CREATE TABLE reserva (
  id_reserva   INT    NOT NULL AUTO_INCREMENT,
  id_cliente   INT    NOT NULL,
  id_mesa      INT    NOT NULL,
  id_usuario   INT    NOT NULL,
  fecha        DATE   NOT NULL,
  hora         TIME   NOT NULL,
  num_personas INT    NOT NULL,
  estado       ENUM('pendiente','confirmada','cancelada','completada')
               NOT NULL DEFAULT 'pendiente',
  observaciones TEXT  NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_reserva    PRIMARY KEY (id_reserva),
  CONSTRAINT fk_res_cli    FOREIGN KEY (id_cliente)
             REFERENCES cliente(id_cliente) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_res_mesa   FOREIGN KEY (id_mesa)
             REFERENCES mesa(id_mesa) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_res_usr    FOREIGN KEY (id_usuario)
             REFERENCES usuario(id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_personas  CHECK (num_personas >= 1)
) ENGINE=InnoDB COMMENT='Reservas de mesas';

-- ── Tabla: PEDIDO ─────────────────────────────────────────────
-- Pedido activo de una mesa.
CREATE TABLE pedido (
  id_pedido   INT            NOT NULL AUTO_INCREMENT,
  id_mesa     INT            NOT NULL,
  id_usuario  INT            NOT NULL,
  fecha_hora  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado      ENUM('abierto','cerrado','facturado') NOT NULL DEFAULT 'abierto',
  total       DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
  CONSTRAINT pk_pedido   PRIMARY KEY (id_pedido),
  CONSTRAINT fk_ped_mesa FOREIGN KEY (id_mesa)
             REFERENCES mesa(id_mesa) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_ped_usr  FOREIGN KEY (id_usuario)
             REFERENCES usuario(id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB COMMENT='Pedidos por mesa';

-- ── Tabla: DETALLE_PEDIDO ────────────────────────────────────
-- Líneas individuales de cada pedido.
CREATE TABLE detalle_pedido (
  id_detalle     INT           NOT NULL AUTO_INCREMENT,
  id_pedido      INT           NOT NULL,
  id_producto    INT           NOT NULL,
  cantidad       INT           NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  subtotal       DECIMAL(10,2) NOT NULL,
  CONSTRAINT pk_detalle     PRIMARY KEY (id_detalle),
  CONSTRAINT fk_det_ped     FOREIGN KEY (id_pedido)
             REFERENCES pedido(id_pedido) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_det_prod    FOREIGN KEY (id_producto)
             REFERENCES producto(id_producto) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_cantidad   CHECK (cantidad >= 1),
  CONSTRAINT chk_subtotal   CHECK (subtotal >= 0)
) ENGINE=InnoDB COMMENT='Detalle de productos por pedido';

-- ── Tabla: FACTURA ───────────────────────────────────────────
-- Facturas generadas al cerrar un pedido.
CREATE TABLE factura (
  id_factura     INT            NOT NULL AUTO_INCREMENT,
  id_pedido      INT            NOT NULL UNIQUE,
  id_usuario     INT            NOT NULL,
  fecha_hora     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  total          DECIMAL(10,2)  NOT NULL,
  medio_pago     ENUM('efectivo','transferencia','tarjeta') NOT NULL,
  numero_factura VARCHAR(20)    NOT NULL UNIQUE,
  CONSTRAINT pk_factura    PRIMARY KEY (id_factura),
  CONSTRAINT fk_fac_ped    FOREIGN KEY (id_pedido)
             REFERENCES pedido(id_pedido) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_fac_usr    FOREIGN KEY (id_usuario)
             REFERENCES usuario(id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_total_fac CHECK (total > 0)
) ENGINE=InnoDB COMMENT='Facturas emitidas';


-- ============================================================
--  SECCIÓN 2: DCL — USUARIOS DE BASE DE DATOS Y PERMISOS
-- ============================================================

-- Usuario para la capa de lógica (backend Node.js)
CREATE USER IF NOT EXISTS 'sazonapp_api'@'localhost'
  IDENTIFIED BY 'SazonApi#2026!';

-- Solo los permisos necesarios (principio de mínimo privilegio)
GRANT SELECT, INSERT, UPDATE, DELETE
  ON sazonapp.*
  TO 'sazonapp_api'@'localhost';

-- Usuario de solo lectura para reportes
CREATE USER IF NOT EXISTS 'sazonapp_reportes'@'localhost'
  IDENTIFIED BY 'SazonRep#2026!';

GRANT SELECT
  ON sazonapp.*
  TO 'sazonapp_reportes'@'localhost';

FLUSH PRIVILEGES;


-- ============================================================
--  SECCIÓN 3: DML — DATOS INICIALES DE PRUEBA (SEED)
-- ============================================================

-- ── Usuarios ────────────────────────────────────────────────
-- Contraseña: Admin2026! (hash bcrypt de ejemplo)
INSERT INTO usuario (nombre, email, password, rol) VALUES
  ('Administrador Principal', 'admin@sazonysabor.co',
   '$2b$10$Kd3Q8zXvP1mN4jL7wR2uOuH9bY5cA6eF0gI3hT1iU8oV2pQ4rS6tX', 'administrador'),
  ('Cajero Turno Mañana',    'cajero@sazonysabor.co',
   '$2b$10$Mb2C9aYuQ3nN5kM8xT1vPuI0cZ6dB7fG1hJ4iK2lU9oW3qR5sT7vY', 'cajero');

-- ── Mesas ────────────────────────────────────────────────────
INSERT INTO mesa (numero, capacidad, estado, ubicacion) VALUES
  (1,  4, 'disponible', 'Interior'),
  (2,  4, 'disponible', 'Interior'),
  (3,  6, 'ocupada',    'Interior'),
  (4,  4, 'reservada',  'Terraza'),
  (5,  2, 'ocupada',    'Terraza'),
  (6,  2, 'disponible', 'Terraza'),
  (7,  6, 'disponible', 'Interior'),
  (8,  4, 'ocupada',    'Interior'),
  (9,  4, 'disponible', 'Terraza'),
  (10, 8, 'disponible', 'Interior');

-- ── Categorías ───────────────────────────────────────────────
INSERT INTO categoria (nombre, descripcion) VALUES
  ('Platos Fuertes', 'Almuerzos completos y platos principales'),
  ('Empanadas',      'Empanadas de pipián, carne y mixtas'),
  ('Arepas',         'Arepas de chócolo, maíz y rellenas'),
  ('Frijoles',       'Frijoles rojos con distintos acompañamientos'),
  ('Mazamorra',      'Mazamorra con leche, panela y variantes'),
  ('Bebidas',        'Jugos naturales, gaseosas y bebidas calientes'),
  ('Otros',          'Postres, adicionales y entradas');

-- ── Productos ────────────────────────────────────────────────
INSERT INTO producto (id_categoria, nombre, descripcion, precio, disponible) VALUES
  -- Platos fuertes
  (1, 'Almuerzo del día',       'Arroz, frijoles, proteína del día, ensalada y jugo',   12000.00, TRUE),
  (1, 'Bandeja paisa',          'Frijoles, arroz, carne molida, chicharrón, aguacate',  18000.00, TRUE),
  (1, 'Pescado frito entero',   'Pescado frito con patacones, arroz y ensalada',         22000.00, TRUE),
  (1, 'Arroz con pollo',        'Arroz mixto con pollo, verduras y ají',                14000.00, TRUE),
  -- Empanadas
  (2, 'Empanadas de pipián (x3)','Empanadas rellenas de pipián artesanal',               9000.00, TRUE),
  (2, 'Empanadas de carne (x3)', 'Empanadas rellenas de carne guisada',                  9000.00, TRUE),
  -- Arepas
  (3, 'Arepa de chócolo',       'Arepa de maíz tierno con queso campesino',              6000.00, TRUE),
  (3, 'Arepa de maíz pelado',   'Arepa tradicional caucana',                             4000.00, TRUE),
  -- Frijoles
  (4, 'Frijoles con garra',     'Frijoles rojos con chicharrón y chorizo',              14000.00, TRUE),
  (4, 'Frijoles corrientes',    'Frijoles rojos con aguacate y arroz',                  10000.00, TRUE),
  -- Mazamorra
  (5, 'Mazamorra blanca',       'Mazamorra de maíz con leche y panela',                  5000.00, TRUE),
  (5, 'Mazamorra con cuajada',  'Mazamorra servida con cuajada fresca',                  7000.00, FALSE),
  -- Bebidas
  (6, 'Jugo de lulo',           'Jugo natural de lulo en agua o leche',                  5000.00, TRUE),
  (6, 'Jugo de maracuyá',       'Jugo natural de maracuyá',                              5000.00, TRUE),
  (6, 'Gaseosa',                'Gaseosa en lata 330ml',                                 3500.00, TRUE),
  (6, 'Agua en botella',        'Agua mineral 600ml',                                    2500.00, TRUE),
  -- Otros
  (7, 'Porción de arroz',       'Porción adicional de arroz blanco',                     2000.00, TRUE),
  (7, 'Aguacate',               'Medio aguacate fresco',                                 3000.00, TRUE);

-- ── Clientes ─────────────────────────────────────────────────
INSERT INTO cliente (nombre, telefono) VALUES
  ('María García',   '310-555-0101'),
  ('Juan Pérez',     '315-555-0202'),
  ('Familia Ruiz',   '312-555-0303'),
  ('Carlos López',   '317-555-0404'),
  ('Andrés Muñoz',   '318-555-0505'),
  ('Laura Castillo', '321-555-0606'),
  ('Pedro Ortiz',    '314-555-0707');

-- ── Reservas del día ─────────────────────────────────────────
INSERT INTO reserva (id_cliente, id_mesa, id_usuario, fecha, hora, num_personas, estado, observaciones) VALUES
  (1, 4,  1, CURDATE(), '12:30:00', 3, 'confirmada', NULL),
  (2, 7,  1, CURDATE(), '13:00:00', 5, 'pendiente',  'Mesa cerca a la ventana si es posible'),
  (3, 2,  1, CURDATE(), '14:00:00', 6, 'pendiente',  'Celebración de cumpleaños'),
  (4, 9,  1, CURDATE(), '19:00:00', 2, 'confirmada', NULL),
  (5, 6,  1, CURDATE(), '11:00:00', 4, 'cancelada',  'Cliente canceló por llamada');

-- ── Pedidos activos ───────────────────────────────────────────
INSERT INTO pedido (id_mesa, id_usuario, fecha_hora, estado, total) VALUES
  (3, 1, DATE_SUB(NOW(), INTERVAL 32 MINUTE), 'abierto', 58000.00),
  (5, 1, DATE_SUB(NOW(), INTERVAL 15 MINUTE), 'abierto', 22500.00),
  (8, 1, DATE_SUB(NOW(), INTERVAL 8  MINUTE), 'abierto', 11000.00);

-- ── Detalles de pedidos ───────────────────────────────────────
-- Pedido Mesa 3
INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, precio_unitario, subtotal) VALUES
  (1, 1,  2, 12000.00, 24000.00),  -- 2x Almuerzo del día
  (1, 5,  1,  9000.00,  9000.00),  -- 1x Empanadas pipián
  (1, 11, 2,  5000.00, 10000.00),  -- 2x Mazamorra
  (1, 13, 3,  5000.00, 15000.00);  -- 3x Jugo de lulo

-- Pedido Mesa 5
INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, precio_unitario, subtotal) VALUES
  (2, 2,  1, 18000.00, 18000.00),  -- 1x Bandeja paisa
  (2, 14, 1,  5000.00,  5000.00);  -- 1x Jugo maracuyá (total approx)

-- Pedido Mesa 8
INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, precio_unitario, subtotal) VALUES
  (3, 7,  1,  6000.00,  6000.00),  -- 1x Arepa chócolo
  (3, 13, 1,  5000.00,  5000.00);  -- 1x Jugo de lulo

-- ── Facturas históricas ───────────────────────────────────────
INSERT INTO pedido (id_mesa, id_usuario, fecha_hora, estado, total) VALUES
  (1, 1, DATE_SUB(NOW(), INTERVAL 2 HOUR), 'facturado', 32000.00),
  (6, 1, DATE_SUB(NOW(), INTERVAL 3 HOUR), 'facturado', 45000.00);

INSERT INTO factura (id_pedido, id_usuario, total, medio_pago, numero_factura) VALUES
  (4, 1, 32000.00, 'efectivo',      'FAC-000001'),
  (5, 1, 45000.00, 'transferencia', 'FAC-000002');


-- ============================================================
--  SECCIÓN 4: PROCEDIMIENTOS ALMACENADOS
-- ============================================================

DELIMITER $$

-- ── sp_CrearPedido ───────────────────────────────────────────
-- Crea un pedido nuevo para una mesa y la marca como ocupada.
CREATE PROCEDURE sp_CrearPedido(
  IN  p_id_mesa    INT,
  IN  p_id_usuario INT,
  OUT p_id_pedido  INT
)
BEGIN
  DECLARE v_estado_mesa VARCHAR(20);

  -- Validar que la mesa esté disponible
  SELECT estado INTO v_estado_mesa
    FROM mesa WHERE id_mesa = p_id_mesa;

  IF v_estado_mesa != 'disponible' THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'La mesa no está disponible para crear un pedido';
  END IF;

  -- Crear el pedido
  INSERT INTO pedido (id_mesa, id_usuario, estado, total)
    VALUES (p_id_mesa, p_id_usuario, 'abierto', 0.00);

  SET p_id_pedido = LAST_INSERT_ID();

  -- Cambiar estado de la mesa a ocupada
  UPDATE mesa SET estado = 'ocupada'
    WHERE id_mesa = p_id_mesa;
END$$


-- ── sp_AgregarDetallePedido ──────────────────────────────────
-- Agrega un producto al pedido y recalcula el total.
CREATE PROCEDURE sp_AgregarDetallePedido(
  IN p_id_pedido  INT,
  IN p_id_producto INT,
  IN p_cantidad    INT
)
BEGIN
  DECLARE v_precio     DECIMAL(10,2);
  DECLARE v_disponible BOOLEAN;
  DECLARE v_estado_ped VARCHAR(20);

  -- Validar que el pedido esté abierto
  SELECT estado INTO v_estado_ped
    FROM pedido WHERE id_pedido = p_id_pedido;

  IF v_estado_ped != 'abierto' THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'No se puede modificar un pedido cerrado o facturado';
  END IF;

  -- Validar que el producto esté disponible
  SELECT precio, disponible INTO v_precio, v_disponible
    FROM producto WHERE id_producto = p_id_producto;

  IF v_disponible = FALSE THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'El producto no está disponible actualmente';
  END IF;

  -- Insertar detalle
  INSERT INTO detalle_pedido
    (id_pedido, id_producto, cantidad, precio_unitario, subtotal)
  VALUES
    (p_id_pedido, p_id_producto, p_cantidad, v_precio, v_precio * p_cantidad);

  -- Recalcular total del pedido
  UPDATE pedido
    SET total = (
      SELECT SUM(subtotal) FROM detalle_pedido WHERE id_pedido = p_id_pedido
    )
    WHERE id_pedido = p_id_pedido;
END$$


-- ── sp_EliminarDetallePedido ─────────────────────────────────
-- Elimina una línea del pedido y recalcula el total.
CREATE PROCEDURE sp_EliminarDetallePedido(
  IN p_id_detalle INT
)
BEGIN
  DECLARE v_id_pedido INT;
  DECLARE v_estado    VARCHAR(20);

  SELECT id_pedido INTO v_id_pedido
    FROM detalle_pedido WHERE id_detalle = p_id_detalle;

  SELECT estado INTO v_estado
    FROM pedido WHERE id_pedido = v_id_pedido;

  IF v_estado != 'abierto' THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'No se puede modificar un pedido cerrado o facturado';
  END IF;

  DELETE FROM detalle_pedido WHERE id_detalle = p_id_detalle;

  UPDATE pedido
    SET total = IFNULL(
      (SELECT SUM(subtotal) FROM detalle_pedido WHERE id_pedido = v_id_pedido),
      0.00
    )
    WHERE id_pedido = v_id_pedido;
END$$


-- ── sp_GenerarFactura ────────────────────────────────────────
-- Genera la factura, cierra el pedido y libera la mesa.
CREATE PROCEDURE sp_GenerarFactura(
  IN  p_id_pedido   INT,
  IN  p_id_usuario  INT,
  IN  p_medio_pago  ENUM('efectivo','transferencia','tarjeta'),
  OUT p_numero_fac  VARCHAR(20)
)
BEGIN
  DECLARE v_total    DECIMAL(10,2);
  DECLARE v_id_mesa  INT;
  DECLARE v_estado   VARCHAR(20);
  DECLARE v_conteo   INT;

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
END$$


-- ── sp_CancelarReserva ───────────────────────────────────────
-- Cancela una reserva y libera la mesa si aplica.
CREATE PROCEDURE sp_CancelarReserva(
  IN p_id_reserva INT
)
BEGIN
  DECLARE v_estado VARCHAR(20);

  SELECT estado INTO v_estado
    FROM reserva WHERE id_reserva = p_id_reserva;

  IF v_estado IN ('completada','cancelada') THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'La reserva ya fue completada o cancelada';
  END IF;

  UPDATE reserva SET estado = 'cancelada'
    WHERE id_reserva = p_id_reserva;
  -- El trigger trg_LiberarMesaAlCancelarReserva se encarga del estado de la mesa
END$$


-- ── sp_ResumenDashboard ──────────────────────────────────────
-- Retorna los indicadores del dashboard en una sola llamada.
CREATE PROCEDURE sp_ResumenDashboard()
BEGIN
  SELECT
    (SELECT COUNT(*) FROM mesa WHERE estado = 'disponible') AS mesas_disponibles,
    (SELECT COUNT(*) FROM mesa WHERE estado = 'ocupada')    AS mesas_ocupadas,
    (SELECT COUNT(*) FROM mesa WHERE estado = 'reservada')  AS mesas_reservadas,
    (SELECT COUNT(*) FROM reserva WHERE fecha = CURDATE()
       AND estado NOT IN ('cancelada'))                     AS reservas_hoy,
    (SELECT COUNT(*) FROM pedido WHERE estado = 'abierto')  AS pedidos_activos,
    (SELECT IFNULL(SUM(total),0) FROM factura
       WHERE DATE(fecha_hora) = CURDATE())                  AS ventas_hoy,
    (SELECT COUNT(*) FROM factura
       WHERE DATE(fecha_hora) = CURDATE())                  AS facturas_hoy;
END$$

DELIMITER ;


-- ============================================================
--  SECCIÓN 5: FUNCIONES
-- ============================================================

DELIMITER $$

-- ── fn_TotalPedido ───────────────────────────────────────────
-- Calcula el total de un pedido sumando sus detalles.
CREATE FUNCTION fn_TotalPedido(p_id_pedido INT)
RETURNS DECIMAL(10,2)
READS SQL DATA
DETERMINISTIC
BEGIN
  DECLARE v_total DECIMAL(10,2);
  SELECT IFNULL(SUM(subtotal), 0.00)
    INTO v_total
    FROM detalle_pedido
    WHERE id_pedido = p_id_pedido;
  RETURN v_total;
END$$


-- ── fn_MesaDisponible ────────────────────────────────────────
-- Retorna 1 si la mesa está disponible para una fecha y hora,
-- considerando que no tenga reserva activa en ese momento.
CREATE FUNCTION fn_MesaDisponible(
  p_id_mesa INT,
  p_fecha   DATE,
  p_hora    TIME
)
RETURNS BOOLEAN
READS SQL DATA
DETERMINISTIC
BEGIN
  DECLARE v_conflictos INT;
  DECLARE v_estado     VARCHAR(20);

  -- Verificar estado actual
  SELECT estado INTO v_estado FROM mesa WHERE id_mesa = p_id_mesa;
  IF v_estado = 'ocupada' THEN RETURN FALSE; END IF;

  -- Verificar conflicto de reservas (ventana de 2 horas)
  SELECT COUNT(*) INTO v_conflictos
    FROM reserva
    WHERE id_mesa   = p_id_mesa
      AND fecha     = p_fecha
      AND estado    NOT IN ('cancelada')
      AND ABS(TIMESTAMPDIFF(MINUTE,
            CAST(CONCAT(p_fecha,' ',p_hora) AS DATETIME),
            CAST(CONCAT(fecha,' ',hora)    AS DATETIME)
          )) < 120;

  RETURN (v_conflictos = 0);
END$$


-- ── fn_IngresosDelMes ────────────────────────────────────────
-- Retorna los ingresos totales de un mes y año dados.
CREATE FUNCTION fn_IngresosDelMes(p_anio INT, p_mes INT)
RETURNS DECIMAL(12,2)
READS SQL DATA
DETERMINISTIC
BEGIN
  DECLARE v_total DECIMAL(12,2);
  SELECT IFNULL(SUM(total), 0.00) INTO v_total
    FROM factura
    WHERE YEAR(fecha_hora)  = p_anio
      AND MONTH(fecha_hora) = p_mes;
  RETURN v_total;
END$$

DELIMITER ;


-- ============================================================
--  SECCIÓN 6: TRIGGERS
-- ============================================================

DELIMITER $$

-- ── trg_LiberarMesaAlCancelarReserva ─────────────────────────
-- Al cancelar una reserva, libera la mesa si estaba reservada.
CREATE TRIGGER trg_LiberarMesaAlCancelarReserva
AFTER UPDATE ON reserva
FOR EACH ROW
BEGIN
  IF NEW.estado = 'cancelada' AND OLD.estado != 'cancelada' THEN
    UPDATE mesa
      SET estado = 'disponible'
      WHERE id_mesa = NEW.id_mesa
        AND estado  = 'reservada';
  END IF;
END$$


-- ── trg_ValidarCapacidadReserva ───────────────────────────────
-- Antes de insertar una reserva, verifica que las personas
-- no superen la capacidad de la mesa.
CREATE TRIGGER trg_ValidarCapacidadReserva
BEFORE INSERT ON reserva
FOR EACH ROW
BEGIN
  DECLARE v_capacidad INT;
  SELECT capacidad INTO v_capacidad
    FROM mesa WHERE id_mesa = NEW.id_mesa;

  IF NEW.num_personas > v_capacidad THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'El número de personas supera la capacidad de la mesa';
  END IF;
END$$


-- ── trg_MarcarMesaReservada ───────────────────────────────────
-- Al confirmar una reserva, actualiza la mesa a "reservada".
CREATE TRIGGER trg_MarcarMesaReservada
AFTER UPDATE ON reserva
FOR EACH ROW
BEGIN
  IF NEW.estado = 'confirmada' AND OLD.estado != 'confirmada' THEN
    UPDATE mesa SET estado = 'reservada'
      WHERE id_mesa = NEW.id_mesa
        AND estado  = 'disponible';
  END IF;
END$$


-- ── trg_RecalcularTotalEnDetalle ──────────────────────────────
-- Recalcula el subtotal del detalle si se modifica la cantidad.
CREATE TRIGGER trg_RecalcularTotalEnDetalle
BEFORE UPDATE ON detalle_pedido
FOR EACH ROW
BEGIN
  IF NEW.cantidad != OLD.cantidad THEN
    SET NEW.subtotal = NEW.precio_unitario * NEW.cantidad;
  END IF;
END$$


-- ── trg_ActualizarTotalPedidoTrasDetalle ─────────────────────
-- Actualiza el total del pedido después de modificar un detalle.
CREATE TRIGGER trg_ActualizarTotalPedidoTrasDetalle
AFTER UPDATE ON detalle_pedido
FOR EACH ROW
BEGIN
  UPDATE pedido
    SET total = fn_TotalPedido(NEW.id_pedido)
    WHERE id_pedido = NEW.id_pedido;
END$$

DELIMITER ;


-- ============================================================
--  SECCIÓN 7: VISTAS
-- ============================================================

-- ── vista_reservas_hoy ────────────────────────────────────────
-- Reservas del día con datos del cliente, mesa y usuario.
CREATE OR REPLACE VIEW vista_reservas_hoy AS
SELECT
  r.id_reserva,
  r.fecha,
  r.hora,
  c.nombre        AS cliente,
  c.telefono,
  m.numero        AS numero_mesa,
  m.capacidad,
  r.num_personas,
  r.estado,
  r.observaciones,
  u.nombre        AS registrado_por
FROM reserva r
  JOIN cliente c  ON r.id_cliente  = c.id_cliente
  JOIN mesa    m  ON r.id_mesa     = m.id_mesa
  JOIN usuario u  ON r.id_usuario  = u.id_usuario
WHERE r.fecha = CURDATE()
ORDER BY r.hora;


-- ── vista_pedidos_activos ─────────────────────────────────────
-- Pedidos abiertos con tiempo transcurrido y total.
CREATE OR REPLACE VIEW vista_pedidos_activos AS
SELECT
  p.id_pedido,
  m.numero                                          AS numero_mesa,
  m.ubicacion,
  u.nombre                                          AS atendido_por,
  p.fecha_hora,
  TIMESTAMPDIFF(MINUTE, p.fecha_hora, NOW())        AS minutos_abierto,
  p.total,
  COUNT(dp.id_detalle)                              AS num_productos
FROM pedido p
  JOIN mesa          m  ON p.id_mesa    = m.id_mesa
  JOIN usuario       u  ON p.id_usuario = u.id_usuario
  LEFT JOIN detalle_pedido dp ON p.id_pedido = dp.id_pedido
WHERE p.estado = 'abierto'
GROUP BY p.id_pedido, m.numero, m.ubicacion, u.nombre, p.fecha_hora, p.total
ORDER BY p.fecha_hora;


-- ── vista_detalle_pedido_completo ─────────────────────────────
-- Detalle de un pedido con nombre del producto y categoría.
CREATE OR REPLACE VIEW vista_detalle_pedido_completo AS
SELECT
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


-- ── vista_ingresos_por_dia ────────────────────────────────────
-- Resumen de ingresos diarios agrupados por medio de pago.
CREATE OR REPLACE VIEW vista_ingresos_por_dia AS
SELECT
  DATE(f.fecha_hora)   AS fecha,
  f.medio_pago,
  COUNT(*)             AS num_facturas,
  SUM(f.total)         AS total_ingresos
FROM factura f
GROUP BY DATE(f.fecha_hora), f.medio_pago
ORDER BY fecha DESC;


-- ── vista_ingresos_por_categoria ──────────────────────────────
-- Ingresos del día desglosados por categoría de producto.
CREATE OR REPLACE VIEW vista_ingresos_por_categoria AS
SELECT
  cat.nombre           AS categoria,
  COUNT(dp.id_detalle) AS unidades_vendidas,
  SUM(dp.subtotal)     AS ingresos_categoria
FROM factura f
  JOIN pedido        p   ON f.id_pedido     = p.id_pedido
  JOIN detalle_pedido dp  ON p.id_pedido    = dp.id_pedido
  JOIN producto      pr  ON dp.id_producto  = pr.id_producto
  JOIN categoria     cat ON pr.id_categoria = cat.id_categoria
WHERE DATE(f.fecha_hora) = CURDATE()
GROUP BY cat.nombre
ORDER BY ingresos_categoria DESC;


-- ── vista_productos_disponibles ───────────────────────────────
-- Productos activos con su categoría (para el módulo de pedidos).
CREATE OR REPLACE VIEW vista_productos_disponibles AS
SELECT
  pr.id_producto,
  cat.nombre   AS categoria,
  pr.nombre    AS producto,
  pr.descripcion,
  pr.precio
FROM producto  pr
  JOIN categoria cat ON pr.id_categoria = cat.id_categoria
WHERE pr.disponible = TRUE
ORDER BY cat.nombre, pr.nombre;


-- ── vista_estado_mesas ────────────────────────────────────────
-- Estado actual de todas las mesas con pedido activo si aplica.
CREATE OR REPLACE VIEW vista_estado_mesas AS
SELECT
  m.id_mesa,
  m.numero,
  m.capacidad,
  m.ubicacion,
  m.estado,
  p.id_pedido,
  p.total            AS total_pedido,
  TIMESTAMPDIFF(MINUTE, p.fecha_hora, NOW()) AS minutos_pedido_abierto
FROM mesa m
  LEFT JOIN pedido p
    ON m.id_mesa = p.id_mesa AND p.estado = 'abierto'
ORDER BY m.numero;


-- ============================================================
--  SECCIÓN 8: DQL — CONSULTAS DE EJEMPLO
-- ============================================================

-- ── Q1: Resumen del dashboard ─────────────────────────────────
CALL sp_ResumenDashboard();

-- ── Q2: Reservas de hoy ───────────────────────────────────────
SELECT * FROM vista_reservas_hoy;

-- ── Q3: Pedidos activos ───────────────────────────────────────
SELECT * FROM vista_pedidos_activos;

-- ── Q4: Estado actual de todas las mesas ─────────────────────
SELECT * FROM vista_estado_mesas;

-- ── Q5: Detalle del pedido 1 ──────────────────────────────────
SELECT * FROM vista_detalle_pedido_completo WHERE id_pedido = 1;

-- ── Q6: Ingresos del día por categoría ───────────────────────
SELECT * FROM vista_ingresos_por_categoria;

-- ── Q7: Ingresos del día por medio de pago ───────────────────
SELECT * FROM vista_ingresos_por_dia WHERE fecha = CURDATE();

-- ── Q8: Ingresos del mes actual ───────────────────────────────
SELECT fn_IngresosDelMes(YEAR(NOW()), MONTH(NOW())) AS ingresos_mes_actual;

-- ── Q9: Productos más vendidos (histórico) ────────────────────
SELECT
  pr.nombre          AS producto,
  cat.nombre         AS categoria,
  SUM(dp.cantidad)   AS unidades_vendidas,
  SUM(dp.subtotal)   AS ingresos_total
FROM detalle_pedido dp
  JOIN producto  pr  ON dp.id_producto  = pr.id_producto
  JOIN categoria cat ON pr.id_categoria = cat.id_categoria
  JOIN pedido    p   ON dp.id_pedido    = p.id_pedido
WHERE p.estado = 'facturado'
GROUP BY pr.id_producto, pr.nombre, cat.nombre
ORDER BY unidades_vendidas DESC
LIMIT 10;

-- ── Q10: Historial de facturas con filtro de fechas ───────────
SELECT
  f.numero_factura,
  m.numero         AS mesa,
  f.fecha_hora,
  f.total,
  f.medio_pago,
  u.nombre         AS cobrado_por
FROM factura f
  JOIN pedido  p ON f.id_pedido  = p.id_pedido
  JOIN mesa    m ON p.id_mesa    = m.id_mesa
  JOIN usuario u ON f.id_usuario = u.id_usuario
WHERE DATE(f.fecha_hora) BETWEEN CURDATE() - INTERVAL 7 DAY AND CURDATE()
ORDER BY f.fecha_hora DESC;

-- ── Q11: Verificar disponibilidad de una mesa ─────────────────
SELECT fn_MesaDisponible(4, CURDATE(), '15:00:00') AS disponible;

-- ── Q12: Total calculado del pedido 1 ────────────────────────
SELECT fn_TotalPedido(1) AS total_pedido_1;

-- ============================================================
--  FIN DEL SCRIPT — sazonapp_database.sql
-- ============================================================
