const { Router } = require('express');
const { tiposProblema } = require('../db/index');
const { asyncHandler } = require('../helpers');
const { requireAdmin } = require('../auth');

const router = Router();

router.get('/', asyncHandler(async (_req, res) => {
    res.json(await tiposProblema.list());
}));

router.post('/', asyncHandler(async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    const nombre = (req.body.nombre ?? '').trim().toLowerCase().replace(/\s+/g, '-');
    if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio.' });
    try {
        const id = await tiposProblema.create(nombre);
        res.status(201).json({ id, nombre });
    } catch (e) {
        if (e.code === 'DUP') return res.status(409).json({ error: 'Ya existe ese tipo de problema.' });
        throw e;
    }
}));

router.delete('/:id', asyncHandler(async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    const id = parseInt(req.params.id);
    if (!id) return res.status(400).json({ error: 'ID inválido.' });
    await tiposProblema.remove(id);
    res.json({ ok: true });
}));

module.exports = router;
