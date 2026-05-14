require('dotenv').config();

// ── Validación de variables de entorno críticas ───────────────────────────────
// Aceptamos DATABASE_URL (Railway Postgres) o las variables sueltas.
if (!process.env.DATABASE_URL) {
    const REQUIRED_ENV = ['DB_HOST', 'DB_USER', 'DB_NAME'];
    const missing = REQUIRED_ENV.filter(k => !process.env[k]);
    if (missing.length) {
        console.error(`ERROR: Faltan variables de entorno obligatorias: DATABASE_URL o (${missing.join(', ')})`);
        console.error('Copia .env.example a .env y rellena los valores.');
        process.exit(1);
    }
}

const express      = require('express');
const cors         = require('cors');
const path         = require('path');
const rateLimit    = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const { sesiones, maintenance, migrations } = require('./db/index');

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
const CSRF_EXEMPT = new Set(['/api/auth/login', '/api/portal/login', '/contacto', '/api/diy', '/api/presupuesto/aceptar', '/api/track']);

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

// ── Health check (usado por Railway) ─────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ── Static ────────────────────────────────────────────────────────────────────

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
// Las migraciones viven en db/migrations.js (sintaxis PostgreSQL).
const runMigrations = migrations.runMigrations;

// Limpia sesiones expiradas cada hora y datos de analíticas con más de N días
const ANALYTICS_RETENTION_DAYS = parseInt(process.env.ANALYTICS_RETENTION_DAYS || '90');
setInterval(async () => {
    try {
        await sesiones.purgeExpiredSessions();
        await sesiones.purgeExpiredPortalSessions();
        await maintenance.purgeAnalyticsOlderThan(ANALYTICS_RETENTION_DAYS);
    } catch (e) { console.warn('Cleanup error:', e.message); }
}, 60 * 60 * 1000);

app.listen(PORT, () => console.log(`AvantService API running on http://localhost:${PORT}`))
    .on('error', (err) => {
        if (err.code === 'EADDRINUSE') console.error(`Puerto ${PORT} ya en uso. ¿Hay otra instancia corriendo?`);
        else console.error(err);
        process.exit(1);
    });

runMigrations().catch(err => console.warn('Migrations skipped:', err.message));
