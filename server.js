require('dotenv').config();

// ── Validación de variables de entorno críticas ───────────────────────────────
const REQUIRED_ENV = ['DB_HOST', 'DB_USER', 'DB_NAME'];
const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length) {
    console.error(`ERROR: Faltan variables de entorno obligatorias: ${missing.join(', ')}`);
    console.error('Copia .env.example a .env y rellena los valores.');
    process.exit(1);
}

const express      = require('express');
const cors         = require('cors');
const path         = require('path');
const pool         = require('./db');
const rateLimit    = require('express-rate-limit');
const cookieParser = require('cookie-parser');

const app  = express();
const PORT = process.env.PORT || 3000;

// Confiar en el proxy Nginx para obtener la IP real del cliente.
// Solo en producción — en desarrollo evita que se pueda spoofear la IP
// con el header X-Forwarded-For y eludir el rate limiting.
if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);

// ── CORS ──────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:4173,http://127.0.0.1:5500,http://localhost:5500').split(',').map(s => s.trim());
// En producción, establece ALLOWED_ORIGINS en .env con tu dominio real (ej. https://avantservice.es)
app.use(cors({
    origin: (origin, cb) => {
        if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
        cb(new Error(`CORS: origen no permitido: ${origin}`));
    },
    credentials: true,
}));

// ── Cabeceras de seguridad ────────────────────────────────────────────────────
app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
    // Solo activo en HTTPS; en desarrollo no hace daño pero no tiene efecto
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
});

// ── Body / cookie parser (antes del CSRF) ─────────────────────────────────────
app.use(cookieParser());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// ── Protección CSRF (double-submit cookie) ────────────────────────────────────
// Los endpoints de mutación requieren el header X-CSRF-Token con el valor de la
// cookie av_csrf (no-httpOnly), impidiendo ataques cross-site con credenciales.
const CSRF_SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
// /api/presupuesto/aceptar es llamado desde el portal del cliente (portal.html),
// que no tiene sesión de admin ni cookie av_csrf. La seguridad recae en el token
// de presupuesto (256 bits de entropía). Añadimos rate limit específico abajo.
const CSRF_EXEMPT = new Set(['/api/auth/login', '/api/portal/login', '/contacto', '/api/diy', '/api/presupuesto/aceptar']);

app.use((req, res, next) => {
    if (CSRF_SAFE_METHODS.has(req.method)) return next();
    if (CSRF_EXEMPT.has(req.path))         return next();
    // Endpoints públicos de la tienda — sin sesión de admin, no aplican CSRF.
    if (req.path.startsWith('/backendstore/')) return next();

    const cookieToken = req.cookies?.av_csrf ?? '';
    const headerToken = (req.headers['x-csrf-token'] ?? '').trim();

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
        return res.status(403).json({ error: 'Token CSRF inválido.' });
    }
    next();
});

// ── Rate limiting global ──────────────────────────────────────────────────────
const globalLimiter = rateLimit({
    windowMs: 60_000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Demasiadas peticiones. Espera un momento.' },
});

const loginLimiter = rateLimit({
    windowMs: 60_000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Demasiados intentos. Espera un minuto.' },
});

const contactoLimiter = rateLimit({
    windowMs: 60_000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Demasiados envíos. Espera un momento.' },
});

const trackLimiter = rateLimit({
    windowMs: 60_000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests.' },
});

// Limita aceptaciones/rechazos de presupuesto por IP — evita enumeración de tokens
const presupuestoAceptarLimiter = rateLimit({
    windowMs: 15 * 60_000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Demasiados intentos. Espera unos minutos.' },
});

app.use(globalLimiter);

// ── Static ────────────────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/backendstore/img', express.static(path.join(__dirname, 'uploads', 'store')));
app.get('/portal.html', (_req, res) => res.sendFile(path.join(__dirname, 'portal.html')));

