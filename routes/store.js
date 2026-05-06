const express = require('express');
const bcrypt  = require('bcryptjs');
const pool    = require('../db');
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
        // objeto tipo {0: {...}, 1: {...}} → array
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

async function reemplazarEspecificaciones(conn, producto_id, specs) {
    await conn.query('DELETE FROM store_especificaciones WHERE producto_id=?', [producto_id]);
    if (!specs.length) return;
    const values = specs.map(s => [producto_id, s.nombre_dato, s.valor_dato]);
    await conn.query(
        'INSERT INTO store_especificaciones (producto_id, nombre_dato, valor_dato) VALUES ?',
        [values]
    );
}

// GET listado con especificaciones
router.get('/api.php', async (_req, res, next) => {
    try {
        const [productos] = await pool.query(
            `SELECT p.*, c.nombre AS categoria_nombre
               FROM store_productos p
               LEFT JOIN store_categorias c ON c.id = p.categoria_id`
        );
        if (productos.length === 0) return res.json([]);
        const ids = productos.map(p => p.id);
        const [specs] = await pool.query(
            'SELECT producto_id, nombre_dato, valor_dato FROM store_especificaciones WHERE producto_id IN (?)',
            [ids]
        );
        const byProd = {};
        for (const s of specs) {
            (byProd[s.producto_id] ??= []).push({ nombre_dato: s.nombre_dato, valor_dato: s.valor_dato });
        }
        for (const p of productos) p.especificaciones = byProd[p.id] || [];
        res.json(productos);
    } catch (e) { next(e); }
});

// Ficha individual
router.get('/producto.php', async (req, res, next) => {
    try {
        const id = parseInt(req.query.id || '0', 10);
        if (id <= 0) return res.json({ status: 'error', message: 'ID no válido' });
        const [rows] = await pool.query(
            `SELECT p.*, c.nombre AS categoria_nombre
               FROM store_productos p
               LEFT JOIN store_categorias c ON c.id = p.categoria_id
              WHERE p.id=?`,
            [id]
        );
        if (!rows.length) return res.json({ status: 'error', message: 'Producto no encontrado' });
        const producto = rows[0];
        const [specs] = await pool.query(
            'SELECT nombre_dato, valor_dato FROM store_especificaciones WHERE producto_id=?',
            [id]
        );
        producto.especificaciones = specs;
        res.json({ status: 'success', producto });
    } catch (e) { next(e); }
});

