const { sesiones, roles } = require('./db/index');

// Compatibilidad: exportamos un objeto vacío para que los imports existentes no fallen
const portalSessions = new Map();

async function requirePortalAuth(req, res) {
    const pt = (req.headers['x-portal-token'] ?? '').trim();
    if (!pt) { res.status(401).json({ error: 'No autorizado.' }); return null; }

    const row = await sesiones.findPortalSessionByToken(pt);
    if (!row) {
        res.status(401).json({ error: 'Sesión expirada. Vuelve a iniciar sesión.' });
        return null;
    }
    return { presupuestoToken: row.presupuesto_token };
}

async function requireAuth(req, res) {
    const token = (req.cookies?.av_token ?? req.headers['x-token'] ?? '').trim();
    if (!token) { res.status(401).json({ error: 'No autenticado.' }); return null; }
    const user = await sesiones.findUserBySessionToken(token);
    if (!user) { res.status(401).json({ error: 'Sesión inválida o expirada.' }); return null; }
    return user;
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
    const permisos = await roles.getPermisosByName(rol);
    if (permisos) return permisos;
    // Fallback solo para roles built-in que no estén en la tabla
    return rol === 'administrador'
        ? ['Dashboard','Mensajes','Historial','Blog','Servicios','Analíticas','Usuarios','Contexto IA']
        : [];
}

module.exports = { portalSessions, requirePortalAuth, requireAuth, requireAdmin, getPermisos };