// ── Rutas ─────────────────────────────────────────────────────────────────────
//
// Routers montados en /api/contactos, /api/chat, etc. usan sub-rutas relativas.
// Routers montados en /api cubren múltiples prefijos (/api/presupuesto,
// /api/portal, /api/analytics, /api/track, /api/rag, /api/config).
// formularios.js registra /contacto y /api/diy directamente desde la raíz.
//
app.use('/api/contactos', require('./routes/contactos'));
app.use('/api',           require('./routes/presupuestos'));
app.use('/api/chat',      require('./routes/chat'));
app.use('/api/blog',      require('./routes/blog'));
app.use('/api/servicios',       require('./routes/servicios'));
app.use('/api/tipos_problema',  require('./routes/tipos_problema'));
app.use('/api/track',               trackLimiter);
app.use('/api/presupuesto/aceptar', presupuestoAceptarLimiter);
app.use('/api',           require('./routes/analytics'));
app.use('/api',           require('./routes/rag'));
app.use('/api/averias',   require('./routes/averias'));
app.use('/api/roles',     require('./routes/roles'));
app.use('/api/auth/login',    loginLimiter);
app.use('/api/portal/login', loginLimiter);
app.use('/api/auth',         require('./routes/auth'));
app.use('/contacto',      contactoLimiter);
app.use('/api/diy',       contactoLimiter);
app.use('/backendstore',  require('./routes/store'));
app.use('/',              require('./routes/formularios'));

// ── 404 y error handlers ──────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ error: 'Recurso no encontrado.' });
});

app.use((err, req, res, _next) => {
    console.error(err);
    const msg = err.userFacing ? err.message : 'Error interno del servidor.';
    res.status(500).json({ error: msg });
});

