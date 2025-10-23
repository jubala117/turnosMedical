-- =============================================================================
-- SCHEMA PARA CONFIGURACIÓN DEL KIOSCO - DASHBOARD DE ADMINISTRACIÓN
-- =============================================================================
-- Este schema permite que usuarios sin conocimientos técnicos gestionen
-- el kiosco a través de una interfaz visual
-- =============================================================================

-- Tabla principal de configuración de especialidades para el kiosco
CREATE TABLE IF NOT EXISTS kiosk_especialidad_config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_especialidad INT NOT NULL,
    activo BOOLEAN DEFAULT 1,
    orden INT DEFAULT 0,
    imagen_personalizada VARCHAR(255) DEFAULT NULL,
    mostrar_en_kiosco BOOLEAN DEFAULT 1,
    tiene_opciones BOOLEAN DEFAULT 0,
    tipo_seccion ENUM('consulta', 'examen_lista', 'examen_categorizado') DEFAULT 'consulta',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_especialidad) REFERENCES especialidad(idEspecialidad),
    UNIQUE KEY (id_especialidad)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Configuración de precios para especialidades
CREATE TABLE IF NOT EXISTS kiosk_precio_config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_config INT NOT NULL,
    tipo_precio ENUM('id_bd', 'fijo') DEFAULT 'id_bd',

    -- Para precio por ID de BD
    id_servicio_particular INT DEFAULT NULL,
    id_servicio_club INT DEFAULT NULL,
    tabla_origen ENUM('servicio', 'examen') DEFAULT 'servicio',

    -- Para precio fijo
    precio_particular_fijo DECIMAL(10,2) DEFAULT NULL,
    precio_club_fijo DECIMAL(10,2) DEFAULT NULL,

    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (id_config) REFERENCES kiosk_especialidad_config(id) ON DELETE CASCADE,
    UNIQUE KEY (id_config)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Opciones múltiples para especialidades (ej: "Una Hora", "Media Hora")
CREATE TABLE IF NOT EXISTS kiosk_precio_opciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_config INT NOT NULL,
    nombre_opcion VARCHAR(100) NOT NULL,
    orden INT DEFAULT 0,
    activo BOOLEAN DEFAULT 1,

    -- Configuración de precio de la opción
    tipo_precio ENUM('id_bd', 'fijo') DEFAULT 'id_bd',

    -- Para precio por ID de BD
    id_servicio_particular INT DEFAULT NULL,
    id_servicio_club INT DEFAULT NULL,
    tabla_origen ENUM('servicio', 'examen') DEFAULT 'servicio',

    -- Para precio fijo
    precio_particular_fijo DECIMAL(10,2) DEFAULT NULL,
    precio_club_fijo DECIMAL(10,2) DEFAULT NULL,

    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (id_config) REFERENCES kiosk_especialidad_config(id) ON DELETE CASCADE,
    INDEX idx_config_orden (id_config, orden)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Categorías para secciones tipo examen (ej: Laboratorio)
CREATE TABLE IF NOT EXISTS kiosk_categoria_examenes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_config INT NOT NULL,
    nombre_categoria VARCHAR(100) NOT NULL,
    orden INT DEFAULT 0,
    activo BOOLEAN DEFAULT 1,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (id_config) REFERENCES kiosk_especialidad_config(id) ON DELETE CASCADE,
    INDEX idx_config_orden (id_config, orden)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Items de examen personalizados (para secciones tipo examen)
