const express = require('express');
const bcrypt  = require('bcryptjs');
const { store } = require('../db/index');
const { upload } = require('../upload');
const { uploadBuffer } = require('../cloudinary');

const router = express.Router();

// ── PRODUCTOS ─────────────────────────────────────────────────────────────────

// Acepta especificaciones como array JSON, JSON-string, o pares paralelos
// (especificaciones[0][nombre_dato], especificaciones[0][valor_dato], …)
function parseEspecificaciones(body) {
    let raw = body.especificaciones;
    if (!raw) return [];
    if (typeof raw === 'string') {
        try { raw = JSON.parse(raw); } catch { return []; }
    }
    if (!Array.isArray(raw)) {
        if (typeof raw === 'object') raw = Object.values(raw);
        else return [];
    }
    return raw
        .map(s => ({
            nombre_dato: String(s?.nombre_dato ?? s?.nombre ?? '').trim(),
            valor_dato:  String(s?.valor_dato  ?? s?.valor  ?? '').trim(),
        }))
        .filter(s => s.nombre_dato && s.valor_dato);
}

router.get('/api.php', async (_req, res, next) => {
    try {
        res.json(await store.productos.listConCategoriaYSpecs());
    } catch (e) { next(e); }
});

router.get('/producto.php', async (req, res, next) => {
    try {
        const id = parseInt(req.query.id || '0', 10);
        if (id <= 0) return res.json({ status: 'error', message: 'ID no válido' });
        const producto = await store.productos.findByIdConSpecs(id);
        if (!producto) return res.json({ status: 'error', message: 'Producto no encontrado' });
        res.json({ status: 'success', producto });
    } catch (e) { next(e); }
});

router.post('/add_producto.php', upload.single('imagen_file'), async (req, res, next) => {
    try {
        const { marca, modelo, precio, categoria_id, stock, eficiencia } = req.body;
        let { imagen_url } = req.body;
        if (req.file) {
            const r = await uploadBuffer(req.file.buffer, { folder: 'store', resource_type: 'image' });
            imagen_url = r.secure_url;
        }

        if (!marca || !modelo || precio == null) {
            return res.json({ status: 'error', message: 'Faltan campos obligatorios' });
        }

        const specs = parseEspecificaciones(req.body);
        const id = await store.productos.createConSpecs({
            marca, modelo, precio,
            categoria_id: categoria_id || null,
            stock: stock || 0,
            eficiencia: eficiencia || null,
            imagen_url: imagen_url || null,
        }, specs);

        res.json({
            status: 'success',
            message: 'Producto agregado correctamente',
            id,
            especificaciones: specs.length,
            debug_img: imagen_url,
        });
    } catch (e) { next(e); }
});

router.post('/update_producto.php', upload.single('imagen_file'), async (req, res, next) => {
    try {
        const data = (req.body && Object.keys(req.body).length) ? req.body : {};
        const { id, marca, modelo, precio, stock, categoria_id, eficiencia } = data;
        let { imagen_url } = data;
        if (req.file) {
            const r = await uploadBuffer(req.file.buffer, { folder: 'store', resource_type: 'image' });
            imagen_url = r.secure_url;
        }

        if (!id || !marca || !modelo || precio == null) {
            return res.json({ status: 'error', message: 'Faltan datos (ID, Marca, Modelo, Precio)' });
        }

        const fields = { marca, modelo, precio, stock: stock || 0 };
        if (categoria_id !== undefined) fields.categoria_id          = categoria_id || null;
        if (eficiencia   !== undefined) fields.eficiencia_energetica = eficiencia   || null;
        if (imagen_url   !== undefined) fields.imagen_url            = imagen_url   || null;

        const specs = data.especificaciones !== undefined ? parseEspecificaciones(data) : undefined;
        await store.productos.updatePartial(parseInt(id, 10), fields, specs);

        res.json({ status: 'success', message: 'Producto actualizado correctamente' });
    } catch (e) { next(e); }
});

router.post('/delete_producto.php', upload.any(), async (req, res, next) => {
    try {
        const id = req.body?.id;
        if (!id) return res.json({ status: 'error', message: 'ID no proporcionado' });
        await store.productos.remove(parseInt(id, 10));
        res.json({ status: 'success', message: 'Producto eliminado' });
    } catch (e) { next(e); }
});

// ── CATEGORÍAS ───────────────────────────────────────────────────────────────

router.get('/categorias.php', async (_req, res, next) => {
    try {
        res.json({ status: 'success', categorias: await store.categorias.list() });
    } catch (e) { next(e); }
});