// ── Migraciones y arranque ────────────────────────────────────────────────────
async function runMigrations() {
    const conn = await pool.getConnection();
    try {
        try {
            const fs = require('fs');
            const raw = fs.readFileSync(path.join(__dirname, 'sql', 'store_schema.sql'), 'utf8');
            const cleaned = raw.split('\n').filter(l => !l.trim().startsWith('--')).join('\n');
            const stmts = cleaned.split(/;\s*[\r\n]/).map(s => s.trim()).filter(Boolean);
            for (const s of stmts) await conn.query(s);
        } catch (e) { console.warn('Migration store_schema:', e.message); }


        try {
            const [cols] = await conn.query(
                `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
                 WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='rag_knowledge' AND COLUMN_NAME='tiene_vector'`
            );
            if (!cols.length)
                await conn.query(`ALTER TABLE rag_knowledge ADD COLUMN tiene_vector TINYINT(1) NOT NULL DEFAULT 0`);
        } catch (e) { console.warn('Migration rag_knowledge:', e.message); }

        try {
            await conn.query(`
                CREATE TABLE IF NOT EXISTS app_config (
                    clave VARCHAR(64) PRIMARY KEY,
                    valor TEXT NOT NULL
                )
            `);
        } catch (e) { console.warn('Migration app_config:', e.message); }

        try {
            await conn.query(`
                CREATE TABLE IF NOT EXISTS portal_sesiones (
                    token            VARCHAR(64)  PRIMARY KEY,
                    presupuesto_token VARCHAR(64) NOT NULL,
                    expires_at       DATETIME     NOT NULL,
                    created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_expires (expires_at)
                )
            `);
        } catch (e) { console.warn('Migration portal_sesiones:', e.message); }

        try {
            await conn.query(`
                CREATE TABLE IF NOT EXISTS servicios (
                    id          INT AUTO_INCREMENT PRIMARY KEY,
                    nombre      VARCHAR(255) NOT NULL,
                    descripcion TEXT,
                    icono       VARCHAR(64)  DEFAULT 'wrench',
                    imagen      VARCHAR(512),
                    orden       INT          DEFAULT 0,
                    activo      TINYINT(1)   DEFAULT 1,
                    subservicios JSON,
                    creado_en   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
                    actualizado TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            `);
            const [[{ c }]] = await conn.query('SELECT COUNT(*) AS c FROM servicios');
            if (c === 0) {
                const defaults = [
                    {
                        nombre: 'Televisores',
                        descripcion: 'Reparamos todo tipo de televisores: LED, OLED, QLED y Smart TV con piezas originales y garantía de servicio.',
                        icono: 'tv', imagen: '', orden: 1,
                        subservicios: [
                            { nombre: 'Problemas de Imagen', descripcion: 'Pantalla negra, líneas, colores o brillo incorrectos.', icono: 'monitor', es_directo: false, tipo_problema: '', opciones: [{ texto: 'Pantalla negra con sonido', tipo_problema: 'fallo-electrico' }, { texto: 'Líneas verticales u horizontales', tipo_problema: 'fallo-electrico' }, { texto: 'Falta de brillo (backlight)', tipo_problema: 'fallo-electrico' }, { texto: 'Colores distorsionados o manchas', tipo_problema: 'fallo-electrico' }, { texto: 'Imagen parpadeante o inestable', tipo_problema: 'fallo-electrico' }] },
                            { nombre: 'Problemas de Encendido', descripcion: 'No enciende, LED parpadea o se apaga solo.', icono: 'zap', es_directo: true, tipo_problema: 'fallo-electrico', opciones: [] },
                            { nombre: 'Software y Conectividad', descripcion: 'Firmware, Wi-Fi, apps o errores de Smart TV.', icono: 'wifi', es_directo: false, tipo_problema: '', opciones: [{ texto: 'Actualización de firmware fallida', tipo_problema: 'error-software' }, { texto: 'Wi-Fi no conecta o se desconecta', tipo_problema: 'error-software' }, { texto: 'Apps que no cargan (Netflix, YouTube…)', tipo_problema: 'error-software' }] },
                        ]
                    },
                    {
                        nombre: 'Electrodomésticos', descripcion: 'Servicio técnico especializado en lavadoras, frigoríficos, hornos, lavavajillas y más, a domicilio.', icono: 'washing-machine', imagen: '', orden: 2,
                        subservicios: [
                            { nombre: 'Lavadoras y Secadoras', descripcion: 'Gomas, bombas, motor, centrifugado y placa base.', icono: 'washing-machine', es_directo: false, tipo_problema: '', opciones: [{ texto: 'Ruidos o vibraciones anormales', tipo_problema: 'ruido-extrano' }, { texto: 'Fuga de agua', tipo_problema: 'fuga-agua' }, { texto: 'No centrifuga o no termina el ciclo', tipo_problema: 'fallo-electrico' }, { texto: 'Error en panel o placa base', tipo_problema: 'fallo-electrico' }] },
                            { nombre: 'Frigoríficos y Congeladores', descripcion: 'Gas, compresor, escarcha y termostato digital.', icono: 'refrigerator', es_directo: false, tipo_problema: '', opciones: [{ texto: 'No enfría correctamente', tipo_problema: 'fuga-agua' }, { texto: 'Acumulación de escarcha (No Frost)', tipo_problema: 'fallo-electrico' }, { texto: 'Ruido excesivo del compresor', tipo_problema: 'ruido-extrano' }] },
                            { nombre: 'Hornos y Vitrocerámicas', descripcion: 'Resistencias, selectores, vidrios e inducción.', icono: 'flame', es_directo: true, tipo_problema: 'fallo-electrico', opciones: [] },
                        ]
                    },
                    {
                        nombre: 'Calderas y Calefacción', descripcion: 'Reparación y mantenimiento de calderas y sistemas de calefacción. Revisiones preventivas y detección de fugas.', icono: 'flame', imagen: '', orden: 3,
                        subservicios: [
                            { nombre: 'Calderas de Gas y Gasoil', descripcion: 'Quemadores, bomba, vaso de expansión y panel.', icono: 'fuel', es_directo: false, tipo_problema: '', opciones: [{ texto: 'Fuga de agua o gas', tipo_problema: 'fuga-agua' }, { texto: 'Caldera no enciende o da error', tipo_problema: 'fallo-electrico' }, { texto: 'Mantenimiento anual preventivo', tipo_problema: 'otros' }] },
                            { nombre: 'Radiadores y Circuitos', descripcion: 'Purgado, ruidos, fugas y equilibrado de calor.', icono: 'waves', es_directo: true, tipo_problema: 'ruido-extrano', opciones: [] },
                            { nombre: 'Termostatos Inteligentes', descripcion: 'Instalación y configuración Wifi.', icono: 'thermometer', es_directo: true, tipo_problema: 'error-software', opciones: [] },
                        ]
                    },
                ];
                for (const s of defaults) {
                    await conn.query(
                        'INSERT INTO servicios (nombre, descripcion, icono, imagen, orden, activo, subservicios) VALUES (?,?,?,?,?,1,?)',
                        [s.nombre, s.descripcion, s.icono, s.imagen, s.orden, JSON.stringify(s.subservicios)]
                    );
                }
            } else {
                // Actualizar servicios existentes que tengan subservicios vacíos
                for (const s of [
                    { nombre: 'Televisores', subservicios: [
                        { nombre: 'Problemas de Imagen', descripcion: 'Pantalla negra, líneas, colores o brillo incorrectos.', icono: 'monitor', es_directo: false, tipo_problema: '', opciones: [{ texto: 'Pantalla negra con sonido', tipo_problema: 'fallo-electrico' }, { texto: 'Líneas verticales u horizontales', tipo_problema: 'fallo-electrico' }, { texto: 'Falta de brillo (backlight)', tipo_problema: 'fallo-electrico' }, { texto: 'Colores distorsionados o manchas', tipo_problema: 'fallo-electrico' }] },
                        { nombre: 'Problemas de Encendido', descripcion: 'No enciende, LED parpadea o se apaga solo.', icono: 'zap', es_directo: true, tipo_problema: 'fallo-electrico', opciones: [] },
                        { nombre: 'Software y Conectividad', descripcion: 'Firmware, Wi-Fi, apps o errores de Smart TV.', icono: 'wifi', es_directo: false, tipo_problema: '', opciones: [{ texto: 'Actualización de firmware fallida', tipo_problema: 'error-software' }, { texto: 'Wi-Fi no conecta o se desconecta', tipo_problema: 'error-software' }, { texto: 'Apps que no cargan (Netflix, YouTube…)', tipo_problema: 'error-software' }] },
                    ]},
                    { nombre: 'Electrodomésticos', subservicios: [
                        { nombre: 'Lavadoras y Secadoras', descripcion: 'Gomas, bombas, motor, centrifugado y placa base.', icono: 'washing-machine', es_directo: false, tipo_problema: '', opciones: [{ texto: 'Ruidos o vibraciones anormales', tipo_problema: 'ruido-extrano' }, { texto: 'Fuga de agua', tipo_problema: 'fuga-agua' }, { texto: 'No centrifuga o no termina el ciclo', tipo_problema: 'fallo-electrico' }, { texto: 'Error en panel o placa base', tipo_problema: 'fallo-electrico' }] },
                        { nombre: 'Frigoríficos y Congeladores', descripcion: 'Gas, compresor, escarcha y termostato digital.', icono: 'refrigerator', es_directo: false, tipo_problema: '', opciones: [{ texto: 'No enfría correctamente', tipo_problema: 'fuga-agua' }, { texto: 'Acumulación de escarcha (No Frost)', tipo_problema: 'fallo-electrico' }, { texto: 'Ruido excesivo del compresor', tipo_problema: 'ruido-extrano' }] },
                        { nombre: 'Hornos y Vitrocerámicas', descripcion: 'Resistencias, selectores, vidrios e inducción.', icono: 'flame', es_directo: true, tipo_problema: 'fallo-electrico', opciones: [] },
                    ]},
                    { nombre: 'Calderas y Calefacción', subservicios: [
                        { nombre: 'Calderas de Gas y Gasoil', descripcion: 'Quemadores, bomba, vaso de expansión y panel.', icono: 'fuel', es_directo: false, tipo_problema: '', opciones: [{ texto: 'Fuga de agua o gas', tipo_problema: 'fuga-agua' }, { texto: 'Caldera no enciende o da error', tipo_problema: 'fallo-electrico' }, { texto: 'Mantenimiento anual preventivo', tipo_problema: 'otros' }] },
                        { nombre: 'Radiadores y Circuitos', descripcion: 'Purgado, ruidos, fugas y equilibrado de calor.', icono: 'waves', es_directo: true, tipo_problema: 'ruido-extrano', opciones: [] },
                        { nombre: 'Termostatos Inteligentes', descripcion: 'Instalación y configuración Wifi.', icono: 'thermometer', es_directo: true, tipo_problema: 'error-software', opciones: [] },
                    ]},
                ]) {
                    const [[row]] = await conn.query('SELECT subservicios FROM servicios WHERE nombre=?', [s.nombre]);
                    if (row) {
                        let subs = [];
                        try {
                            const raw = row.subservicios;
                            subs = raw ? (typeof raw === 'string' ? JSON.parse(raw.trim()) : raw) : [];
                        } catch (_) { /* JSON inválido — se actualiza */ }
                        if (!Array.isArray(subs) || !subs.length) {
                            await conn.query('UPDATE servicios SET subservicios=? WHERE nombre=?', [JSON.stringify(s.subservicios), s.nombre]);
                        }
                    }
                }
            }
        } catch (e) { console.warn('Migration servicios:', e.message); }

        try {
            await conn.query(`
                CREATE TABLE IF NOT EXISTS tipos_problema (
                    id     INT AUTO_INCREMENT PRIMARY KEY,
                    nombre VARCHAR(64) NOT NULL UNIQUE
                )
            `);
            const [[{ c }]] = await conn.query('SELECT COUNT(*) AS c FROM tipos_problema');
            if (c === 0) {
                const defaults = [
                    'fallo-electrico', 'fallo-mecanico', 'fallo-software',
                    'no-enciende', 'no-enfria', 'no-calienta',
                    'fuga-agua', 'ruido-anomalo', 'pantalla-rota',
                    'problemas-imagen', 'problemas-sonido', 'otros',
                ];
                for (const nombre of defaults)
                    await conn.query('INSERT IGNORE INTO tipos_problema (nombre) VALUES (?)', [nombre]);
            }
        } catch (e) { console.warn('Migration tipos_problema:', e.message); }

        try {
            await conn.query(`
                CREATE TABLE IF NOT EXISTS averias_resueltas (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    chat_token VARCHAR(255) NOT NULL,
                    es_averia TINYINT(1) NOT NULL DEFAULT 1,
                    marca VARCHAR(255),
                    tipo_averia VARCHAR(255),
                    modelo VARCHAR(255),
                    funcion VARCHAR(255),
                    resumen TEXT,
                    descripcion TEXT,
                    solucion TEXT,
                    precio_reparacion DECIMAL(10,2),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE KEY uq_token (chat_token(191))
                )
            `);
        } catch (e) { console.warn('Migration averias_resueltas:', e.message); }
    } finally {
        conn.release();
    }
}

