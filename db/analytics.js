const { sql } = require('./client');

// Helpers para fragmentos SQL parametrizados por granularidad y tabla.
function dateGroupExpr(gran, table) {
    const col = `${table}.created_at`;
    if (gran === 'week')  return sql.unsafe(`'S' || EXTRACT(week FROM ${col})::text`);
    if (gran === 'month') return sql.unsafe(`to_char(${col}, 'Mon YYYY')`);
    return sql.unsafe(`to_char(${col}, 'DD Mon')`);
}

function dateOrderExpr(gran, table) {
    const col = `${table}.created_at`;
    if (gran === 'week')  return sql.unsafe(`MIN(date_trunc('week',  ${col}))`);
    if (gran === 'month') return sql.unsafe(`MIN(date_trunc('month', ${col}))`);
    return sql.unsafe(`MIN(date_trunc('day', ${col}))`);
}

// CASE para normalizar página
const PAGE_CASE = sql.unsafe(`
    CASE
        WHEN page LIKE '%/index.html%' OR page = '/' OR page LIKE '%/Avantservice/%' THEN 'Inicio'
        WHEN page LIKE '%/blog.html%' THEN 'Blog'
        WHEN page LIKE '%/calderas.html%' THEN 'Calderas'
        WHEN page LIKE '%/electrodomesticos.html%' THEN 'Electrodomésticos'
        WHEN page LIKE '%/tv.html%' THEN 'Televisores'
        WHEN page LIKE '%/articulo.html%' THEN 'Artículo'
        WHEN page LIKE '%/success.html%' THEN 'Formulario OK'
        ELSE page
    END
`);

// CASE para clasificar la fuente de tráfico
const SOURCE_CASE = sql.unsafe(`
    CASE
        WHEN utm_source <> '' THEN
            CASE utm_medium
                WHEN 'cpc'  THEN 'Pago'
                WHEN 'paid' THEN 'Pago'
                ELSE 'UTM:' || utm_source
            END
        WHEN referrer = '' OR referrer IS NULL THEN 'Directo'
        WHEN referrer LIKE '%google.%' OR referrer LIKE '%bing.%' OR referrer LIKE '%yahoo.%' OR referrer LIKE '%duckduckgo.%' THEN 'Orgánico'
        WHEN referrer LIKE '%facebook.%' OR referrer LIKE '%instagram.%' OR referrer LIKE '%twitter.%' OR referrer LIKE '%x.com%' OR referrer LIKE '%linkedin.%' OR referrer LIKE '%tiktok.%' OR referrer LIKE '%youtube.%' THEN 'Social'
        ELSE 'Referido'
    END
`);

// Devuelve el primer escalar (numérico) de la fila, 0 si no hay datos.
function scalar(rows) {
    if (!rows.length) return 0;
    const v = Object.values(rows[0])[0];
    return v == null ? 0 : parseFloat(v);
}

// ── KPIs ──────────────────────────────────────────────────────────────────────

async function pageviewsCount(rangeDays) {
    return scalar(await sql`SELECT COUNT(*) FROM av_pageviews pv WHERE pv.created_at >= NOW() - (${rangeDays} || ' days')::interval`);
}

async function pageviewsCountBetween(prev, range) {
    return scalar(await sql`
        SELECT COUNT(*)
          FROM av_pageviews pv
         WHERE pv.created_at BETWEEN NOW() - (${prev} || ' days')::interval AND NOW() - (${range} || ' days')::interval
    `);
}

async function uniqueUsers(rangeDays) {
    return scalar(await sql`SELECT COUNT(DISTINCT s.user_id) FROM av_sessions s WHERE s.created_at >= NOW() - (${rangeDays} || ' days')::interval`);
}

async function uniqueUsersBetween(prev, range) {
    return scalar(await sql`
        SELECT COUNT(DISTINCT s.user_id)
          FROM av_sessions s
         WHERE s.created_at BETWEEN NOW() - (${prev} || ' days')::interval AND NOW() - (${range} || ' days')::interval
    `);
}

async function sessionsCount(rangeDays) {
    return scalar(await sql`SELECT COUNT(*) FROM av_sessions s WHERE s.created_at >= NOW() - (${rangeDays} || ' days')::interval`);
}

async function sessionsCountBetween(prev, range) {
    return scalar(await sql`
        SELECT COUNT(*)
          FROM av_sessions s
         WHERE s.created_at BETWEEN NOW() - (${prev} || ' days')::interval AND NOW() - (${range} || ' days')::interval
    `);
}

async function singlePageSessions(rangeDays) {
    return scalar(await sql`
        SELECT COUNT(*)
          FROM av_sessions s
         WHERE s.page_count = 1
           AND s.created_at >= NOW() - (${rangeDays} || ' days')::interval
    `);
}

