const { Router } = require('express');
const { contactos } = require('../db/index');
const { asyncHandler } = require('../helpers');
const { requireAuth } = require('../auth');

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
    if (!await requireAuth(req, res)) return;
    res.json(await contactos.listWithLastPresupuesto());
}));

router.post('/leido', asyncHandler(async (req, res) => {
    if (!await requireAuth(req, res)) return;
    const id = parseInt(req.body.id ?? 0);
    if (!id) return res.status(400).json({ error: 'ID inválido.' });
    await contactos.markRead(id);
    res.json({ success: true });
}));

router.post('/dificultad', asyncHandler(async (req, res) => {
    if (!await requireAuth(req, res)) return;
    const id         = parseInt(req.body.id ?? 0);
    const dificultad = req.body.dificultad ?? '';
    if (!id || !['facil', 'medio', 'dificil'].includes(dificultad))
        return res.status(400).json({ error: 'Datos inválidos.' });
    await contactos.setDificultad(id, dificultad);
    res.json({ success: true });
}));

router.get('/stats', asyncHandler(async (req, res) => {
    if (!await requireAuth(req, res)) return;

    const [
        totales, dist, recienteRaw, mensualRaw, diarioRaw,
        mesActual, mesAnterior, trActual, trAnterior,
    ] = await Promise.all([
        contactos.statsTotales(),
        contactos.statsDistribucionProducto(),
        contactos.statsRecientes(),
        contactos.statsVolumenMensual(),
        contactos.statsContactosDiarios(),
        contactos.statsMes(0),
        contactos.statsMes(1),
        contactos.statsTiempoRespuestaMes(0),
        contactos.statsTiempoRespuestaMes(1),
    ]);

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
        total_contactos:  totales.total,
        nuevos_contactos: totales.nuevos,
        leidos_contactos: totales.leidos,
        pct_total:  pct(mesActual.total,  mesAnterior.total),
        pct_nuevos: pct(mesActual.total,  mesAnterior.total),
        pct_leidos: pct(mesActual.leidos, mesAnterior.leidos),
        pct_tiempo: pctTiempo,
        distribucion_producto: dist,
        actividad_reciente: recienteRaw.map(r => {
            const nc = `${r.nombre ?? ''} ${r.apellido ?? ''}`.trim();
            return {
                name:       nc || r.email,
                action:     r.tipo === 'diy' ? `AvantFix · Nivel ${r.dificultad ? (r.dificultad.charAt(0).toUpperCase() + r.dificultad.slice(1)) : 'sin clasificar'}` : r.problema,
                producto:   r.tipo === 'diy' ? 'AvantFix' : r.producto,
                time:       r.fecha_creacion,
                status:     (r.leido === 0 || r.leido === false) ? 'Nuevo' : 'Leído',
                tipo:       r.tipo,
                dificultad: r.dificultad,
            };
        }),
        volumen_mensual:   mensualRaw.map(r => ({ mes: r.mes, recibidos: r.recibidos, leidos: r.leidos })),
        contactos_diarios: diarioRaw.map(r => ({ dia: diasEsp[r.dia] ?? r.dia, contactos: r.contactos })),
        tiempo_respuesta:  fmtMinutos(trMin),
    });
}));

router.post('/eliminar', asyncHandler(async (req, res) => {
    if (!await requireAuth(req, res)) return;
    const id = parseInt(req.body.id ?? 0);
    if (!id) return res.status(400).json({ error: 'ID inválido.' });
    await contactos.remove(id);
    res.json({ success: true });
}));

module.exports = router;
