const { sql } = require('./client');

async function get(clave) {
    const rows = await sql`SELECT valor FROM app_config WHERE clave = ${clave} LIMIT 1`;
    return rows[0]?.valor ?? null;
}

async function getJson(clave) {
    const v = await get(clave);
    if (v == null) return null;
    try { return JSON.parse(v); } catch { return null; }
}

async function set(clave, valor) {
    await sql`
        INSERT INTO app_config (clave, valor)
        VALUES (${clave}, ${valor})
        ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor
    `;
}

async function setJson(clave, obj) {
    await set(clave, JSON.stringify(obj));
}

module.exports = { get, getJson, set, setJson };
