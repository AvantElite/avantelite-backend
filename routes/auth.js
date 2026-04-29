const crypto  = require('crypto');
const bcrypt  = require('bcryptjs');
const { Router } = require('express');
const pool    = require('../db');
const { asyncHandler }              = require('../helpers');
const { requireAuth, requireAdmin, getPermisos } = require('../auth');

const router = Router();

const SESSION_MAX_AGE = 8 * 3600 * 1000; // 8 horas

const COOKIE_OPTS = {
    httpOnly: true,
    sameSite: 'lax',
    secure:   process.env.NODE_ENV === 'production',
    maxAge:   SESSION_MAX_AGE,
    path:     '/',
};

// Cookie CSRF: NO httpOnly para que el frontend pueda leerla y enviarla como header
const CSRF_COOKIE_OPTS = {
    httpOnly: false,
    sameSite: 'lax',
    secure:   process.env.NODE_ENV === 'production',
    maxAge:   SESSION_MAX_AGE,
    path:     '/',
};

router.post('/login', asyncHandler(async (req, res) => {
    const { email='', password='' } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos.' });

    const [rows] = await pool.query('SELECT * FROM usuarios WHERE email=? LIMIT 1', [email.toLowerCase()]);
    if (!rows.length) return res.json({ success: false, error: 'Credenciales incorrectas.' });

    const user        = rows[0];
    const pw          = String(user.password ?? '');
    const isPhpHash   = pw.startsWith('$2y$');
    const hashToCheck = isPhpHash ? pw.replace(/^\$2y\$/, '$2a$') : pw;
    const valid       = await bcrypt.compare(password, hashToCheck);
    if (!valid) return res.json({ success: false, error: 'Credenciales incorrectas.' });

    const token     = crypto.randomBytes(32).toString('hex');
    const csrfToken = crypto.randomBytes(32).toString('hex');
    const expires   = new Date(Date.now() + SESSION_MAX_AGE);
    await pool.query('INSERT INTO sesiones (user_id,token,expires_at) VALUES (?,?,?)', [user.id, token, expires]);

    res.cookie('av_token', token, COOKIE_OPTS);
    res.cookie('av_csrf',  csrfToken, CSRF_COOKIE_OPTS);

    const permisos = await getPermisos(user.rol);
    res.json({
        success: true,
        user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol, permisos },
    });
}));

router.get('/me', asyncHandler(async (req, res) => {
    const tkn = (req.cookies?.av_token ?? req.headers['x-token'] ?? '').trim();
    if (!tkn) return res.json({ user: null });
    const [rows] = await pool.query(
        'SELECT u.* FROM sesiones s JOIN usuarios u ON u.id=s.user_id WHERE s.token=? AND s.expires_at > NOW() LIMIT 1',
        [tkn]
    );
    if (!rows.length) return res.json({ user: null });
    const u        = rows[0];
    const permisos = await getPermisos(u.rol);
    res.json({ user: { id: u.id, nombre: u.nombre, email: u.email, rol: u.rol, permisos } });
}));

router.post('/logout', asyncHandler(async (req, res) => {
    const tkn = (req.cookies?.av_token ?? req.headers['x-token'] ?? '').trim();
    if (tkn) await pool.query('DELETE FROM sesiones WHERE token=?', [tkn]);
    res.clearCookie('av_token', { path: '/' });
    res.clearCookie('av_csrf',  { path: '/' });
    res.json({ success: true });
}));

router.post('/register', asyncHandler(async (req, res) => {
    const caller = await requireAdmin(req, res);
    if (!caller) return;

    const { nombre='', email='', password='' } = req.body;
    const rolRaw = (req.body.rol ?? 'tecnico').trim();

    if (!nombre || !email || !password) return res.status(400).json({ error: 'Nombre, email y contraseña son obligatorios.' });
    if (password.length < 12) return res.status(400).json({ error: 'Mínimo 12 caracteres.' });

    // Validar que el rol existe en la tabla de roles
    const [validRol] = await pool.query('SELECT nombre FROM roles WHERE nombre=? LIMIT 1', [rolRaw]);
    if (!validRol.length) return res.status(400).json({ error: 'Rol inválido.' });
    const rol = rolRaw;
    const [dup] = await pool.query('SELECT id FROM usuarios WHERE email=? LIMIT 1', [email.toLowerCase()]);
    if (dup.length) return res.status(400).json({ error: 'El email ya está registrado.' });
    const hash     = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
        'INSERT INTO usuarios (nombre,email,password,rol) VALUES (?,?,?,?)',
        [nombre, email.toLowerCase(), hash, rol]
    );
    res.json({ success: true, id: result.insertId });
}));

router.get('/usuarios', asyncHandler(async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    const [rows] = await pool.query('SELECT id,nombre,email,rol,created_at FROM usuarios ORDER BY created_at DESC');
    res.json(rows);
}));

router.post('/usuarios/rol', asyncHandler(async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    const id  = parseInt(req.body.id ?? 0);
    const rol = (req.body.rol ?? '').trim();
    if (!id || !rol) return res.status(400).json({ error: 'Datos inválidos.' });
    // Validar que el rol existe en la tabla de roles
    const [validRoles] = await pool.query('SELECT nombre FROM roles WHERE nombre=? LIMIT 1', [rol]);
    if (!validRoles.length) return res.status(400).json({ error: 'Rol inválido.' });
    await pool.query('UPDATE usuarios SET rol=? WHERE id=?', [rol, id]);
    res.json({ success: true });
}));

router.post('/usuarios/password', asyncHandler(async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    const id = parseInt(req.body.id ?? 0);
    const pw = (req.body.password ?? '').trim();
    if (!id || pw.length < 12) return res.status(400).json({ error: 'Mínimo 12 caracteres.' });
    const hash = await bcrypt.hash(pw, 10);
    await pool.query('UPDATE usuarios SET password=? WHERE id=?', [hash, id]);
    res.json({ success: true });
}));

router.post('/usuarios/sesion', asyncHandler(async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    const id = parseInt(req.body.id ?? 0);
    if (!id) return res.status(400).json({ error: 'ID inválido.' });
    await pool.query('DELETE FROM sesiones WHERE user_id=?', [id]);
    res.json({ success: true });
}));

router.post('/usuarios/eliminar', asyncHandler(async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    const id = parseInt(req.body.id ?? 0);
    if (!id) return res.status(400).json({ error: 'ID inválido.' });
    await pool.query('DELETE FROM usuarios WHERE id=?', [id]);
    res.json({ success: true });
}));

module.exports = router;
