-- Tabla de artículos del blog para AvantService
CREATE TABLE IF NOT EXISTS `blog_posts` (
    `id`          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `titulo`      VARCHAR(255)  NOT NULL,
    `slug`        VARCHAR(255)  NOT NULL UNIQUE,
    `categoria`   ENUM('Electrodomésticos','Televisores','Calderas','General') NOT NULL DEFAULT 'General',
    `resumen`     TEXT          NOT NULL,
    `contenido`   LONGTEXT      NOT NULL,
    `emoji`       VARCHAR(10)   NOT NULL DEFAULT '🛠️',
    `destacado`   TINYINT(1)    NOT NULL DEFAULT 0,
    `publicado`   TINYINT(1)    NOT NULL DEFAULT 1,
    `fecha`       DATE          NOT NULL,
    `creado_en`   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `actualizado` DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Artículos de ejemplo
INSERT INTO `blog_posts` (`titulo`, `slug`, `categoria`, `resumen`, `contenido`, `emoji`, `destacado`, `fecha`) VALUES
(
    '5 señales de que tu lavadora necesita revisión urgente',
    'senales-lavadora-revision-urgente',
    'Electrodomésticos',
    'Ruidos inusuales, fugas de agua o programas que no terminan son síntomas que no debes ignorar. Te explicamos qué significan y qué hacer.',
    '<p>Una lavadora que empieza a fallar suele avisarte antes de romperse del todo. Estos son los cinco síntomas más habituales:</p><ul><li><strong>Ruidos metálicos o golpes:</strong> pueden indicar que el tambor tiene una pieza suelta o que los amortiguadores están desgastados.</li><li><strong>Fugas de agua:</strong> revisa juntas y mangueras. Si la fuga viene del tambor, requiere técnico.</li><li><strong>Vibraciones excesivas:</strong> posible desequilibrio del tambor o patas desniveladas.</li><li><strong>Programas que no terminan:</strong> fallo en la electrónica o en la sonda de temperatura.</li><li><strong>Olor a quemado:</strong> llama a un técnico de inmediato, puede ser el motor.</li></ul>',
    '🧺',
    1,
    '2026-04-10'
),
(
    '¿Por qué mi Smart TV va lento? Causas y soluciones',
    'smart-tv-lento-causas-soluciones',
    'Televisores',
    'Con el tiempo los televisores inteligentes pueden volverse lentos. Descubre por qué ocurre y cómo recuperar el rendimiento sin necesidad de cambiar el aparato.',
    '<p>El rendimiento de un Smart TV se degrada con el uso. Las causas más frecuentes son:</p><ul><li><strong>Memoria RAM saturada:</strong> demasiadas apps instaladas. Desinstala las que no uses.</li><li><strong>Software desactualizado:</strong> actualiza el firmware desde los ajustes del televisor.</li><li><strong>Caché acumulada:</strong> limpia la caché de las aplicaciones periódicamente.</li><li><strong>Conexión WiFi débil:</strong> usa cable Ethernet si es posible para mejor estabilidad.</li></ul><p>Si tras estos pasos sigue lento, puede ser un problema de hardware que requiere revisión técnica.</p>',
    '📺',
    0,
    '2026-04-05'
),
(
    'Mantenimiento anual de calderas: qué incluye y por qué importa',
    'mantenimiento-anual-calderas',
    'Calderas',
    'Una revisión anual puede evitar averías costosas en invierno y garantizar la seguridad de toda la familia.',
    '<p>La revisión anual de la caldera es obligatoria en muchas comunidades autónomas y, sobre todo, es esencial para tu seguridad. Esto es lo que comprueba un técnico:</p><ul><li>Estado del quemador y electrodo de encendido</li><li>Presión del circuito hidráulico</li><li>Funcionamiento del termostato y válvulas de seguridad</li><li>Niveles de emisiones de CO₂</li><li>Estado de la chimenea o salida de humos</li></ul><p>Una caldera bien mantenida consume hasta un 15% menos de gas.</p>',
    '🔥',
    0,
    '2026-03-28'
);
