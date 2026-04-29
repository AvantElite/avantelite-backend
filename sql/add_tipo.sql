USE backendavant;
ALTER TABLE contactos ADD COLUMN IF NOT EXISTS tipo ENUM('formulario','diy') NOT NULL DEFAULT 'formulario';
