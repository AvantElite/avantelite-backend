const crypto = require('crypto');
const bcrypt  = require('bcryptjs');
const pool    = require('./db');

// ── Portal sessions (customer chat auth) — persistidas en BD ─────────────────
// La tabla portal_sesiones se crea automáticamente en runMigrations() (server.js).

// Compatibilidad: exportamos un objeto vacío para que los imports existentes no fallen
const portalSessions = new Map();

async function requirePortalAuth(req, res) {
    const pt = (req.headers['x-portal-token'] ?? '').trim();
    if (!pt) { res.status(401).json({ error: 'No autorizado.' }); return null; }

    const [rows] = await pool.query(
        'SELECT presupuesto_token FROM portal_sesiones WHERE token=? AND expires_at > NOW() LIMIT 1',
        [pt]
    );
    if (!rows.length) {
        res.status(401).json({ error: 'Sesión expirada. Vuelve a iniciar sesión.' });
        return null;
    }
    return { presupuestoToken: rows[0].presupuesto_token };
}

async function requireAuth(req, res) {
    const token = (req.cookies?.av_token ?? req.headers['x-token'] ?? '').trim();
    if (!token) { res.status(401).json({ error: 'No autenticado.' }); return null; }
    const [rows] = await pool.query(
        'SELECT u.* FROM sesiones s JOIN usuarios u ON u.id=s.user_id WHERE s.token=? AND s.expires_at > NOW() LIMIT 1',
        [token]
    );
    if (!rows.length) { res.status(401).json({ error: 'Sesión inválida o expirada.' }); return null; }
    return rows[0];
}

async function requireAdmin(req, res) {
    const user = await requireAuth(req, res);
    if (!user) return null;
    if (user.rol !== 'administrador') {
        res.status(403).json({ error: 'Acceso restringido a administradores.' });
        return null;
    }
    return user;
}

async function getPermisos(rol) {
    const [rows] = await pool.query('SELECT permisos FROM roles WHERE nombre=? LIMIT 1', [rol]);
    if (rows.length) { try { return JSON.parse(rows[0].permisos); } catch { /* fallback */ } }
    return rol === 'administrador'
        ? ['Dashboard','Mensajes','Historial','Blog','Servicios','Analíticas','Usuarios','Contexto IA']
        : ['Mensajes','Historial'];
}

module.exports = { portalSessions, requirePortalAuth, requireAuth, requireAdmin, getPermisos };
