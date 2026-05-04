const { Router } = require('express');
const pool = require('../db');
const { asyncHandler } = require('../helpers');
const { requireAdmin } = require('../auth');

const router = Router();

// GET /api/tipos_problema — público
router.get('/', asyncHandler(async (_req, res) => {
    const [rows] = await pool.query('SELECT id, nombre FROM tipos_problema ORDER BY nombre ASC');
    res.json(rows);
}));

// POST /api/tipos_problema — admin
router.post('/', asyncHandler(async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    const nombre = (req.body.nombre ?? '').trim().toLowerCase().replace(/\s+/g, '-');
    if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio.' });
    try {
        const [r] = await pool.query('INSERT INTO tipos_problema (nombre) VALUES (?)', [nombre]);
        res.status(201).json({ id: r.insertId, nombre });
    } catch (e) {
        if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Ya existe ese tipo de problema.' });
        throw e;
    }
}));

// DELETE /api/tipos_problema/:id — admin
router.delete('/:id', asyncHandler(async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    const id = parseInt(req.params.id);
    if (!id) return res.status(400).json({ error: 'ID inválido.' });
    await pool.query('DELETE FROM tipos_problema WHERE id=?', [id]);
    res.json({ ok: true });
}));

module.exports = router;
