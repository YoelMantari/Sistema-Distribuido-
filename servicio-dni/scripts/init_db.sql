-- Script para inicializar la base de datos MySQL 'dni_db' con la tabla padron_dni
CREATE TABLE IF NOT EXISTS padron_dni (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dni CHAR(8) NOT NULL UNIQUE,
    nombre VARCHAR(100),
    apellidos VARCHAR(100),
    lugar_nacimiento VARCHAR(100),
    ubigeo CHAR(6),
    direccion VARCHAR(200)
);

-- Opcionalmente, puedes insertar datos de prueba:
-- INSERT INTO padron_dni (dni, nombre, apellidos, lugar_nacimiento, ubigeo, direccion)
-- VALUES 
--   ('20453629','Fulano','Pérez','Lima','150101','Av. Siempre Viva 123'),
--   ('87654321','Rosita','Gómez','Lima','150102','Calle Falsa 456'),
--   ('12345678','Juancito','Ruiz','Cusco','080101','Calle Inca 789');
