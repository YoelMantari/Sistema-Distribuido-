-- Script para crear la base de datos y tablas en PostgreSQL (ventas_db)

-- Crear tabla principal de clientes
CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(100) NOT NULL UNIQUE,
    clave VARCHAR(100) NOT NULL,
    dni CHAR(8) NOT NULL,
    telefono VARCHAR(15)
);

-- Crear tabla intermedia de “amigos” (relación muchos a muchos)
CREATE TABLE IF NOT EXISTS amigos (
    cliente_id INT NOT NULL,
    amigo_id INT NOT NULL,
    PRIMARY KEY (cliente_id, amigo_id),
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    FOREIGN KEY (amigo_id) REFERENCES clientes(id) ON DELETE CASCADE
);
