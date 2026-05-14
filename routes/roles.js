const { Router } = require('express');
const { roles } = require('../db/index');
const { asyncHandler } = require('../helpers');
const { requireAdmin } = require('../auth');

const router = Router();

router.get('/listar', asyncHandler(async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    res.json(await roles.list());
}));

router.post('/crear', asyncHandler(async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    const nombre   = (req.body.nombre ?? '').trim();
    const permisos = req.body.permisos ?? [];
    if (!nombre) return res.status(400).json({ error: 'Nombre requerido.' });
    if (await roles.findByName(nombre)) return res.status(400).json({ error: 'Ese rol ya existe.' });
    const id = await roles.create(nombre, permisos);
    res.json({ success: true, id });
}));

router.post('/actualizar', asyncHandler(async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    const id       = parseInt(req.body.id ?? 0);
    const permisos = req.body.permisos ?? [];
    if (!id) return res.status(400).json({ error: 'ID inválido.' });
    await roles.updatePermisos(id, permisos);
    res.json({ success: true });
}));

router.post('/eliminar', asyncHandler(async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    const id = parseInt(req.body.id ?? 0);
    if (!id) return res.status(400).json({ error: 'ID inválido.' });
    await roles.remove(id);
    res.json({ success: true });
}));

module.exports = router;