async function singlePageSessionsBetween(prev, range) {
    return scalar(await sql`
        SELECT COUNT(*)
          FROM av_sessions s
         WHERE s.page_count = 1
           AND s.created_at BETWEEN NOW() - (${prev} || ' days')::interval AND NOW() - (${range} || ' days')::interval
    `);
}

async function avgTimeOnPage(rangeDays) {
    return scalar(await sql`
        SELECT AVG(pv.time_on_page)
          FROM av_pageviews pv
         WHERE pv.time_on_page > 0
           AND pv.created_at >= NOW() - (${rangeDays} || ' days')::interval
    `);
}

async function avgTimeOnPageBetween(prev, range) {
    return scalar(await sql`
        SELECT AVG(pv.time_on_page)
          FROM av_pageviews pv
         WHERE pv.time_on_page > 0
           AND pv.created_at BETWEEN NOW() - (${prev} || ' days')::interval AND NOW() - (${range} || ' days')::interval
    `);
}

async function avgScrollDepth(rangeDays) {
    return scalar(await sql`
        SELECT AVG(pv.scroll_depth)
          FROM av_pageviews pv
         WHERE pv.scroll_depth > 0
           AND pv.created_at >= NOW() - (${rangeDays} || ' days')::interval
    `);
}

// ── Series temporales y agregaciones ─────────────────────────────────────────

async function temporalSeries(rangeDays, gran) {
    const dg = dateGroupExpr(gran, 'pv');
    const od = dateOrderExpr(gran, 'pv');
    return await sql`
        SELECT ${dg} AS label,
               COUNT(*)::int AS visitas,
               COUNT(DISTINCT pv.user_id)::int AS usuarios
          FROM av_pageviews pv
         WHERE pv.created_at >= NOW() - (${rangeDays} || ' days')::interval
         GROUP BY label
         ORDER BY ${od} ASC
    `;
}

async function temporalSeriesBetween(prev, range, gran) {
    const dg = dateGroupExpr(gran, 'pv');
    const od = dateOrderExpr(gran, 'pv');
    return await sql`
        SELECT ${dg} AS label,
               COUNT(*)::int AS visitas,
               COUNT(DISTINCT pv.user_id)::int AS usuarios
          FROM av_pageviews pv
         WHERE pv.created_at BETWEEN NOW() - (${prev} || ' days')::interval AND NOW() - (${range} || ' days')::interval
         GROUP BY label
         ORDER BY ${od} ASC
    `;
}

async function fuentesTiempo(rangeDays, gran) {
    const dg = dateGroupExpr(gran, 's');
    const od = dateOrderExpr(gran, 's');
    return await sql`
        SELECT ${dg} AS label,
               ${SOURCE_CASE} AS fuente,
               COUNT(*)::int AS total
          FROM av_sessions s
         WHERE s.created_at >= NOW() - (${rangeDays} || ' days')::interval
         GROUP BY label, fuente
         ORDER BY ${od} ASC
    `;
}

async function topPages(rangeDays) {
    return await sql`
        SELECT ${PAGE_CASE} AS pagina,
               COUNT(*)::int AS visitas,
               COUNT(DISTINCT pv.user_id)::int AS usuarios,
               ROUND(AVG(pv.time_on_page))::int AS tiempo_medio,
               ROUND(AVG(pv.scroll_depth))::int AS scroll_medio
          FROM av_pageviews pv
         WHERE pv.created_at >= NOW() - (${rangeDays} || ' days')::interval
         GROUP BY pagina
         ORDER BY visitas DESC
         LIMIT 10
    `;
}

async function topPagesPrev(prev, range) {
    return await sql`
        SELECT ${PAGE_CASE} AS pagina, COUNT(*)::int AS visitas
          FROM av_pageviews pv
         WHERE pv.created_at BETWEEN NOW() - (${prev} || ' days')::interval AND NOW() - (${range} || ' days')::interval
         GROUP BY pagina
    `;
}

async function eventosTiempo(rangeDays, gran) {
    const dg = dateGroupExpr(gran, 'e');
    const od = dateOrderExpr(gran, 'e');
    return await sql`
        SELECT ${dg} AS label, event_type, COUNT(*)::int AS total
          FROM av_events e
         WHERE e.created_at >= NOW() - (${rangeDays} || ' days')::interval
         GROUP BY label, event_type
         ORDER BY ${od} ASC
    `;
}

async function fuentes(rangeDays) {
    return await sql`
        SELECT ${SOURCE_CASE} AS fuente, COUNT(*)::int AS total
          FROM av_sessions s
         WHERE s.created_at >= NOW() - (${rangeDays} || ' days')::interval
         GROUP BY fuente
         ORDER BY total DESC
    `;
}

async function dispositivos(rangeDays) {
    return await sql`
        SELECT device_type, COUNT(*)::int AS total
          FROM av_sessions s
         WHERE s.created_at >= NOW() - (${rangeDays} || ' days')::interval
         GROUP BY device_type
         ORDER BY total DESC
    `;
}

