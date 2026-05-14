const { sql } = require('./client');

// Borra eventos/pageviews/sesiones de analíticas con más de N días.
async function purgeAnalyticsOlderThan(days) {
    if (!days || days <= 0) return;
    await sql`DELETE FROM av_events    WHERE created_at < NOW() - (${days} || ' days')::interval`;
    await sql`DELETE FROM av_pageviews WHERE created_at < NOW() - (${days} || ' days')::interval`;
    await sql`DELETE FROM av_sessions  WHERE created_at < NOW() - (${days} || ' days')::interval`;
}

module.exports = { purgeAnalyticsOlderThan };
