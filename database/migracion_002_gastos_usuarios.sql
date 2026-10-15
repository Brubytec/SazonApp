-- ============================================================
--  SAZONAPP — Migración 002
--  1. Rol "mesero" en la tabla usuario (para la app Android).
--  2. Módulo de inversión / gastos con categorías parametrizables
--     (alimentos, insumos, pago a empleados, etc.).
--
--  Ejecutar UNA vez sobre una base que ya tenga sazonapp_database.sql:
--    mysql -u root -p sazonapp < database/migracion_002_gastos_usuarios.sql
-- ============================================================

USE sazonapp;
SET NAMES utf8mb4;  -- evita tildes dañadas si el cliente usa latin1 (común en Windows)

-- ── 1. Rol mesero ────────────────────────────────────────────
ALTER TABLE usuario
  MODIFY rol ENUM('administrador','cajero','mesero') NOT NULL DEFAULT 'cajero';

-- ── 2. Categorías de gasto (parametrizables desde la web) ────
CREATE TABLE IF NOT EXISTS categoria_gasto (
  id_categoria_gasto INT          NOT NULL AUTO_INCREMENT,
  nombre             VARCHAR(80)  NOT NULL UNIQUE,
  descripcion        VARCHAR(255) NULL,
  activo             BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_categoria_gasto PRIMARY KEY (id_categoria_gasto)
) ENGINE=InnoDB COMMENT='Tipos de inversión o gasto del restaurante';

-- ── 3. Gastos / inversiones ──────────────────────────────────
CREATE TABLE IF NOT EXISTS gasto (
  id_gasto           INT            NOT NULL AUTO_INCREMENT,
  id_categoria_gasto INT            NOT NULL,
  id_usuario         INT            NOT NULL COMMENT 'Quién registró el gasto',
  fecha              DATE           NOT NULL,
  descripcion        VARCHAR(255)   NOT NULL,
  proveedor          VARCHAR(120)   NULL COMMENT 'Proveedor o empleado al que se pagó',
  monto              DECIMAL(12,2)  NOT NULL,
  medio_pago         ENUM('efectivo','transferencia','tarjeta') NOT NULL DEFAULT 'efectivo',
  created_at         DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_gasto        PRIMARY KEY (id_gasto),
  CONSTRAINT fk_gasto_cat    FOREIGN KEY (id_categoria_gasto)
             REFERENCES categoria_gasto(id_categoria_gasto) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_gasto_usr    FOREIGN KEY (id_usuario)
             REFERENCES usuario(id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_gasto_monto CHECK (monto > 0),
  INDEX idx_gasto_fecha (fecha)
) ENGINE=InnoDB COMMENT='Inversiones y gastos del restaurante';

-- ── 4. Categorías iniciales (se pueden editar desde la web) ──
INSERT IGNORE INTO categoria_gasto (nombre, descripcion) VALUES
  ('Alimentos',            'Carnes, verduras, granos y demás materia prima'),
  ('Insumos',              'Desechables, aseo, gas y utensilios'),
  ('Pago a empleados',     'Salarios, turnos y prestaciones'),
  ('Servicios públicos',   'Agua, luz, internet'),
  ('Arriendo',             'Canon del local'),
  ('Otros',                'Gastos que no encajan en otra categoría');

-- ── 5. Vista: gasto por categoría y mes ──────────────────────
CREATE OR REPLACE VIEW vista_gastos_por_mes AS
SELECT
  DATE_FORMAT(g.fecha, '%Y-%m') AS mes,
  cg.nombre                     AS categoria,
  COUNT(*)                      AS num_gastos,
  SUM(g.monto)                  AS total
FROM gasto g
  JOIN categoria_gasto cg ON g.id_categoria_gasto = cg.id_categoria_gasto
GROUP BY DATE_FORMAT(g.fecha, '%Y-%m'), cg.nombre
ORDER BY mes DESC, total DESC;