router.post('/add_producto.php', upload.single('imagen_file'), async (req, res, next) => {
    const conn = await pool.getConnection();
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

        await conn.beginTransaction();
        const [r] = await conn.query(
            `INSERT INTO store_productos (marca, modelo, precio, categoria_id, stock, eficiencia_energetica, imagen_url)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [marca, modelo, precio, categoria_id || null, stock || 0, eficiencia || null, imagen_url || null]
        );
        await reemplazarEspecificaciones(conn, r.insertId, specs);
        await conn.commit();

        res.json({
            status: 'success',
            message: 'Producto agregado correctamente',
            id: r.insertId,
            especificaciones: specs.length,
            debug_img: imagen_url,
        });
    } catch (e) { await conn.rollback().catch(() => {}); next(e); }
    finally { conn.release(); }
});

router.post('/update_producto.php', upload.single('imagen_file'), async (req, res, next) => {
    const conn = await pool.getConnection();
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

        // Construye SET dinámico para no pisar imagen/categoría/eficiencia con null si no se enviaron
        const sets = ['marca=?', 'modelo=?', 'precio=?', 'stock=?'];
        const vals = [marca, modelo, precio, stock || 0];
        if (categoria_id !== undefined) { sets.push('categoria_id=?');         vals.push(categoria_id || null); }
        if (eficiencia   !== undefined) { sets.push('eficiencia_energetica=?'); vals.push(eficiencia   || null); }
        if (imagen_url   !== undefined) { sets.push('imagen_url=?');           vals.push(imagen_url   || null); }
        vals.push(id);

        await conn.beginTransaction();
        await conn.query(`UPDATE store_productos SET ${sets.join(', ')} WHERE id=?`, vals);

        // Especificaciones: solo se reemplazan si se envían (permite editar sin tocar specs)
        if (data.especificaciones !== undefined) {
            await reemplazarEspecificaciones(conn, id, parseEspecificaciones(data));
        }
        await conn.commit();

        res.json({ status: 'success', message: 'Producto actualizado correctamente' });
    } catch (e) { await conn.rollback().catch(() => {}); next(e); }
    finally { conn.release(); }
});

router.post('/delete_producto.php', upload.any(), async (req, res, next) => {
    try {
        const id = req.body?.id;
        if (!id) return res.json({ status: 'error', message: 'ID no proporcionado' });
        await pool.query('DELETE FROM store_productos WHERE id=?', [id]);
        res.json({ status: 'success', message: 'Producto eliminado' });
    } catch (e) { next(e); }
});

// ── CATEGORÍAS ───────────────────────────────────────────────────────────────

router.get('/categorias.php', async (_req, res, next) => {
    try {
        const [rows] = await pool.query(
            'SELECT id, nombre, slug, descripcion, parent_id, fecha_creacion FROM store_categorias ORDER BY nombre ASC'
        );
        res.json({ status: 'success', categorias: rows });
    } catch (e) { next(e); }
});

router.post('/add_categoria.php', express.urlencoded({ extended: true }), async (req, res, next) => {
    try {
        const nombre = (req.body.nombre || '').trim();
        const slug = (req.body.slug || '').trim() || nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const descripcion = (req.body.descripcion || '').trim() || null;
        const parent_id = req.body.parent_id ? parseInt(req.body.parent_id, 10) : null;
        if (!nombre) return res.json({ status: 'error', message: 'Falta el nombre' });

        const [r] = await pool.query(
            'INSERT INTO store_categorias (nombre, slug, descripcion, parent_id) VALUES (?, ?, ?, ?)',
            [nombre, slug, descripcion, parent_id]
        );
        res.json({ status: 'success', message: 'Categoría creada', id: r.insertId });
    } catch (e) {
        if (e && e.code === 'ER_DUP_ENTRY') return res.json({ status: 'error', message: 'Esa categoría ya existe' });
        next(e);
    }
});

router.post('/update_categoria.php', express.urlencoded({ extended: true }), async (req, res, next) => {
    try {
        const id = parseInt(req.body.id || 0, 10);
        if (!id) return res.json({ status: 'error', message: 'ID no proporcionado' });
        const sets = [], vals = [];
        for (const k of ['nombre', 'slug', 'descripcion']) {
            if (req.body[k] !== undefined) { sets.push(`${k}=?`); vals.push(String(req.body[k]).trim() || null); }
        }
        if (req.body.parent_id !== undefined) {
            sets.push('parent_id=?'); vals.push(req.body.parent_id ? parseInt(req.body.parent_id, 10) : null);
        }
        if (!sets.length) return res.json({ status: 'error', message: 'Nada que actualizar' });
        vals.push(id);
        await pool.query(`UPDATE store_categorias SET ${sets.join(', ')} WHERE id=?`, vals);
        res.json({ status: 'success', message: 'Categoría actualizada' });
    } catch (e) { next(e); }
});

router.post('/delete_categoria.php', express.urlencoded({ extended: true }), async (req, res, next) => {
    try {
        const id = parseInt(req.body.id || 0, 10);
        if (!id) return res.json({ status: 'error', message: 'ID no proporcionado' });
        await pool.query('DELETE FROM store_categorias WHERE id=?', [id]);
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

        const [exists] = await pool.query('SELECT id FROM store_usuarios WHERE email=?', [email]);
        if (exists.length) return res.json({ success: false, message: 'Ya existe una cuenta con este correo electrónico.' });

        const hash = await bcrypt.hash(password, 10);
        const [r] = await pool.query(
            'INSERT INTO store_usuarios (nombre, email, password) VALUES (?, ?, ?)',
            [nombre, email, hash]
        );
        res.json({ success: true, message: 'Cuenta creada exitosamente.', usuario_id: r.insertId });
    } catch (e) { next(e); }
});

router.post('/login.php', async (req, res, next) => {
    try {
        const email    = (req.body.email || '').trim().toLowerCase();
        const password = req.body.password || '';
        if (!email || !password) return res.json({ success: false, message: 'Todos los campos son obligatorios.' });

        const [rows] = await pool.query('SELECT id, nombre, email, password FROM store_usuarios WHERE email=?', [email]);
        if (!rows.length) return res.json({ success: false, message: 'No existe una cuenta con este correo electrónico.' });

        const u = rows[0];
        const ok = await bcrypt.compare(password, u.password);
        if (!ok) return res.json({ success: false, message: 'Contraseña incorrecta.' });

        res.json({ success: true, message: 'Login exitoso.', usuario: { id: u.id, nombre: u.nombre, email: u.email } });
    } catch (e) { next(e); }
});

router.get('/usuarios.php', async (_req, res, next) => {
    try {
        const [usuarios] = await pool.query('SELECT id, nombre, email, fecha_registro FROM store_usuarios ORDER BY id ASC');
        res.json({ success: true, usuarios });
    } catch (e) { next(e); }
});

// ── CARRITO ──────────────────────────────────────────────────────────────────

router.get('/carrito.php', async (req, res, next) => {
    try {
        const usuario_id = parseInt(req.query.usuario_id || '0', 10);
        if (usuario_id <= 0) return res.json({ success: false, message: 'ID de usuario no válido.' });
        const [carrito] = await pool.query(
            `SELECT id, producto_id, producto_nombre, producto_marca, producto_precio, producto_imagen, cantidad, fecha_agregado
             FROM store_carrito WHERE usuario_id=? ORDER BY fecha_agregado DESC`,
            [usuario_id]
        );
        res.json({ success: true, carrito });
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

        const [existing] = await pool.query(
            'SELECT id, cantidad FROM store_carrito WHERE usuario_id=? AND producto_id=?',
            [usuario_id, producto_id]
        );
        if (existing.length) {
            const nuevaCantidad = existing[0].cantidad + cantidad;
            await pool.query('UPDATE store_carrito SET cantidad=? WHERE id=?', [nuevaCantidad, existing[0].id]);
            return res.json({ success: true, message: 'Cantidad actualizada en el carrito.', nueva_cantidad: nuevaCantidad });
        }
        const [r] = await pool.query(
            `INSERT INTO store_carrito (usuario_id, producto_id, producto_nombre, producto_marca, producto_precio, producto_imagen, cantidad)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [usuario_id, producto_id, nombre, marca, precio, imagen, cantidad]
        );
        res.json({ success: true, message: 'Producto añadido al carrito.', carrito_id: r.insertId });
    } catch (e) { next(e); }
});