router.post('/add_categoria.php', express.urlencoded({ extended: true }), async (req, res, next) => {
    try {
        const nombre = (req.body.nombre || '').trim();
        const slug = (req.body.slug || '').trim() || nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const descripcion = (req.body.descripcion || '').trim() || null;
        const parent_id = req.body.parent_id ? parseInt(req.body.parent_id, 10) : null;
        if (!nombre) return res.json({ status: 'error', message: 'Falta el nombre' });

        const id = await store.categorias.create({ nombre, slug, descripcion, parent_id });
        res.json({ status: 'success', message: 'Categoría creada', id });
    } catch (e) {
        if (e && e.code === 'DUP') return res.json({ status: 'error', message: 'Esa categoría ya existe' });
        next(e);
    }
});

router.post('/update_categoria.php', express.urlencoded({ extended: true }), async (req, res, next) => {
    try {
        const id = parseInt(req.body.id || 0, 10);
        if (!id) return res.json({ status: 'error', message: 'ID no proporcionado' });

        const fields = {};
        for (const k of ['nombre', 'slug', 'descripcion']) {
            if (req.body[k] !== undefined) fields[k] = String(req.body[k]).trim() || null;
        }
        if (req.body.parent_id !== undefined) {
            fields.parent_id = req.body.parent_id ? parseInt(req.body.parent_id, 10) : null;
        }

        const ok = await store.categorias.updatePartial(id, fields);
        if (!ok) return res.json({ status: 'error', message: 'Nada que actualizar' });
        res.json({ status: 'success', message: 'Categoría actualizada' });
    } catch (e) { next(e); }
});

router.post('/delete_categoria.php', express.urlencoded({ extended: true }), async (req, res, next) => {
    try {
        const id = parseInt(req.body.id || 0, 10);
        if (!id) return res.json({ status: 'error', message: 'ID no proporcionado' });
        await store.categorias.remove(id);
        res.json({ status: 'success', message: 'Categoría eliminada' });
    } catch (e) { next(e); }
});

// ── USUARIOS / AUTH ──────────────────────────────────────────────────────────

router.post('/registro.php', async (req, res, next) => {
    try {
        const nombre = (req.body.nombre || '').trim();
        const email  = (req.body.email  || '').trim().toLowerCase();
        const password = req.body.password || '';

        if (!nombre || !email || !password) return res.json({ success: false, message: 'Todos los campos son obligatorios.' });
        if (password.length < 6)              return res.json({ success: false, message: 'La contraseña debe tener al menos 6 caracteres.' });
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.json({ success: false, message: 'El correo electrónico no es válido.' });

        if (await store.usuarios.existsEmail(email))
            return res.json({ success: false, message: 'Ya existe una cuenta con este correo electrónico.' });

        const hash = await bcrypt.hash(password, 10);
        const usuario_id = await store.usuarios.create({ nombre, email, passwordHash: hash });
        res.json({ success: true, message: 'Cuenta creada exitosamente.', usuario_id });
    } catch (e) { next(e); }
});

router.post('/login.php', async (req, res, next) => {
    try {
        const email    = (req.body.email || '').trim().toLowerCase();
        const password = req.body.password || '';
        if (!email || !password) return res.json({ success: false, message: 'Todos los campos son obligatorios.' });

        const u = await store.usuarios.findByEmail(email);
        if (!u) return res.json({ success: false, message: 'No existe una cuenta con este correo electrónico.' });

        const ok = await bcrypt.compare(password, u.password);
        if (!ok) return res.json({ success: false, message: 'Contraseña incorrecta.' });

        res.json({ success: true, message: 'Login exitoso.', usuario: { id: u.id, nombre: u.nombre, email: u.email } });
    } catch (e) { next(e); }
});

router.get('/usuarios.php', async (_req, res, next) => {
    try {
        res.json({ success: true, usuarios: await store.usuarios.list() });
    } catch (e) { next(e); }
});

// ── CARRITO ──────────────────────────────────────────────────────────────────

router.get('/carrito.php', async (req, res, next) => {
    try {
        const usuario_id = parseInt(req.query.usuario_id || '0', 10);
        if (usuario_id <= 0) return res.json({ success: false, message: 'ID de usuario no válido.' });
        res.json({ success: true, carrito: await store.carrito.listByUsuario(usuario_id) });
    } catch (e) { next(e); }
});

router.post('/carrito.php', async (req, res, next) => {
    try {
        const usuario_id  = parseInt(req.body.usuario_id  || 0, 10);
        const producto_id = parseInt(req.body.producto_id || 0, 10);
        const nombre   = (req.body.producto_nombre || '').trim();
        const marca    = (req.body.producto_marca  || '').trim();
        const precio   = parseFloat(req.body.producto_precio || 0);
        const imagen   = (req.body.producto_imagen || '').trim();
        const cantidad = parseInt(req.body.cantidad || 1, 10);

        if (usuario_id <= 0 || producto_id <= 0) return res.json({ success: false, message: 'Datos incompletos.' });

        const existing = await store.carrito.findExistente(usuario_id, producto_id);
        if (existing) {
            const nuevaCantidad = existing.cantidad + cantidad;
            await store.carrito.incrementarCantidad(existing.id, nuevaCantidad);
            return res.json({ success: true, message: 'Cantidad actualizada en el carrito.', nueva_cantidad: nuevaCantidad });
        }
        const carrito_id = await store.carrito.add({
            usuario_id, producto_id,
            producto_nombre: nombre, producto_marca: marca,
            producto_precio: precio, producto_imagen: imagen, cantidad,
        });
        res.json({ success: true, message: 'Producto añadido al carrito.', carrito_id });
    } catch (e) { next(e); }
});

