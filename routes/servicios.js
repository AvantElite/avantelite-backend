const { Router } = require('express');
const pool = require('../db');
const { asyncHandler } = require('../helpers');
const { requireAdmin } = require('../auth');

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
    const soloActivos = req.query.panel === undefined;
    let q = 'SELECT * FROM servicios';
    if (soloActivos) q += ' WHERE activo=1';
    q += ' ORDER BY orden ASC, id ASC';
    const [rows] = await pool.query(q);
    res.json(rows.map(r => ({
        ...r,
        activo: !!r.activo,
        subservicios: r.subservicios
            ? (typeof r.subservicios === 'string' ? JSON.parse(r.subservicios) : r.subservicios)
            : [],
    })));
}));

router.post('/', asyncHandler(async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    const { nombre = '', descripcion = '', icono = 'wrench', imagen = '', orden = 0, activo = true, subservicios = [] } = req.body;
    if (!nombre.trim()) return res.status(400).json({ error: 'El nombre es obligatorio.' });
    const [result] = await pool.query(
        'INSERT INTO servicios (nombre, descripcion, icono, imagen, orden, activo, subservicios) VALUES (?,?,?,?,?,?,?)',
        [nombre.trim(), descripcion, icono, imagen, orden, activo ? 1 : 0, JSON.stringify(subservicios)]
    );
    res.json({ id: result.insertId, success: true });
}));

router.put('/', asyncHandler(async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    const { id, nombre = '', descripcion = '', icono = 'wrench', imagen = '', orden = 0, activo = true, subservicios = [] } = req.body;
    const sid = parseInt(id ?? 0);
    if (!sid || !nombre.trim()) return res.status(400).json({ error: 'ID y nombre son obligatorios.' });
    await pool.query(
        'UPDATE servicios SET nombre=?, descripcion=?, icono=?, imagen=?, orden=?, activo=?, subservicios=? WHERE id=?',
        [nombre.trim(), descripcion, icono, imagen, orden, activo ? 1 : 0, JSON.stringify(subservicios), sid]
    );
    res.json({ success: true });
}));

router.delete('/', asyncHandler(async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    const id = parseInt(req.body.id ?? 0);
    if (!id) return res.status(400).json({ error: 'ID inválido.' });
    await pool.query('DELETE FROM servicios WHERE id=?', [id]);
    res.json({ success: true });
}));

module.exports = router;
