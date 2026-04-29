USE backendavant;
ALTER TABLE contactos ADD COLUMN IF NOT EXISTS dificultad ENUM('facil','medio','dificil') DEFAULT NULL;