async function navegadores(rangeDays) {
    return await sql`
        SELECT browser, COUNT(*)::int AS total
          FROM av_sessions s
         WHERE s.created_at >= NOW() - (${rangeDays} || ' days')::interval
         GROUP BY browser
         ORDER BY total DESC
         LIMIT 6
    `;
}

async function sistemas(rangeDays) {
    return await sql`
        SELECT os, COUNT(*)::int AS total
          FROM av_sessions s
         WHERE s.created_at >= NOW() - (${rangeDays} || ' days')::interval
         GROUP BY os
         ORDER BY total DESC
         LIMIT 6
    `;
}

async function paises(rangeDays) {
    return await sql`
        SELECT country, COUNT(*)::int AS total
          FROM av_sessions s
         WHERE s.created_at >= NOW() - (${rangeDays} || ' days')::interval
           AND country <> ''
         GROUP BY country
         ORDER BY total DESC
         LIMIT 10
    `;
}

async function eventosTipo(rangeDays) {
    return await sql`
        SELECT event_type, COUNT(*)::int AS total
          FROM av_events e
         WHERE e.created_at >= NOW() - (${rangeDays} || ' days')::interval
         GROUP BY event_type
         ORDER BY total DESC
    `;
}

async function eventosTop(rangeDays) {
    return await sql`
        SELECT event_type, event_label, COUNT(*)::int AS total
          FROM av_events e
         WHERE e.created_at >= NOW() - (${rangeDays} || ' days')::interval
         GROUP BY event_type, event_label
         ORDER BY total DESC
         LIMIT 10
    `;
}

async function scrollPaginas(rangeDays) {
    return await sql`
        SELECT ${PAGE_CASE} AS pagina,
               ROUND(AVG(pv.scroll_depth))::int AS scroll_medio
          FROM av_pageviews pv
         WHERE pv.created_at >= NOW() - (${rangeDays} || ' days')::interval
           AND pv.scroll_depth > 0
         GROUP BY pagina
         ORDER BY scroll_medio DESC
    `;
}

// ── Tracking (POST /api/track) ───────────────────────────────────────────────

async function upsertSession({
    sid, uid, ip, device, browser, os, screen_w, screen_h,
    country, region, city, referrer, landing_page,
    utm_source, utm_medium, utm_campaign, utm_content, utm_term,
}) {
    await sql`
        INSERT INTO av_sessions
            (id, user_id, ip, device_type, browser, os, screen_w, screen_h,
             country, region, city, referrer, landing_page,
             utm_source, utm_medium, utm_campaign, utm_content, utm_term, page_count)
        VALUES
            (${sid}, ${uid}, ${ip}, ${device}, ${browser}, ${os}, ${screen_w}, ${screen_h},
             ${country}, ${region}, ${city}, ${referrer}, ${landing_page},
             ${utm_source}, ${utm_medium}, ${utm_campaign}, ${utm_content}, ${utm_term}, 1)
        ON CONFLICT (id) DO UPDATE SET page_count = av_sessions.page_count + 1
    `;
}

async function insertPageview({ sid, uid, page, page_title, referrer }) {
    await sql`
        INSERT INTO av_pageviews (session_id, user_id, page, page_title, referrer)
        VALUES (${sid}, ${uid}, ${page}, ${page_title}, ${referrer})
    `;
}

// Actualiza el último pageview de una sesión/página con tiempo y scroll.
async function updateLastPageview({ sid, page, time_on_page, scroll_depth }) {
    await sql`
        UPDATE av_pageviews
           SET time_on_page = ${time_on_page},
               scroll_depth = ${scroll_depth}
         WHERE id = (
             SELECT id FROM av_pageviews
              WHERE session_id = ${sid} AND page = ${page}
              ORDER BY id DESC
              LIMIT 1
         )
    `;
}

async function insertEvent({ sid, uid, page, event_type, event_label, event_value }) {
    await sql`
        INSERT INTO av_events (session_id, user_id, page, event_type, event_label, event_value)
        VALUES (${sid}, ${uid}, ${page}, ${event_type}, ${event_label}, ${event_value})
    `;
}

module.exports = {
    pageviewsCount, pageviewsCountBetween,
    uniqueUsers, uniqueUsersBetween,
    sessionsCount, sessionsCountBetween,
    singlePageSessions, singlePageSessionsBetween,
    avgTimeOnPage, avgTimeOnPageBetween, avgScrollDepth,
    temporalSeries, temporalSeriesBetween,
    fuentesTiempo, topPages, topPagesPrev, eventosTiempo,
    fuentes, dispositivos, navegadores, sistemas, paises,
    eventosTipo, eventosTop, scrollPaginas,
    upsertSession, insertPageview, updateLastPageview, insertEvent,
};
