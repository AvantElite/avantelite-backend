CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  permisos JSON NOT NULL
);

INSERT INTO roles (nombre, permisos)
VALUES ('administrador', '["Dashboard","Mensajes","Historial","Blog","Servicios","Analíticas","Usuarios","Contexto IA"]')
ON DUPLICATE KEY UPDATE permisos=VALUES(permisos);