// Limpia sesiones expiradas cada hora y datos de analíticas con más de 90 días
const ANALYTICS_RETENTION_DAYS = parseInt(process.env.ANALYTICS_RETENTION_DAYS || '90');
setInterval(async () => {
    try {
        await pool.query('DELETE FROM sesiones        WHERE expires_at < NOW()');
        await pool.query('DELETE FROM portal_sesiones WHERE expires_at < NOW()');
        if (ANALYTICS_RETENTION_DAYS > 0) {
            await pool.query('DELETE FROM av_events    WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)', [ANALYTICS_RETENTION_DAYS]);
            await pool.query('DELETE FROM av_pageviews WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)', [ANALYTICS_RETENTION_DAYS]);
            await pool.query('DELETE FROM av_sessions  WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)', [ANALYTICS_RETENTION_DAYS]);
        }
    } catch (e) { console.warn('Cleanup error:', e.message); }
}, 60 * 60 * 1000);

app.listen(PORT, () => console.log(`AvantService API running on http://localhost:${PORT}`))
    .on('error', (err) => {
        if (err.code === 'EADDRINUSE') console.error(`Puerto ${PORT} ya en uso. ¿Hay otra instancia corriendo?`);
        else console.error(err);
        process.exit(1);
    });

runMigrations().catch(err => console.warn('Migrations skipped:', err.message));
