const crypto  = require('crypto');
const bcrypt  = require('bcryptjs');
const { Router } = require('express');
const { usuarios, sesiones, roles } = require('../db/index');
const { asyncHandler } = require('../helpers');
const { requireAdmin, getPermisos } = require('../auth');

const router = Router();

const SESSION_MAX_AGE = 8 * 3600 * 1000; // 8 horas

const COOKIE_OPTS = {
    httpOnly: true,
    sameSite: 'none',
    secure:   true,
    maxAge:   SESSION_MAX_AGE,
    path:     '/',
};

// Cookie CSRF: NO httpOnly para que el frontend pueda leerla y enviarla como header
const CSRF_COOKIE_OPTS = {
    httpOnly: false,
    sameSite: 'none',
    secure:   true,
    maxAge:   SESSION_MAX_AGE,
    path:     '/',
};

router.post('/login', asyncHandler(async (req, res) => {
    const { email='', password='' } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos.' });

    const user = await usuarios.findByEmail(email);
    if (!user) return res.json({ success: false, error: 'Credenciales incorrectas.' });

    const pw          = String(user.password ?? '');
    const isPhpHash   = pw.startsWith('$2y$');
    const hashToCheck = isPhpHash ? pw.replace(/^\$2y\$/, '$2a$') : pw;
    const valid       = await bcrypt.compare(password, hashToCheck);
    if (!valid) return res.json({ success: false, error: 'Credenciales incorrectas.' });

    const token     = crypto.randomBytes(32).toString('hex');
    const csrfToken = crypto.randomBytes(32).toString('hex');
    const expires   = new Date(Date.now() + SESSION_MAX_AGE);
    await sesiones.createSession(user.id, token, expires);

    res.cookie('av_token', token, COOKIE_OPTS);
    res.cookie('av_csrf',  csrfToken, CSRF_COOKIE_OPTS);

    const permisos = await getPermisos(user.rol);
    res.json({
        success: true,
        csrfToken,
        user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol, permisos },
    });
}));

router.get('/me', asyncHandler(async (req, res) => {
    const tkn = (req.cookies?.av_token ?? req.headers['x-token'] ?? '').trim();
    if (!tkn) return res.json({ user: null });
    const u = await sesiones.findUserBySessionToken(tkn);
    if (!u) return res.json({ user: null });
    const permisos  = await getPermisos(u.rol);
    const csrfToken = crypto.randomBytes(32).toString('hex');
    res.cookie('av_csrf', csrfToken, CSRF_COOKIE_OPTS);
    res.json({ csrfToken, user: { id: u.id, nombre: u.nombre, email: u.email, rol: u.rol, permisos } });
}));

router.post('/logout', asyncHandler(async (req, res) => {
    const tkn = (req.cookies?.av_token ?? req.headers['x-token'] ?? '').trim();
    if (tkn) await sesiones.deleteSession(tkn);
    res.clearCookie('av_token', { path: '/', sameSite: 'none', secure: true });
    res.clearCookie('av_csrf',  { path: '/', sameSite: 'none', secure: true });
    res.json({ success: true });
}));

router.post('/register', asyncHandler(async (req, res) => {
    const caller = await requireAdmin(req, res);
    if (!caller) return;

    const { nombre='', email='', password='' } = req.body;
    const rolRaw = (req.body.rol ?? 'tecnico').trim();

    if (!nombre || !email || !password) return res.status(400).json({ error: 'Nombre, email y contraseña son obligatorios.' });
    if (password.length < 12) return res.status(400).json({ error: 'Mínimo 12 caracteres.' });

    if (!await roles.findByName(rolRaw)) return res.status(400).json({ error: 'Rol inválido.' });
    if (await usuarios.existsEmail(email)) return res.status(400).json({ error: 'El email ya está registrado.' });

    const hash = await bcrypt.hash(password, 10);
    const id   = await usuarios.create({ nombre, email, passwordHash: hash, rol: rolRaw });
    res.json({ success: true, id });
}));

router.get('/usuarios', asyncHandler(async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    res.json(await usuarios.list());
}));

router.post('/usuarios/rol', asyncHandler(async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    const id  = parseInt(req.body.id ?? 0);
    const rol = (req.body.rol ?? '').trim();
    if (!id || !rol) return res.status(400).json({ error: 'Datos inválidos.' });
    if (!await roles.findByName(rol)) return res.status(400).json({ error: 'Rol inválido.' });
    await usuarios.updateRol(id, rol);
    res.json({ success: true });
}));

router.post('/usuarios/password', asyncHandler(async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    const id = parseInt(req.body.id ?? 0);
    const pw = (req.body.password ?? '').trim();
    if (!id || pw.length < 12) return res.status(400).json({ error: 'Mínimo 12 caracteres.' });
    const hash = await bcrypt.hash(pw, 10);
    await usuarios.updatePassword(id, hash);
    res.json({ success: true });
}));

router.post('/usuarios/sesion', asyncHandler(async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    const id = parseInt(req.body.id ?? 0);
    if (!id) return res.status(400).json({ error: 'ID inválido.' });
    await sesiones.deleteSessionsByUserId(id);
    res.json({ success: true });
}));

router.post('/usuarios/eliminar', asyncHandler(async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    const id = parseInt(req.body.id ?? 0);
    if (!id) return res.status(400).json({ error: 'ID inválido.' });
    await usuarios.remove(id);
    res.json({ success: true });
}));

module.exports = router;
