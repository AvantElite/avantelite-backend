const path    = require('path');
const { Router } = require('express');
const { blog } = require('../db/index');
const { asyncHandler, slugify } = require('../helpers');
const { requireAdmin } = require('../auth');
const { upload, ALLOWED_IMAGE_EXTENSIONS, validateMagicBytes } = require('../upload');
const { uploadBuffer } = require('../cloudinary');

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
    const { slug='', categoria='', destacado, panel } = req.query;

    if (slug) {
        const post = await blog.findBySlugPublicado(slug);
        return post ? res.json(post) : res.status(404).json({ error: 'No encontrado' });
    }

    if (panel !== undefined) {
        if (!await requireAdmin(req, res)) return;
        return res.json(await blog.listAdmin());
    }

    res.json(await blog.listPublicos({ categoria, soloDestacado: destacado !== undefined }));
}));

router.post('/', asyncHandler(async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    const { titulo='', categoria='General', resumen='', contenido='', emoji='🛠️', fecha=new Date().toISOString().slice(0,10) } = req.body;
    const destacado = !!req.body.destacado;
    const publicado = !!req.body.publicado;
    const slug      = (req.body.slug ?? '').trim();

    if (!titulo || !contenido) return res.status(400).json({ error: 'Título y contenido son obligatorios.' });

    const slugFinal = await blog.uniqueSlug(slug || slugify(titulo));
    const id = await blog.create({ titulo, slug: slugFinal, categoria, resumen, contenido, emoji, destacado, publicado, fecha });
    res.json({ id, slug: slugFinal, success: true });
}));

router.put('/', asyncHandler(async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    const id = parseInt(req.body.id ?? 0);
    const { titulo='', categoria='General', resumen='', contenido='', emoji='🛠️', fecha=new Date().toISOString().slice(0,10) } = req.body;
    const destacado = !!req.body.destacado;
    const publicado = !!req.body.publicado;
    const slug      = (req.body.slug ?? '').trim();

    if (!id || !titulo || !contenido) return res.status(400).json({ error: 'ID, título y contenido son obligatorios.' });

    const slugFinal = await blog.uniqueSlug(slug || slugify(titulo), id);
    await blog.update(id, { titulo, slug: slugFinal, categoria, resumen, contenido, emoji, destacado, publicado, fecha });
    res.json({ success: true, slug: slugFinal });
}));

router.delete('/', asyncHandler(async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    const id = parseInt(req.body.id ?? 0);
    if (!id) return res.status(400).json({ error: 'ID inválido.' });
    await blog.remove(id);
    res.json({ success: true });
}));

router.post('/upload-imagen', upload.single('imagen'), asyncHandler(async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    if (!req.file) return res.status(400).json({ error: 'No se recibió imagen.' });
    const ext = path.extname(req.file.originalname).toLowerCase();
    if (!ALLOWED_IMAGE_EXTENSIONS.has(ext) || !validateMagicBytes(req.file.buffer, ext)) {
        return res.status(400).json({ error: 'Tipo de archivo no permitido o contenido inválido. Usa JPG, PNG, GIF o WebP.' });
    }
    const result = await uploadBuffer(req.file.buffer, { folder: 'blog', resource_type: 'image' });
    res.json({ success: true, url: result.secure_url });
}));

module.exports = router;
