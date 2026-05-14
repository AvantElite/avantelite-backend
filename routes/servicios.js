const { Router } = require('express');
const { servicios } = require('../db/index');
const { asyncHandler } = require('../helpers');
const { requireAdmin } = require('../auth');

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
    const soloActivos = req.query.panel === undefined;
    res.json(await servicios.list({ soloActivos }));
}));

router.post('/', asyncHandler(async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    const { nombre = '', descripcion = '', icono = 'wrench', imagen = '', orden = 0, activo = true, subservicios = [] } = req.body;
    if (!nombre.trim()) return res.status(400).json({ error: 'El nombre es obligatorio.' });
    const id = await servicios.create({
        nombre: nombre.trim(), descripcion, icono, imagen, orden, activo, subservicios,
    });
    res.json({ id, success: true });
}));

router.put('/', asyncHandler(async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    const { id, nombre = '', descripcion = '', icono = 'wrench', imagen = '', orden = 0, activo = true, subservicios = [] } = req.body;
    const sid = parseInt(id ?? 0);
    if (!sid || !nombre.trim()) return res.status(400).json({ error: 'ID y nombre son obligatorios.' });
    await servicios.update(sid, {
        nombre: nombre.trim(), descripcion, icono, imagen, orden, activo, subservicios,
    });
    res.json({ success: true });
}));

router.delete('/', asyncHandler(async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    const id = parseInt(req.body.id ?? 0);
    if (!id) return res.status(400).json({ error: 'ID inválido.' });
    await servicios.remove(id);
    res.json({ success: true });
}));

module.exports = router;
