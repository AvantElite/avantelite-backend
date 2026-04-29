USE backendavant;

CREATE TABLE IF NOT EXISTS presupuestos (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  contacto_id   INT NOT NULL,
  token         VARCHAR(64) NOT NULL UNIQUE,
  lineas        JSON NOT NULL,
  total         DECIMAL(10,2) NOT NULL,
  mensaje       TEXT,
  notas         TEXT,
  estado        ENUM('pendiente','aceptado','rechazado') NOT NULL DEFAULT 'pendiente',
  fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_respuesta DATETIME NULL,
  FOREIGN KEY (contacto_id) REFERENCES contactos(id) ON DELETE CASCADE
);
