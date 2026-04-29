const fs      = require('fs');
const path    = require('path');
const { Router } = require('express');
const pool    = require('../db');
const { asyncHandler, slugify, uniqueSlug } = require('../helpers');
const { requireAuth, requireAdmin } = require('../auth');
const { upload, ALLOWED_IMAGE_EXTENSIONS, validateMagicBytes } = require('../upload');

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
    const { slug='', categoria='', destacado, panel } = req.query;

    if (slug) {
        const [rows] = await pool.query("SELECT * FROM blog_posts WHERE slug=? AND publicado=1 LIMIT 1", [slug]);
        return rows.length ? res.json(rows[0]) : res.status(404).json({ error: 'No encontrado' });
    }

    if (panel !== undefined) {
        if (!await requireAdmin(req, res)) return;
        const [rows] = await pool.query("SELECT * FROM blog_posts ORDER BY fecha DESC, creado_en DESC");
        return res.json(rows.map(r => ({ ...r, publicado: !!r.publicado, destacado: !!r.destacado })));
    }

    let q      = 'SELECT id,titulo,slug,categoria,resumen,emoji,destacado,fecha FROM blog_posts WHERE publicado=1';
    const params = [];
    if (categoria)           { q += ' AND categoria=?'; params.push(categoria); }
    if (destacado !== undefined) q += ' AND destacado=1';
    q += ' ORDER BY destacado DESC, fecha DESC';

    const [rows] = await pool.query(q, params);
    res.json(rows);
}));

router.post('/', asyncHandler(async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    const { titulo='', categoria='General', resumen='', contenido='', emoji='🛠️', fecha=new Date().toISOString().slice(0,10) } = req.body;
    const destacado = req.body.destacado ? 1 : 0;
    const publicado = req.body.publicado ? 1 : 0;
    const slug      = (req.body.slug ?? '').trim();

    if (!titulo || !contenido) return res.status(400).json({ error: 'Título y contenido son obligatorios.' });

    const db = await pool.getConnection();
    try {
        const slugFinal = await uniqueSlug(db, slug || slugify(titulo));
        const [result]  = await db.query(
            'INSERT INTO blog_posts (titulo,slug,categoria,resumen,contenido,emoji,destacado,publicado,fecha) VALUES (?,?,?,?,?,?,?,?,?)',
            [titulo, slugFinal, categoria, resumen, contenido, emoji, destacado, publicado, fecha]
        );
        res.json({ id: result.insertId, slug: slugFinal, success: true });
    } finally { db.release(); }
}));

router.put('/', asyncHandler(async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    const id = parseInt(req.body.id ?? 0);
    const { titulo='', categoria='General', resumen='', contenido='', emoji='🛠️', fecha=new Date().toISOString().slice(0,10) } = req.body;
    const destacado = req.body.destacado ? 1 : 0;
    const publicado = req.body.publicado ? 1 : 0;
    const slug      = (req.body.slug ?? '').trim();

    if (!id || !titulo || !contenido) return res.status(400).json({ error: 'ID, título y contenido son obligatorios.' });

    const db = await pool.getConnection();
    try {
        const slugFinal = await uniqueSlug(db, slug || slugify(titulo), id);
        await db.query(
            'UPDATE blog_posts SET titulo=?,slug=?,categoria=?,resumen=?,contenido=?,emoji=?,destacado=?,publicado=?,fecha=? WHERE id=?',
            [titulo, slugFinal, categoria, resumen, contenido, emoji, destacado, publicado, fecha, id]
        );
        res.json({ success: true, slug: slugFinal });
    } finally { db.release(); }
}));

router.delete('/', asyncHandler(async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    const id = parseInt(req.body.id ?? 0);
    if (!id) return res.status(400).json({ error: 'ID inválido.' });
    await pool.query('DELETE FROM blog_posts WHERE id=?', [id]);
    res.json({ success: true });
}));

router.post('/upload-imagen', upload.single('imagen'), asyncHandler(async (req, res) => {
    if (!await requireAdmin(req, res)) {
        if (req.file) fs.unlinkSync(req.file.path);
        return;
    }
    if (!req.file) return res.status(400).json({ error: 'No se recibió imagen.' });
    const ext = path.extname(req.file.originalname).toLowerCase();
    if (!ALLOWED_IMAGE_EXTENSIONS.has(ext) || !validateMagicBytes(req.file.path, ext)) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'Tipo de archivo no permitido o contenido inválido. Usa JPG, PNG, GIF o WebP.' });
    }
    res.json({ success: true, url: `/uploads/${req.file.filename}` });
}));

module.exports = router;
