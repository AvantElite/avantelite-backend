const { Router } = require('express');
const { analytics } = require('../db/index');
const { asyncHandler, parseBrowser, parseOS, geoFromIP } = require('../helpers');
const { requireAuth } = require('../auth');

const router = Router();

// ── GET /api/analytics ────────────────────────────────────────────────────────
router.get('/analytics', asyncHandler(async (req, res) => {
    if (!await requireAuth(req, res)) return;
    const range = ['7','30','90'].includes(req.query.range) ? parseInt(req.query.range) : 30;
    const gran  = ['day','week','month'].includes(req.query.gran) ? req.query.gran : 'day';
    const prev  = range * 2;

    const [
        pvTotal, pvPrev, uniqCurr, uniqPrev, sesCurr, sesPrev,
        bounceCurrCount, bouncePrevCount, timeCurr, timePrev, scrollCurr,
        tmpRaw, tmpPrevRaw, fttRaw, pagesCurr, pagesPrev, evRaw,
        fuentes, dispositivos, navegadores, sistemas, paises,
        eventosTipo, eventosTop, scrollPaginas,
    ] = await Promise.all([
        analytics.pageviewsCount(range),
        analytics.pageviewsCountBetween(prev, range),
        analytics.uniqueUsers(range),
        analytics.uniqueUsersBetween(prev, range),
        analytics.sessionsCount(range),
        analytics.sessionsCountBetween(prev, range),
        analytics.singlePageSessions(range),
        analytics.singlePageSessionsBetween(prev, range),
        analytics.avgTimeOnPage(range),
        analytics.avgTimeOnPageBetween(prev, range),
        analytics.avgScrollDepth(range),
        analytics.temporalSeries(range, gran),
        analytics.temporalSeriesBetween(prev, range, gran),
        analytics.fuentesTiempo(range, gran),
        analytics.topPages(range),
        analytics.topPagesPrev(prev, range),
        analytics.eventosTiempo(range, gran),
        analytics.fuentes(range),
        analytics.dispositivos(range),
        analytics.navegadores(range),
        analytics.sistemas(range),
        analytics.paises(range),
        analytics.eventosTipo(range),
        analytics.eventosTop(range),
        analytics.scrollPaginas(range),
    ]);

    const bounceCurr = sesCurr > 0 ? Math.round((bounceCurrCount / sesCurr) * 1000) / 10 : 0;
    const bouncePrev = sesPrev > 0 ? Math.round((bouncePrevCount / sesPrev) * 1000) / 10 : 0;

    const trend = (c, p) => p === 0 ? null : Math.round((c - p) / p * 1000) / 10;

    const anomalies = (series) => {
        const vals = series.map(r => r.value);
        if (vals.length < 3) return series.map(r => ({ ...r, anomalia: false }));
        const mean = vals.reduce((a,b)=>a+b,0)/vals.length;
        const std  = Math.sqrt(vals.reduce((a,b)=>a+(b-mean)**2,0)/vals.length);
        return series.map(r => ({ ...r, anomalia: std > 0 && Math.abs(r.value - mean) / std > 2.0 }));
    };

    const tmpWithAnomaly = anomalies(tmpRaw.map(r => ({ ...r, value: r.visitas })));

    const fttMap = {};
    for (const r of fttRaw) {
        if (!fttMap[r.label]) fttMap[r.label] = { label: r.label };
        fttMap[r.label][r.fuente] = r.total;
    }

    const prevMap = {};
    for (const r of pagesPrev) prevMap[r.pagina] = r.visitas;

    const evMap = {};
    for (const r of evRaw) {
        if (!evMap[r.label]) evMap[r.label] = { label: r.label };
        evMap[r.label][r.event_type] = r.total;
    }

    const timeCurrR = Math.round(timeCurr);
    const timePrevR = Math.round(timePrev);

    res.json({
        kpis: {
            visitas:        { curr: pvTotal,    prev: pvPrev,     trend: trend(pvTotal, pvPrev) },
            usuarios:       { curr: uniqCurr,   prev: uniqPrev,   trend: trend(uniqCurr, uniqPrev) },
            sesiones:       { curr: sesCurr,    prev: sesPrev,    trend: trend(sesCurr, sesPrev) },
            rebote:         { curr: bounceCurr, prev: bouncePrev, trend: trend(bounceCurr, bouncePrev) },
            tiempo_medio:   { curr: timeCurrR,  prev: timePrevR,  trend: trend(timeCurrR, timePrevR) },
            paginas_sesion: {
                curr: sesCurr > 0 ? Math.round(pvTotal/sesCurr*100)/100 : 0,
                prev: sesPrev > 0 ? Math.round(pvPrev/sesPrev*100)/100  : 0,
                trend: trend(sesCurr > 0 ? pvTotal/sesCurr : 0, sesPrev > 0 ? pvPrev/sesPrev : 0),
            },
            scroll_medio: Math.round(scrollCurr),
        },
        temporal:      tmpWithAnomaly.map(({ value, ...r }) => r),
        temporal_prev: tmpPrevRaw,
        fuentes:        fuentes.map(r => ({ name: r.fuente, value: r.total })),
        fuentes_tiempo: Object.values(fttMap),
        dispositivos:   dispositivos.map(r => ({ name: (r.device_type || '').charAt(0).toUpperCase() + (r.device_type || '').slice(1), value: r.total })),
        navegadores:    navegadores.map(r => ({ name: r.browser, value: r.total })),
        sistemas:       sistemas.map(r => ({ name: r.os, value: r.total })),
        paises:         paises.map(r => ({ name: r.country || 'Desconocido', value: r.total })),
        paginas: pagesCurr.map(r => {
            const p = prevMap[r.pagina] ?? 0;
            return {
                pagina: r.pagina,
                visitas: r.visitas,
                visitas_prev: p,
                usuarios: r.usuarios,
                tiempo_medio: r.tiempo_medio ?? null,
                scroll_medio: r.scroll_medio ?? null,
                trend: trend(r.visitas, p),
            };
        }),
        eventos_tipo:   eventosTipo.map(r => ({ name: r.event_type, value: r.total })),
        eventos_top:    eventosTop.map(r => ({ tipo: r.event_type, label: r.event_label, total: r.total })),
        eventos_tiempo: Object.values(evMap),
        scroll_paginas: scrollPaginas.map(r => ({ pagina: r.pagina, scroll: r.scroll_medio })),
        has_data: pvTotal > 0 || sesCurr > 0,
    });
}));