router.delete('/carrito.php', async (req, res, next) => {
    try {
        const carrito_id = parseInt(req.body.carrito_id || 0, 10);
        const usuario_id = parseInt(req.body.usuario_id || 0, 10);
        if (carrito_id <= 0 || usuario_id <= 0) return res.json({ success: false, message: 'Datos incompletos.' });
        const [r] = await pool.query('DELETE FROM store_carrito WHERE id=? AND usuario_id=?', [carrito_id, usuario_id]);
        res.json({ success: r.affectedRows > 0, message: r.affectedRows > 0 ? 'Producto eliminado del carrito.' : 'No encontrado.' });
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

    await pool.query(
        `INSERT INTO store_sesiones
            (id, inicio, paginas_vistas, rebote, dispositivo, pais, ciudad, fuente, utm_source, utm_medium, utm_campaign, referrer, user_agent, ip)
         VALUES (?, NOW(), 0, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE id=id`,
        [session_id, dispositivo, pais, ciudad, fuente, utm_source, utm_medium, utm_campaign, referrer, ua, ip]
    );
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
            await pool.query('INSERT INTO store_visitas (session_id, fecha, pagina, titulo) VALUES (?, NOW(), ?, ?)', [session_id, pagina, titulo]);
            await pool.query(
                `UPDATE store_sesiones
                   SET paginas_vistas = paginas_vistas + 1,
                       rebote = CASE WHEN paginas_vistas + 1 >= 2 THEN 0 ELSE 1 END
                 WHERE id = ?`,
                [session_id]
            );
            return res.json({ success: true });
        }

        if (action === 'session_end') {
            await asegurarSesion(session_id, input, req);
            const duracion = parseInt(input.duracion_seg || 0, 10);
            await pool.query('UPDATE store_sesiones SET fin = NOW(), duracion_seg = ? WHERE id = ?', [duracion, session_id]);
            return res.json({ success: true });
        }

        if (action === 'event') {
            const tipo   = (input.tipo   || 'custom').trim();
            const nombre = (input.nombre || '').trim();
            const pagina = (input.pagina || '').trim();
            const valor  = (input.valor  || '').trim();
            if (!nombre) return res.json({ success: false, message: "Falta 'nombre' del evento." });
            await asegurarSesion(session_id, input, req);
            await pool.query(
                'INSERT INTO store_eventos (session_id, fecha, tipo, nombre, pagina, valor) VALUES (?, NOW(), ?, ?, ?, ?)',
                [session_id, tipo, nombre, pagina, valor]
            );
            return res.json({ success: true });
        }

        res.json({ success: false, message: `Acción no reconocida: ${action}` });
    } catch (e) { next(e); }
});

module.exports = router;