router.delete('/carrito.php', async (req, res, next) => {
    try {
        const carrito_id = parseInt(req.body.carrito_id || 0, 10);
        const usuario_id = parseInt(req.body.usuario_id || 0, 10);
        if (carrito_id <= 0 || usuario_id <= 0) return res.json({ success: false, message: 'Datos incompletos.' });
        const removed = await store.carrito.removeOwn(carrito_id, usuario_id);
        res.json({ success: removed, message: removed ? 'Producto eliminado del carrito.' : 'No encontrado.' });
    } catch (e) { next(e); }
});

// ── TRACKING ─────────────────────────────────────────────────────────────────

function detectarDispositivo(ua = '') {
    const u = ua.toLowerCase();
    if (/tablet|ipad/.test(u)) return 'tablet';
    if (/mobile|iphone|android/.test(u)) return 'mobile';
    return 'desktop';
}

function detectarFuente(referrer, utm_source, utm_medium) {
    const m = (utm_medium || '').toLowerCase();
    const s = (utm_source || '').toLowerCase();
    if (['cpc','paid','ppc'].includes(m)) return 'paid';
    if (m === 'social' || ['facebook','instagram','twitter','tiktok','linkedin'].includes(s)) return 'social';
    if (m === 'organic' || m === 'seo') return 'organic';
    if (m === 'referral') return 'referral';
    if (!referrer) return 'direct';
    try {
        const host = new URL(referrer).hostname;
        if (/google|bing|yahoo|duckduckgo/.test(host)) return 'organic';
        if (/facebook|instagram|twitter|t\.co|tiktok|linkedin/.test(host)) return 'social';
        return 'referral';
    } catch { return 'direct'; }
}

async function asegurarSesion(session_id, input, req) {
    const ua  = req.headers['user-agent'] || '';
    const ip  = req.ip || '';
    const referrer    = input.referrer    || '';
    const utm_source  = input.utm_source  || null;
    const utm_medium  = input.utm_medium  || null;
    const utm_campaign = input.utm_campaign || null;
    const pais   = input.pais   || 'España';
    const ciudad = input.ciudad || null;
    const dispositivo = detectarDispositivo(ua);
    const fuente = detectarFuente(referrer, utm_source, utm_medium);

    await store.tracking.ensureSesion({
        session_id, dispositivo, pais, ciudad, fuente,
        utm_source, utm_medium, utm_campaign,
        referrer, user_agent: ua, ip,
    });
    return { fuente, dispositivo };
}

router.post('/track.php', async (req, res, next) => {
    try {
        const input = (req.body && Object.keys(req.body).length) ? req.body : {};
        const action     = input.action || '';
        const session_id = (input.session_id || '').trim();
        if (!action || !session_id) return res.json({ success: false, message: 'Faltan parámetros: action y session_id.' });

        if (action === 'session_start') {
            const info = await asegurarSesion(session_id, input, req);
            return res.json({ success: true, session_id, ...info });
        }

        if (action === 'pageview') {
            const pagina = (input.pagina || '').trim();
            const titulo = (input.titulo || '').trim();
            if (!pagina) return res.json({ success: false, message: "Falta 'pagina'." });
            await asegurarSesion(session_id, input, req);
            await store.tracking.addPageview(session_id, pagina, titulo);
            await store.tracking.incrementarPageviews(session_id);
            return res.json({ success: true });
        }

        if (action === 'session_end') {
            await asegurarSesion(session_id, input, req);
            const duracion = parseInt(input.duracion_seg || 0, 10);
            await store.tracking.cerrarSesion(session_id, duracion);
            return res.json({ success: true });
        }

        if (action === 'event') {
            const tipo   = (input.tipo   || 'custom').trim();
            const nombre = (input.nombre || '').trim();
            const pagina = (input.pagina || '').trim();
            const valor  = (input.valor  || '').trim();
            if (!nombre) return res.json({ success: false, message: "Falta 'nombre' del evento." });
            await asegurarSesion(session_id, input, req);
            await store.tracking.addEvento({ session_id, tipo, nombre, pagina, valor });
            return res.json({ success: true });
        }

        res.json({ success: false, message: `Acción no reconocida: ${action}` });
    } catch (e) { next(e); }
});

module.exports = router;
