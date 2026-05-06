const path    = require('path');
const { Router } = require('express');
const pool    = require('../db');
const { asyncHandler }  = require('../helpers');
const { requireAuth, requireAdmin } = require('../auth');
const { upload }        = require('../upload');
const { OLLAMA_BASE }   = require('../ai');

const router = Router();

// ── /api/rag/* ────────────────────────────────────────────────────────────────

router.get('/rag/listar', asyncHandler(async (req, res) => {
    if (!await requireAuth(req, res)) return;
    const [rows] = await pool.query('SELECT id,titulo,contenido,categoria,created_at,tiene_vector FROM rag_knowledge ORDER BY created_at DESC');
    res.json({ entries: rows });
}));

router.post('/rag/crear', asyncHandler(async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    const { titulo='', contenido='', categoria='General' } = req.body;
    if (!titulo || !contenido) return res.status(400).json({ error: 'Título y contenido son obligatorios.' });
    if (String(contenido).length > 100_000) return res.status(400).json({ error: 'Contenido demasiado largo (máx. 100 000 caracteres).' });
    const [result] = await pool.query(
        'INSERT INTO rag_knowledge (titulo,contenido,categoria) VALUES (?,?,?)',
        [titulo, contenido, categoria]
    );
    res.json({ success: true, id: result.insertId });
}));

router.post('/rag/actualizar', asyncHandler(async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    const id = parseInt(req.body.id ?? 0);
    const { titulo='', contenido='', categoria='General' } = req.body;
    if (!id || !titulo || !contenido) return res.status(400).json({ error: 'Datos inválidos.' });
    await pool.query('UPDATE rag_knowledge SET titulo=?,contenido=?,categoria=? WHERE id=?', [titulo, contenido, categoria, id]);
    res.json({ success: true });
}));

router.post('/rag/eliminar', asyncHandler(async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    const id = parseInt(req.body.id ?? 0);
    if (!id) return res.status(400).json({ error: 'ID inválido.' });
    await pool.query('DELETE FROM rag_knowledge WHERE id=?', [id]);
    res.json({ success: true });
}));

router.post('/rag/subir', upload.single('archivo'), asyncHandler(async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No se recibió ningún archivo.' });
    const ext = path.extname(file.originalname).toLowerCase().slice(1);
    if (!['txt', 'md', 'csv'].includes(ext)) {
        return res.status(400).json({ error: 'Formato no soportado. Usa TXT, MD o CSV.' });
    }
    const contenido = file.buffer.toString('utf8').trim().slice(0, 100_000);
    const titulo = path.basename(file.originalname, path.extname(file.originalname)).replace(/[_-]+/g, ' ');
    res.json({ titulo, contenido });
}));

router.post('/rag/vectorizar_todo', asyncHandler(async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    const [result] = await pool.query('UPDATE rag_knowledge SET tiene_vector=1 WHERE tiene_vector=0');
    res.json({ success: true, vectorizados: result.affectedRows, fallidos: 0 });
}));

// ── /api/config/* ─────────────────────────────────────────────────────────────

router.get('/config/get', asyncHandler(async (req, res) => {
    if (!await requireAuth(req, res)) return;
    const [rows]   = await pool.query("SELECT valor FROM app_config WHERE clave='ia_config' LIMIT 1");
    const defaults = { proveedor_generacion: 'ollama', modelo_generacion: '', proveedor_embeddings: 'ollama', modelo_embeddings: '' };
    let cfg        = { ...defaults };
    if (rows.length) { try { cfg = { ...defaults, ...JSON.parse(rows[0].valor) }; } catch {} }
    cfg.anthropic_key_set = !!(process.env.ANTHROPIC_API_KEY);
    cfg.openai_key_set    = !!(process.env.OPENAI_API_KEY);

    let modelos_ollama = [];
    try {
        const r = await fetch(`${OLLAMA_BASE}/api/tags`);
        if (r.ok) {
            const d = await r.json();
            modelos_ollama = (d.models ?? []).map(m => ({ name: m.name, size: m.size ?? 0, family: m.details?.family ?? '' }));
        }
    } catch {}

    res.json({ config: cfg, modelos_ollama });
}));

router.post('/config/set', asyncHandler(async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    const { proveedor_generacion, modelo_generacion, proveedor_embeddings, modelo_embeddings } = req.body;

    let embeddings_reset = false;
    const [prevRows] = await pool.query("SELECT valor FROM app_config WHERE clave='ia_config' LIMIT 1");
    if (prevRows.length) {
        try {
            const prevCfg = JSON.parse(prevRows[0].valor);
            if (prevCfg.proveedor_embeddings !== proveedor_embeddings || prevCfg.modelo_embeddings !== modelo_embeddings) {
                await pool.query('UPDATE rag_knowledge SET tiene_vector=0');
                embeddings_reset = true;
            }
        } catch {}
    }

    const cfg = JSON.stringify({ proveedor_generacion, modelo_generacion, proveedor_embeddings, modelo_embeddings });
    await pool.query(
        "INSERT INTO app_config (clave,valor) VALUES ('ia_config',?) ON DUPLICATE KEY UPDATE valor=VALUES(valor)",
        [cfg]
    );
    res.json({ success: true, embeddings_reset });
}));

module.exports = router;
