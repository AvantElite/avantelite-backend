const { Router } = require('express');
const pool   = require('../db');
const { asyncHandler } = require('../helpers');
const { requireAuth }  = require('../auth');

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
    if (!await requireAuth(req, res)) return;
    const [rows] = await pool.query(`
        SELECT c.*,
               p.token        AS chat_token,
               p.estado       AS presupuesto_estado,
               p.chat_cerrado AS chat_cerrado,
               p.etiquetas    AS etiquetas
        FROM contactos c
        LEFT JOIN presupuestos p ON p.id = (
            SELECT id FROM presupuestos WHERE contacto_id = c.id ORDER BY created_at DESC LIMIT 1
        )
        ORDER BY c.fecha_creacion DESC
    `);
    res.json(rows.map(r => ({
        ...r,
        leido:        r.leido === 1,
        chat_cerrado: r.chat_cerrado === 1,
        etiquetas:    (() => { try { return JSON.parse(r.etiquetas ?? '[]'); } catch { return []; } })(),
    })));
}));

router.post('/leido', asyncHandler(async (req, res) => {
    if (!await requireAuth(req, res)) return;
    const id = parseInt(req.body.id ?? 0);
    if (!id) return res.status(400).json({ error: 'ID inválido.' });
    await pool.query('UPDATE contactos SET leido=1, fecha_leido=NOW() WHERE id=? AND leido=0', [id]);
    res.json({ success: true });
}));

router.post('/dificultad', asyncHandler(async (req, res) => {
    if (!await requireAuth(req, res)) return;
    const id         = parseInt(req.body.id ?? 0);
    const dificultad = req.body.dificultad ?? '';
    if (!id || !['facil', 'medio', 'dificil'].includes(dificultad))
        return res.status(400).json({ error: 'Datos inválidos.' });
    await pool.query('UPDATE contactos SET dificultad=? WHERE id=?', [dificultad, id]);
    res.json({ success: true });
}));

