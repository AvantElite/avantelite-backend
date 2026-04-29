const { Router } = require('express');
const pool   = require('../db');
const { asyncHandler }  = require('../helpers');
const { requireAdmin }  = require('../auth');

const router = Router();

router.get('/listar', asyncHandler(async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    const [rows] = await pool.query('SELECT id,nombre,permisos,created_at FROM roles ORDER BY nombre');
    res.json(rows.map(r => ({
        ...r,
        permisos: (() => { try { return JSON.parse(r.permisos); } catch { return []; } })(),
    })));
}));

router.post('/crear', asyncHandler(async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    const nombre   = (req.body.nombre ?? '').trim();
    const permisos = req.body.permisos ?? [];
    if (!nombre) return res.status(400).json({ error: 'Nombre requerido.' });
    const [dup] = await pool.query('SELECT id FROM roles WHERE nombre=? LIMIT 1', [nombre]);
    if (dup.length) return res.status(400).json({ error: 'Ese rol ya existe.' });
    const [result] = await pool.query(
        'INSERT INTO roles (nombre,permisos) VALUES (?,?)',
        [nombre, JSON.stringify(permisos)]
    );
    res.json({ success: true, id: result.insertId });
}));

router.post('/actualizar', asyncHandler(async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    const id       = parseInt(req.body.id ?? 0);
    const permisos = req.body.permisos ?? [];
    if (!id) return res.status(400).json({ error: 'ID inválido.' });
    await pool.query('UPDATE roles SET permisos=? WHERE id=?', [JSON.stringify(permisos), id]);
    res.json({ success: true });
}));

router.post('/eliminar', asyncHandler(async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    const id = parseInt(req.body.id ?? 0);
    if (!id) return res.status(400).json({ error: 'ID inválido.' });
    await pool.query('DELETE FROM roles WHERE id=?', [id]);
    res.json({ success: true });
}));

module.exports = router;
