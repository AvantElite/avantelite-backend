const { sql } = require('./client');

// ── Sesiones de usuarios autenticados (panel admin) ──────────────────────────

async function findUserBySessionToken(token) {
    const rows = await sql`
        SELECT u.*
          FROM sesiones s
          JOIN usuarios u ON u.id = s.user_id
         WHERE s.token = ${token}
           AND s.expires_at > NOW()
         LIMIT 1
    `;
    return rows[0] || null;
}

async function createSession(user_id, token, expiresAt) {
    await sql`
        INSERT INTO sesiones (user_id, token, expires_at)
        VALUES (${user_id}, ${token}, ${expiresAt})
    `;
}

async function deleteSession(token) {
    await sql`DELETE FROM sesiones WHERE token = ${token}`;
}

async function purgeExpiredSessions() {
    await sql`DELETE FROM sesiones WHERE expires_at <= NOW()`;
}

async function deleteSessionsByUserId(user_id) {
    await sql`DELETE FROM sesiones WHERE user_id = ${user_id}`;
}

// ── Sesiones del portal de clientes (chat) ───────────────────────────────────

async function findPortalSessionByToken(token) {
    const rows = await sql`
        SELECT presupuesto_token
          FROM portal_sesiones
         WHERE token = ${token}
           AND expires_at > NOW()
         LIMIT 1
    `;
    return rows[0] || null;
}

async function createPortalSession(token, presupuesto_token, expiresAt) {
    await sql`
        INSERT INTO portal_sesiones (token, presupuesto_token, expires_at)
        VALUES (${token}, ${presupuesto_token}, ${expiresAt})
    `;
}

async function deletePortalSession(token) {
    await sql`DELETE FROM portal_sesiones WHERE token = ${token}`;
}

async function purgeExpiredPortalSessions() {
    await sql`DELETE FROM portal_sesiones WHERE expires_at <= NOW()`;
}

module.exports = {
    findUserBySessionToken,
    createSession,
    deleteSession,
    deleteSessionsByUserId,
    purgeExpiredSessions,
    findPortalSessionByToken,
    createPortalSession,
    deletePortalSession,
    purgeExpiredPortalSessions,
};