// ── POST /api/track ───────────────────────────────────────────────────────────
router.post('/track', asyncHandler(async (req, res) => {
    const data = req.body;
    if (!data?.type) return res.status(400).json({ error: 'invalid payload' });

    const e = (val, max=500) => String(val ?? '').slice(0, max);

    if (data.type === 'pageview') {
        const sid = e(data.session_id, 36);
        const uid = e(data.user_id, 36);
        if (!sid || !uid) return res.json({ ok: false });

        const device  = ['desktop','mobile','tablet'].includes(data.device) ? data.device : 'desktop';
        const ua      = req.headers['user-agent'] ?? '';
        const ip      = req.ip ?? '';
        // Anonimizar IP: guardar solo los primeros 3 octetos (IPv4) o /48 (IPv6)
        const anonIp  = ip.includes(':')
            ? ip.split(':').slice(0, 3).join(':') + '::/48'
            : ip.split('.').slice(0, 3).join('.') + '.0';
        const browser = parseBrowser(ua);
        const os      = parseOS(ua);
        const [country, region, city] = await geoFromIP(ip);

        await analytics.upsertSession({
            sid, uid,
            ip: e(anonIp, 49),
            device,
            browser:    e(browser, 80),
            os:         e(os, 80),
            screen_w:   parseInt(data.screen_w ?? 0),
            screen_h:   parseInt(data.screen_h ?? 0),
            country:    e(country, 80),
            region:     e(region, 80),
            city:       e(city, 80),
            referrer:   e(data.referrer),
            landing_page: e(data.landing_page),
            utm_source:   e(data.utm_source ?? '', 100),
            utm_medium:   e(data.utm_medium ?? '', 100),
            utm_campaign: e(data.utm_campaign ?? '', 100),
            utm_content:  e(data.utm_content ?? '', 100),
            utm_term:     e(data.utm_term ?? '', 100),
        });
        await analytics.insertPageview({
            sid, uid,
            page:       e(data.page ?? '/'),
            page_title: e(data.page_title ?? '', 200),
            referrer:   e(data.referrer),
        });
        return res.json({ ok: true });
    }

    if (data.type === 'update') {
        const sid    = e(data.session_id, 36);
        const page   = e(data.page ?? '/');
        const time   = Math.max(0, Math.min(3600, parseInt(data.time_on_page ?? 0)));
        const scroll = Math.max(0, Math.min(100,  parseInt(data.scroll_depth ?? 0)));
        await analytics.updateLastPageview({ sid, page, time_on_page: time, scroll_depth: scroll });
        return res.json({ ok: true });
    }

    if (data.type === 'event') {
        const sid    = e(data.session_id, 36);
        const uid    = e(data.user_id, 36);
        const page   = e(data.page ?? '/');
        const etype  = e(data.event_type ?? '', 50);
        const elabel = e(data.event_label ?? '', 200);
        const evalue = e(data.event_value ?? '', 200);
        if (sid && etype) {
            await analytics.insertEvent({ sid, uid, page, event_type: etype, event_label: elabel, event_value: evalue });
        }
        return res.json({ ok: true });
    }

    res.status(400).json({ error: 'unknown type' });
}));

module.exports = router;