router.get('/stats', asyncHandler(async (req, res) => {
    if (!await requireAuth(req, res)) return;
    const [[{ total }]]   = await pool.query('SELECT COUNT(*) as total FROM contactos');
    const [[{ nuevos }]]  = await pool.query('SELECT COUNT(*) as nuevos FROM contactos WHERE leido=0');
    const [[{ leidos }]]  = await pool.query('SELECT COUNT(*) as leidos FROM contactos WHERE leido=1');
    const [dist]          = await pool.query('SELECT producto as name, COUNT(*) as value FROM contactos GROUP BY producto');
    const [recienteRaw]   = await pool.query('SELECT nombre,apellido,email,producto,problema,dificultad,tipo,fecha_creacion,leido FROM contactos ORDER BY fecha_creacion DESC LIMIT 8');
    const [mensualRaw]    = await pool.query("SELECT DATE_FORMAT(MIN(fecha_creacion),'%b') as mes, COUNT(*) as recibidos, SUM(CASE WHEN leido=1 THEN 1 ELSE 0 END) as leidos FROM contactos WHERE fecha_creacion > DATE_SUB(NOW(), INTERVAL 12 MONTH) GROUP BY YEAR(fecha_creacion), MONTH(fecha_creacion) ORDER BY YEAR(fecha_creacion), MONTH(fecha_creacion) ASC");
    const [diarioRaw]     = await pool.query("SELECT DATE_FORMAT(DATE(fecha_creacion),'%a') as dia, COUNT(*) as contactos FROM contactos WHERE fecha_creacion > DATE_SUB(NOW(), INTERVAL 7 DAY) GROUP BY DATE(fecha_creacion) ORDER BY DATE(fecha_creacion) ASC");

    const [[mesActual]]   = await pool.query("SELECT COUNT(*) as total, SUM(CASE WHEN leido=1 THEN 1 ELSE 0 END) as leidos FROM contactos WHERE YEAR(fecha_creacion)=YEAR(NOW()) AND MONTH(fecha_creacion)=MONTH(NOW())");
    const [[mesAnterior]] = await pool.query("SELECT COUNT(*) as total, SUM(CASE WHEN leido=1 THEN 1 ELSE 0 END) as leidos FROM contactos WHERE YEAR(fecha_creacion)=YEAR(DATE_SUB(NOW(), INTERVAL 1 MONTH)) AND MONTH(fecha_creacion)=MONTH(DATE_SUB(NOW(), INTERVAL 1 MONTH))");
    const [[trActual]]    = await pool.query("SELECT AVG(TIMESTAMPDIFF(MINUTE, fecha_creacion, fecha_leido)) as minutos FROM contactos WHERE fecha_leido IS NOT NULL AND YEAR(fecha_creacion)=YEAR(NOW()) AND MONTH(fecha_creacion)=MONTH(NOW())");
    const [[trAnterior]]  = await pool.query("SELECT AVG(TIMESTAMPDIFF(MINUTE, fecha_creacion, fecha_leido)) as minutos FROM contactos WHERE fecha_leido IS NOT NULL AND YEAR(fecha_creacion)=YEAR(DATE_SUB(NOW(), INTERVAL 1 MONTH)) AND MONTH(fecha_creacion)=MONTH(DATE_SUB(NOW(), INTERVAL 1 MONTH))");
    const [[nuevosActual]]   = await pool.query("SELECT COUNT(*) as total FROM contactos WHERE YEAR(fecha_creacion)=YEAR(NOW()) AND MONTH(fecha_creacion)=MONTH(NOW())");
    const [[nuevosAnterior]] = await pool.query("SELECT COUNT(*) as total FROM contactos WHERE YEAR(fecha_creacion)=YEAR(DATE_SUB(NOW(), INTERVAL 1 MONTH)) AND MONTH(fecha_creacion)=MONTH(DATE_SUB(NOW(), INTERVAL 1 MONTH))");

    function pct(curr, prev) {
        const c = parseInt(curr) || 0, p = parseInt(prev) || 0;
        if (p === 0) return c > 0 ? 100 : null;
        return Math.round(((c - p) / p) * 100);
    }

    function fmtMinutos(min) {
        if (!min || min <= 0) return null;
        const m = Math.round(min);
        if (m < 60) return `${m}m`;
        const h = Math.floor(m / 60), rem = m % 60;
        return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
    }

    const trMin     = trActual.minutos   ? parseFloat(trActual.minutos)   : null;
    const trMinPrev = trAnterior.minutos ? parseFloat(trAnterior.minutos) : null;
    const pctTiempo = (trMin !== null && trMinPrev !== null && trMinPrev > 0)
        ? Math.round(((trMin - trMinPrev) / trMinPrev) * 100)
        : null;

    const diasEsp = { Mon:'Lun', Tue:'Mar', Wed:'Mie', Thu:'Jue', Fri:'Vie', Sat:'Sab', Sun:'Dom' };

    res.json({
        total_contactos:  parseInt(total),
        nuevos_contactos: parseInt(nuevos),
        leidos_contactos: parseInt(leidos),
        pct_total:  pct(mesActual.total,    mesAnterior.total),
        pct_nuevos: pct(nuevosActual.total, nuevosAnterior.total),
        pct_leidos: pct(mesActual.leidos,   mesAnterior.leidos),
        pct_tiempo: pctTiempo,
        distribucion_producto: dist.map(r => ({ name: r.name, value: parseInt(r.value) })),
        actividad_reciente: recienteRaw.map(r => {
            const nc = `${r.nombre ?? ''} ${r.apellido ?? ''}`.trim();
            return {
                name:       nc || r.email,
                action:     r.tipo === 'diy' ? `AvantFix · Nivel ${r.dificultad ? (r.dificultad.charAt(0).toUpperCase() + r.dificultad.slice(1)) : 'sin clasificar'}` : r.problema,
                producto:   r.tipo === 'diy' ? 'AvantFix' : r.producto,
                time:       r.fecha_creacion,
                status:     r.leido === 0 ? 'Nuevo' : 'Leído',
                tipo:       r.tipo,
                dificultad: r.dificultad,
            };
        }),
        volumen_mensual:   mensualRaw.map(r => ({ mes: r.mes, recibidos: parseInt(r.recibidos), leidos: parseInt(r.leidos) })),
        contactos_diarios: diarioRaw.map(r => ({ dia: diasEsp[r.dia] ?? r.dia, contactos: parseInt(r.contactos) })),
        tiempo_respuesta:  fmtMinutos(trMin),
    });
}));

router.post('/eliminar', asyncHandler(async (req, res) => {
    if (!await requireAuth(req, res)) return;
    const id = parseInt(req.body.id ?? 0);
    if (!id) return res.status(400).json({ error: 'ID inválido.' });
    await pool.query('DELETE FROM contactos WHERE id=?', [id]);
    res.json({ success: true });
}));

module.exports = router;