CREATE TABLE IF NOT EXISTS kiosk_item_examen (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_categoria INT DEFAULT NULL,
    id_config INT NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT DEFAULT NULL,

    -- Precios
    precio_particular DECIMAL(10,2) NOT NULL,
    precio_club DECIMAL(10,2) NOT NULL,

    orden INT DEFAULT 0,
    activo BOOLEAN DEFAULT 1,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (id_categoria) REFERENCES kiosk_categoria_examenes(id) ON DELETE CASCADE,
    FOREIGN KEY (id_config) REFERENCES kiosk_especialidad_config(id) ON DELETE CASCADE,
    INDEX idx_categoria_orden (id_categoria, orden),
    INDEX idx_config_orden (id_config, orden)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Historial de cambios (auditoría)
CREATE TABLE IF NOT EXISTS kiosk_config_historial (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tabla_afectada VARCHAR(50) NOT NULL,
    id_registro INT NOT NULL,
    accion ENUM('crear', 'actualizar', 'eliminar') NOT NULL,
    usuario VARCHAR(100) DEFAULT 'admin',
    datos_anteriores TEXT DEFAULT NULL,
    datos_nuevos TEXT DEFAULT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_tabla_registro (tabla_afectada, id_registro),
    INDEX idx_fecha (fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- DATOS INICIALES: Migrar configuración actual del PHP
-- =============================================================================

-- Medicina General (ID: 2)
INSERT INTO kiosk_especialidad_config (id_especialidad, activo, orden, tiene_opciones, tipo_seccion)
VALUES (2, 1, 1, 0, 'consulta');

SET @config_id = LAST_INSERT_ID();

INSERT INTO kiosk_precio_config (id_config, tipo_precio, id_servicio_particular, id_servicio_club, tabla_origen)
VALUES (@config_id, 'id_bd', 560, 668, 'servicio');

-- Pediatría (ID: 8)
INSERT INTO kiosk_especialidad_config (id_especialidad, activo, orden, tiene_opciones, tipo_seccion)
VALUES (8, 1, 2, 0, 'consulta');

SET @config_id = LAST_INSERT_ID();

INSERT INTO kiosk_precio_config (id_config, tipo_precio, id_servicio_particular, id_servicio_club, tabla_origen)
VALUES (@config_id, 'id_bd', 1417, 669, 'examen');

-- Ginecología con opciones (ID: 11)
INSERT INTO kiosk_especialidad_config (id_especialidad, activo, orden, tiene_opciones, tipo_seccion)
VALUES (11, 1, 3, 1, 'consulta');

SET @config_id = LAST_INSERT_ID();

INSERT INTO kiosk_precio_opciones (id_config, nombre_opcion, orden, tipo_precio, id_servicio_particular, id_servicio_club, tabla_origen)
VALUES
    (@config_id, 'Consulta Ginecológica', 1, 'id_bd', 675, 670, 'servicio'),
    (@config_id, 'Consulta Ginecológica + PAP', 2, 'id_bd', 698, 699, 'servicio');

-- Optometría con precio fijo (ID: 16)
INSERT INTO kiosk_especialidad_config (id_especialidad, activo, orden, tiene_opciones, tipo_seccion)
VALUES (16, 1, 4, 0, 'consulta');

SET @config_id = LAST_INSERT_ID();

INSERT INTO kiosk_precio_config (id_config, tipo_precio, precio_particular_fijo, precio_club_fijo)
VALUES (@config_id, 'fijo', 5.00, 0.00);

-- Laboratorio (ID: 21) - Sección tipo examen
INSERT INTO kiosk_especialidad_config (id_especialidad, activo, orden, tiene_opciones, tipo_seccion)
VALUES (21, 1, 5, 0, 'examen_lista');

-- Imagen (ID: 23) - Sección tipo examen
INSERT INTO kiosk_especialidad_config (id_especialidad, activo, orden, tiene_opciones, tipo_seccion)
VALUES (23, 1, 6, 0, 'examen_lista');

-- Obstetricia (ID: 26)
INSERT INTO kiosk_especialidad_config (id_especialidad, activo, orden, tiene_opciones, tipo_seccion)
VALUES (26, 1, 7, 0, 'consulta');

SET @config_id = LAST_INSERT_ID();

INSERT INTO kiosk_precio_config (id_config, tipo_precio, id_servicio_particular, id_servicio_club, tabla_origen)
VALUES (@config_id, 'id_bd', 585, 692, 'servicio');

-- Traumatología (ID: 27)
INSERT INTO kiosk_especialidad_config (id_especialidad, activo, orden, tiene_opciones, tipo_seccion)
VALUES (27, 1, 8, 0, 'consulta');

SET @config_id = LAST_INSERT_ID();

INSERT INTO kiosk_precio_config (id_config, tipo_precio, id_servicio_particular, id_servicio_club, tabla_origen)
VALUES (@config_id, 'id_bd', 665, 671, 'servicio');

-- Terapia del Lenguaje con opciones (ID: 66)
INSERT INTO kiosk_especialidad_config (id_especialidad, activo, orden, tiene_opciones, tipo_seccion)
VALUES (66, 1, 9, 1, 'consulta');

SET @config_id = LAST_INSERT_ID();

INSERT INTO kiosk_precio_opciones (id_config, nombre_opcion, orden, tipo_precio, id_servicio_particular, id_servicio_club, tabla_origen)
VALUES
    (@config_id, 'Primera Sesión', 1, 'id_bd', 797, 865, 'servicio'),
    (@config_id, 'Siguientes Sesiones', 2, 'id_bd', 682, 672, 'servicio');

-- Psicología Infantil con opciones (ID: 67)
INSERT INTO kiosk_especialidad_config (id_especialidad, activo, orden, tiene_opciones, tipo_seccion)
VALUES (67, 1, 10, 1, 'consulta');

SET @config_id = LAST_INSERT_ID();

INSERT INTO kiosk_precio_opciones (id_config, nombre_opcion, orden, tipo_precio, id_servicio_particular, id_servicio_club, tabla_origen)
VALUES
    (@config_id, 'Una Hora', 1, 'id_bd', 679, 673, 'servicio'),
    (@config_id, 'Media Hora', 2, 'id_bd', 919, 919, 'servicio');

-- Terapia Ocupacional con opciones (ID: 68)
INSERT INTO kiosk_especialidad_config (id_especialidad, activo, orden, tiene_opciones, tipo_seccion)
VALUES (68, 1, 11, 1, 'consulta');

SET @config_id = LAST_INSERT_ID();

INSERT INTO kiosk_precio_opciones (id_config, nombre_opcion, orden, tipo_precio, precio_particular_fijo, precio_club_fijo)
VALUES
    (@config_id, 'Primera Sesión', 1, 'fijo', 20.00, 28.00),
    (@config_id, 'Siguientes Sesiones', 2, 'id_bd', 683, 700);

UPDATE kiosk_precio_opciones
SET tabla_origen = 'servicio'
WHERE id_config = @config_id AND tipo_precio = 'id_bd';

-- Odontología (ID: 74)
INSERT INTO kiosk_especialidad_config (id_especialidad, activo, orden, tiene_opciones, tipo_seccion)
VALUES (74, 1, 12, 0, 'examen_lista');

SET @config_id = LAST_INSERT_ID();

INSERT INTO kiosk_precio_config (id_config, tipo_precio, id_servicio_particular, id_servicio_club, tabla_origen)
VALUES (@config_id, 'id_bd', 826, 826, 'servicio');

-- Terapia Física (ID: 76)
INSERT INTO kiosk_especialidad_config (id_especialidad, activo, orden, tiene_opciones, tipo_seccion)
VALUES (76, 1, 13, 0, 'consulta');

SET @config_id = LAST_INSERT_ID();

INSERT INTO kiosk_precio_config (id_config, tipo_precio, id_servicio_particular, id_servicio_club, tabla_origen)
VALUES (@config_id, 'id_bd', 622, 702, 'servicio');

-- Psicología Clínica con opciones (ID: 82)
INSERT INTO kiosk_especialidad_config (id_especialidad, activo, orden, tiene_opciones, tipo_seccion)
VALUES (82, 1, 14, 1, 'consulta');

SET @config_id = LAST_INSERT_ID();

INSERT INTO kiosk_precio_opciones (id_config, nombre_opcion, orden, tipo_precio, id_servicio_particular, id_servicio_club, tabla_origen)
VALUES
    (@config_id, 'Una Hora', 1, 'id_bd', 866, 859, 'servicio'),
    (@config_id, 'Media Hora', 2, 'id_bd', 680, 676, 'servicio');

-- Nutrición con opciones (ID: 91)
INSERT INTO kiosk_especialidad_config (id_especialidad, activo, orden, tiene_opciones, tipo_seccion)
VALUES (91, 1, 15, 1, 'consulta');

SET @config_id = LAST_INSERT_ID();

INSERT INTO kiosk_precio_opciones (id_config, nombre_opcion, orden, tipo_precio, id_servicio_particular, id_servicio_club, tabla_origen)
VALUES
    (@config_id, 'Primera Sesión', 1, 'id_bd', 796, 748, 'servicio'),
    (@config_id, 'Seguimiento', 2, 'id_bd', 867, 868, 'servicio');

-- Médico Familiar (ID: 92)
INSERT INTO kiosk_especialidad_config (id_especialidad, activo, orden, tiene_opciones, tipo_seccion)
VALUES (92, 1, 16, 0, 'consulta');

SET @config_id = LAST_INSERT_ID();

INSERT INTO kiosk_precio_config (id_config, tipo_precio, id_servicio_particular, id_servicio_club, tabla_origen)
VALUES (@config_id, 'id_bd', 803, 771, 'servicio');

-- Reumatología (ID: 99)
INSERT INTO kiosk_especialidad_config (id_especialidad, activo, orden, tiene_opciones, tipo_seccion)
VALUES (99, 1, 17, 0, 'consulta');

SET @config_id = LAST_INSERT_ID();

INSERT INTO kiosk_precio_config (id_config, tipo_precio, id_servicio_particular, id_servicio_club, tabla_origen)
VALUES (@config_id, 'id_bd', 869, 870, 'servicio');

-- =============================================================================
-- VIEWS ÚTILES PARA EL DASHBOARD
-- =============================================================================

-- Vista completa de configuración de especialidades
CREATE OR REPLACE VIEW v_kiosk_especialidades AS
SELECT
    kec.id,
    kec.id_especialidad,
    e.descEspecialidad AS nombre_especialidad,
    kec.activo,
    kec.orden,
    kec.imagen_personalizada,
    kec.mostrar_en_kiosco,
    kec.tiene_opciones,
    kec.tipo_seccion,
    kpc.tipo_precio,
    kpc.id_servicio_particular,
    kpc.id_servicio_club,
    kpc.precio_particular_fijo,
    kpc.precio_club_fijo,
    kpc.tabla_origen,
    (SELECT COUNT(*) FROM kiosk_precio_opciones WHERE id_config = kec.id AND activo = 1) AS num_opciones,
    kec.fecha_actualizacion
FROM kiosk_especialidad_config kec
JOIN especialidad e ON e.idEspecialidad = kec.id_especialidad
LEFT JOIN kiosk_precio_config kpc ON kpc.id_config = kec.id
ORDER BY kec.orden, e.descEspecialidad;

-- =============================================================================
-- PROCEDURES ÚTILES
-- =============================================================================

DELIMITER //

-- Procedure para reordenar especialidades
CREATE PROCEDURE sp_reordenar_especialidades(IN especialidad_ids TEXT)
BEGIN
    DECLARE i INT DEFAULT 1;
    DECLARE id_esp INT;
    DECLARE done INT DEFAULT FALSE;
    DECLARE cur CURSOR FOR
        SELECT CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(especialidad_ids, ',', numbers.n), ',', -1) AS UNSIGNED) AS id
        FROM (SELECT 1 n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5
              UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10
              UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15
              UNION SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION SELECT 20) numbers
        WHERE n <= 1 + LENGTH(especialidad_ids) - LENGTH(REPLACE(especialidad_ids, ',', ''));

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    OPEN cur;

    read_loop: LOOP
        FETCH cur INTO id_esp;
        IF done THEN
            LEAVE read_loop;
        END IF;

        UPDATE kiosk_especialidad_config SET orden = i WHERE id = id_esp;
        SET i = i + 1;
    END LOOP;

    CLOSE cur;
END//

DELIMITER ;

-- =============================================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- =============================================================================

-- Este schema permite:
-- 1. ✅ Gestionar especialidades sin tocar código
-- 2. ✅ Configurar precios por ID de BD o valores fijos
-- 3. ✅ Crear opciones múltiples (ej: "Una Hora", "Media Hora")
-- 4. ✅ Subir imágenes personalizadas
-- 5. ✅ Reordenar visualización con drag & drop
-- 6. ✅ Activar/desactivar servicios
-- 7. ✅ Auditoría de cambios
-- 8. ✅ Secciones tipo examen (Laboratorio, Imagen, etc.)

-- Para el dashboard web, se crearán APIs REST que consulten estas tablas
