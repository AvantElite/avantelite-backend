const { Router } = require('express');
const pool   = require('../db');
const { asyncHandler, parseBrowser, parseOS, geoFromIP } = require('../helpers');
const { requireAuth } = require('../auth');

const router = Router();

// ── GET /api/analytics ────────────────────────────────────────────────────────
router.get('/analytics', asyncHandler(async (req, res) => {
    if (!await requireAuth(req, res)) return;
    const range = ['7','30','90'].includes(req.query.range) ? parseInt(req.query.range) : 30;
    const gran  = ['day','week','month'].includes(req.query.gran) ? req.query.gran : 'day';

    const dgMap = { day: "DATE_FORMAT(created_at,'%d %b')", week: "CONCAT('S',WEEK(created_at,1))", month: "DATE_FORMAT(created_at,'%b %Y')" };
    const dgP   = dgMap[gran].replace('created_at','pv.created_at');
    const dgS   = dgMap[gran].replace('created_at','s.created_at');
    const dgE   = dgMap[gran].replace('created_at','e.created_at');
    const prev  = range * 2;

    const pageCase   = "CASE WHEN page LIKE '%/index.html%' OR page='/' OR page LIKE '%/Avantservice/%' THEN 'Inicio' WHEN page LIKE '%/blog.html%' THEN 'Blog' WHEN page LIKE '%/calderas.html%' THEN 'Calderas' WHEN page LIKE '%/electrodomesticos.html%' THEN 'Electrodomésticos' WHEN page LIKE '%/tv.html%' THEN 'Televisores' WHEN page LIKE '%/articulo.html%' THEN 'Artículo' WHEN page LIKE '%/success.html%' THEN 'Formulario OK' ELSE page END";
    const sourceCase = "CASE WHEN utm_source!='' THEN CASE utm_medium WHEN 'cpc' THEN 'Pago' WHEN 'paid' THEN 'Pago' ELSE CONCAT('UTM:',utm_source) END WHEN referrer='' OR referrer IS NULL THEN 'Directo' WHEN referrer LIKE '%google.%' OR referrer LIKE '%bing.%' OR referrer LIKE '%yahoo.%' OR referrer LIKE '%duckduckgo.%' THEN 'Orgánico' WHEN referrer LIKE '%facebook.%' OR referrer LIKE '%instagram.%' OR referrer LIKE '%twitter.%' OR referrer LIKE '%x.com%' OR referrer LIKE '%linkedin.%' OR referrer LIKE '%tiktok.%' OR referrer LIKE '%youtube.%' THEN 'Social' ELSE 'Referido' END";

    const sc  = async (sql) => { const [[r]] = await pool.query(sql); return r ? parseFloat(Object.values(r)[0]) : 0; };
    const rws = async (sql) => { const [r]   = await pool.query(sql); return r; };

    const pvTotal    = await sc(`SELECT COUNT(*) FROM av_pageviews pv WHERE pv.created_at>=DATE_SUB(NOW(),INTERVAL ${range} DAY)`);
    const pvPrev     = await sc(`SELECT COUNT(*) FROM av_pageviews pv WHERE pv.created_at BETWEEN DATE_SUB(NOW(),INTERVAL ${prev} DAY) AND DATE_SUB(NOW(),INTERVAL ${range} DAY)`);
    const uniqCurr   = await sc(`SELECT COUNT(DISTINCT s.user_id) FROM av_sessions s WHERE s.created_at>=DATE_SUB(NOW(),INTERVAL ${range} DAY)`);
    const uniqPrev   = await sc(`SELECT COUNT(DISTINCT s.user_id) FROM av_sessions s WHERE s.created_at BETWEEN DATE_SUB(NOW(),INTERVAL ${prev} DAY) AND DATE_SUB(NOW(),INTERVAL ${range} DAY)`);
    const sesCurr    = await sc(`SELECT COUNT(*) FROM av_sessions s WHERE s.created_at>=DATE_SUB(NOW(),INTERVAL ${range} DAY)`);
    const sesPrev    = await sc(`SELECT COUNT(*) FROM av_sessions s WHERE s.created_at BETWEEN DATE_SUB(NOW(),INTERVAL ${prev} DAY) AND DATE_SUB(NOW(),INTERVAL ${range} DAY)`);
    const bounceCurr = sesCurr > 0 ? Math.round(await sc(`SELECT COUNT(*) FROM av_sessions s WHERE s.page_count=1 AND s.created_at>=DATE_SUB(NOW(),INTERVAL ${range} DAY)`) / sesCurr  * 1000) / 10 : 0;
    const bouncePrev = sesPrev > 0 ? Math.round(await sc(`SELECT COUNT(*) FROM av_sessions s WHERE s.page_count=1 AND s.created_at BETWEEN DATE_SUB(NOW(),INTERVAL ${prev} DAY) AND DATE_SUB(NOW(),INTERVAL ${range} DAY)`) / sesPrev * 1000) / 10 : 0;
    const timeCurr   = Math.round(await sc(`SELECT AVG(pv.time_on_page) FROM av_pageviews pv WHERE pv.time_on_page>0 AND pv.created_at>=DATE_SUB(NOW(),INTERVAL ${range} DAY)`));
    const timePrev   = Math.round(await sc(`SELECT AVG(pv.time_on_page) FROM av_pageviews pv WHERE pv.time_on_page>0 AND pv.created_at BETWEEN DATE_SUB(NOW(),INTERVAL ${prev} DAY) AND DATE_SUB(NOW(),INTERVAL ${range} DAY)`));
    const scrollCurr = Math.round(await sc(`SELECT AVG(pv.scroll_depth) FROM av_pageviews pv WHERE pv.scroll_depth>0 AND pv.created_at>=DATE_SUB(NOW(),INTERVAL ${range} DAY)`));

    const trend = (c, p) => p === 0 ? null : Math.round((c - p) / p * 1000) / 10;

    const anomalies = (series) => {
        const vals = series.map(r => r.value);
        if (vals.length < 3) return series.map(r => ({ ...r, anomalia: false }));
        const mean = vals.reduce((a,b)=>a+b,0)/vals.length;
        const std  = Math.sqrt(vals.reduce((a,b)=>a+(b-mean)**2,0)/vals.length);
        return series.map(r => ({ ...r, anomalia: std > 0 && Math.abs(r.value - mean) / std > 2.0 }));
    };

    const tmpRaw         = await rws(`SELECT ${dgP} as label, COUNT(*) as visitas, COUNT(DISTINCT pv.user_id) as usuarios FROM av_pageviews pv WHERE pv.created_at>=DATE_SUB(NOW(),INTERVAL ${range} DAY) GROUP BY label ORDER BY MIN(pv.created_at) ASC`);
    const tmpWithAnomaly = anomalies(tmpRaw.map(r => ({ label: r.label, visitas: parseInt(r.visitas), usuarios: parseInt(r.usuarios), value: parseInt(r.visitas) })));

    const fttRaw = await rws(`SELECT ${dgS} as label, ${sourceCase} as fuente, COUNT(*) as total FROM av_sessions s WHERE s.created_at>=DATE_SUB(NOW(),INTERVAL ${range} DAY) GROUP BY label,fuente ORDER BY MIN(s.created_at) ASC`);
    const fttMap = {}; fttRaw.forEach(r => { if(!fttMap[r.label]) fttMap[r.label]={label:r.label}; fttMap[r.label][r.fuente]=parseInt(r.total); });

    const pagesCurr = await rws(`SELECT ${pageCase} as pagina, COUNT(*) as visitas, COUNT(DISTINCT pv.user_id) as usuarios, ROUND(AVG(pv.time_on_page)) as tiempo_medio, ROUND(AVG(pv.scroll_depth)) as scroll_medio FROM av_pageviews pv WHERE pv.created_at>=DATE_SUB(NOW(),INTERVAL ${range} DAY) GROUP BY pagina ORDER BY visitas DESC LIMIT 10`);
    const pagesPrev = await rws(`SELECT ${pageCase} as pagina, COUNT(*) as visitas FROM av_pageviews pv WHERE pv.created_at BETWEEN DATE_SUB(NOW(),INTERVAL ${prev} DAY) AND DATE_SUB(NOW(),INTERVAL ${range} DAY) GROUP BY pagina`);
    const prevMap   = {}; pagesPrev.forEach(r => prevMap[r.pagina] = parseInt(r.visitas));

    const evRaw = await rws(`SELECT ${dgE} as label, event_type, COUNT(*) as total FROM av_events e WHERE e.created_at>=DATE_SUB(NOW(),INTERVAL ${range} DAY) GROUP BY label,event_type ORDER BY MIN(e.created_at) ASC`);
    const evMap = {}; evRaw.forEach(r => { if(!evMap[r.label]) evMap[r.label]={label:r.label}; evMap[r.label][r.event_type]=parseInt(r.total); });

    res.json({
        kpis: {
            visitas:        { curr: pvTotal,    prev: pvPrev,    trend: trend(pvTotal, pvPrev) },
            usuarios:       { curr: uniqCurr,   prev: uniqPrev,  trend: trend(uniqCurr, uniqPrev) },
            sesiones:       { curr: sesCurr,    prev: sesPrev,   trend: trend(sesCurr, sesPrev) },
            rebote:         { curr: bounceCurr, prev: bouncePrev,trend: trend(bounceCurr, bouncePrev) },
            tiempo_medio:   { curr: timeCurr,   prev: timePrev,  trend: trend(timeCurr, timePrev) },
            paginas_sesion: { curr: sesCurr>0 ? Math.round(pvTotal/sesCurr*100)/100 : 0, prev: sesPrev>0 ? Math.round(pvPrev/sesPrev*100)/100 : 0, trend: trend(sesCurr>0?pvTotal/sesCurr:0, sesPrev>0?pvPrev/sesPrev:0) },
            scroll_medio: scrollCurr,
        },
        temporal:      tmpWithAnomaly.map(({ value, ...r }) => r),
        temporal_prev: (await rws(`SELECT ${dgP} as label, COUNT(*) as visitas, COUNT(DISTINCT pv.user_id) as usuarios FROM av_pageviews pv WHERE pv.created_at BETWEEN DATE_SUB(NOW(),INTERVAL ${prev} DAY) AND DATE_SUB(NOW(),INTERVAL ${range} DAY) GROUP BY label ORDER BY MIN(pv.created_at) ASC`)).map(r=>({label:r.label,visitas:parseInt(r.visitas),usuarios:parseInt(r.usuarios)})),
        fuentes:        (await rws(`SELECT ${sourceCase} as fuente, COUNT(*) as total FROM av_sessions s WHERE s.created_at>=DATE_SUB(NOW(),INTERVAL ${range} DAY) GROUP BY fuente ORDER BY total DESC`)).map(r=>({name:r.fuente,value:parseInt(r.total)})),
        fuentes_tiempo: Object.values(fttMap),
        dispositivos:   (await rws(`SELECT device_type, COUNT(*) as total FROM av_sessions s WHERE s.created_at>=DATE_SUB(NOW(),INTERVAL ${range} DAY) GROUP BY device_type ORDER BY total DESC`)).map(r=>({name:r.device_type.charAt(0).toUpperCase()+r.device_type.slice(1),value:parseInt(r.total)})),
        navegadores:    (await rws(`SELECT browser, COUNT(*) as total FROM av_sessions s WHERE s.created_at>=DATE_SUB(NOW(),INTERVAL ${range} DAY) GROUP BY browser ORDER BY total DESC LIMIT 6`)).map(r=>({name:r.browser,value:parseInt(r.total)})),
        sistemas:       (await rws(`SELECT os, COUNT(*) as total FROM av_sessions s WHERE s.created_at>=DATE_SUB(NOW(),INTERVAL ${range} DAY) GROUP BY os ORDER BY total DESC LIMIT 6`)).map(r=>({name:r.os,value:parseInt(r.total)})),
        paises:         (await rws(`SELECT country, COUNT(*) as total FROM av_sessions s WHERE s.created_at>=DATE_SUB(NOW(),INTERVAL ${range} DAY) AND country!='' GROUP BY country ORDER BY total DESC LIMIT 10`)).map(r=>({name:r.country||'Desconocido',value:parseInt(r.total)})),
        paginas:        pagesCurr.map(r => { const p=prevMap[r.pagina]??0; const c=parseInt(r.visitas); return { pagina:r.pagina, visitas:c, visitas_prev:p, usuarios:parseInt(r.usuarios), tiempo_medio:r.tiempo_medio!=null?parseInt(r.tiempo_medio):null, scroll_medio:r.scroll_medio!=null?parseInt(r.scroll_medio):null, trend:trend(c,p) }; }),
        eventos_tipo:   (await rws(`SELECT event_type, COUNT(*) as total FROM av_events e WHERE e.created_at>=DATE_SUB(NOW(),INTERVAL ${range} DAY) GROUP BY event_type ORDER BY total DESC`)).map(r=>({name:r.event_type,value:parseInt(r.total)})),
        eventos_top:    (await rws(`SELECT event_type, event_label, COUNT(*) as total FROM av_events e WHERE e.created_at>=DATE_SUB(NOW(),INTERVAL ${range} DAY) GROUP BY event_type,event_label ORDER BY total DESC LIMIT 10`)).map(r=>({tipo:r.event_type,label:r.event_label,total:parseInt(r.total)})),
        eventos_tiempo: Object.values(evMap),
        scroll_paginas: (await rws(`SELECT ${pageCase} as pagina, ROUND(AVG(pv.scroll_depth)) as scroll_medio FROM av_pageviews pv WHERE pv.created_at>=DATE_SUB(NOW(),INTERVAL ${range} DAY) AND pv.scroll_depth>0 GROUP BY pagina ORDER BY scroll_medio DESC`)).map(r=>({pagina:r.pagina,scroll:parseInt(r.scroll_medio)})),
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
            ? ip.split(':').slice(0, 3).join(':') + '::/48'   // IPv6
            : ip.split('.').slice(0, 3).join('.') + '.0';     // IPv4
        const browser = parseBrowser(ua);
        const os      = parseOS(ua);
        const [country, region, city] = await geoFromIP(ip);  // geo antes de anonimizar

        await pool.query(
            "INSERT INTO av_sessions (id,user_id,ip,device_type,browser,os,screen_w,screen_h,country,region,city,referrer,landing_page,utm_source,utm_medium,utm_campaign,utm_content,utm_term,page_count) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1) ON DUPLICATE KEY UPDATE page_count=page_count+1",
            [sid,uid,e(anonIp,49),device,e(browser,80),e(os,80),parseInt(data.screen_w??0),parseInt(data.screen_h??0),e(country,80),e(region,80),e(city,80),e(data.referrer),e(data.landing_page),e(data.utm_source??'',100),e(data.utm_medium??'',100),e(data.utm_campaign??'',100),e(data.utm_content??'',100),e(data.utm_term??'',100)]
        );
        await pool.query(
            "INSERT INTO av_pageviews (session_id,user_id,page,page_title,referrer) VALUES (?,?,?,?,?)",
            [sid,uid,e(data.page??'/'),e(data.page_title??'',200),e(data.referrer)]
        );
        return res.json({ ok: true });
    }

    if (data.type === 'update') {
        const sid    = e(data.session_id, 36);
        const page   = e(data.page ?? '/');
        const time   = Math.max(0, Math.min(3600, parseInt(data.time_on_page ?? 0)));
        const scroll = Math.max(0, Math.min(100,  parseInt(data.scroll_depth ?? 0)));
        await pool.query("UPDATE av_pageviews SET time_on_page=?,scroll_depth=? WHERE session_id=? AND page=? ORDER BY id DESC LIMIT 1", [time,scroll,sid,page]);
        return res.json({ ok: true });
    }

    if (data.type === 'event') {
        const sid    = e(data.session_id, 36);
        const uid    = e(data.user_id, 36);
        const page   = e(data.page ?? '/');
        const etype  = e(data.event_type ?? '', 50);
        const elabel = e(data.event_label ?? '', 200);
        const evalue = e(data.event_value ?? '', 200);
        if (sid && etype)
            await pool.query("INSERT INTO av_events (session_id,user_id,page,event_type,event_label,event_value) VALUES (?,?,?,?,?,?)", [sid,uid,page,etype,elabel,evalue]);
        return res.json({ ok: true });
    }

    res.status(400).json({ error: 'unknown type' });
}));

module.exports = router;
