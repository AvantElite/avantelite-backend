const { sql } = require('./client');

// Listado con datos del último presupuesto asociado.
async function listWithLastPresupuesto() {
    const rows = await sql`
        SELECT c.*,
               p.token        AS chat_token,
               p.estado       AS presupuesto_estado,
               p.chat_cerrado AS chat_cerrado,
               p.etiquetas    AS etiquetas
          FROM contactos c
          LEFT JOIN LATERAL (
              SELECT id, token, estado, chat_cerrado, etiquetas
                FROM presupuestos
               WHERE contacto_id = c.id
               ORDER BY created_at DESC
               LIMIT 1
          ) p ON TRUE
         ORDER BY c.fecha_creacion DESC
    `;
    return rows.map(r => ({
        ...r,
        leido:        r.leido === 1 || r.leido === true,
        chat_cerrado: r.chat_cerrado === 1 || r.chat_cerrado === true,
        etiquetas:    parseEtiquetas(r.etiquetas),
    }));
}

function parseEtiquetas(v) {
    if (Array.isArray(v)) return v;
    if (v == null) return [];
    if (typeof v === 'string') { try { const x = JSON.parse(v); return Array.isArray(x) ? x : []; } catch { return []; } }
    return [];
}

async function findById(id) {
    const rows = await sql`SELECT * FROM contactos WHERE id = ${id}`;
    return rows[0] || null;
}

async function markRead(id) {
    await sql`UPDATE contactos SET leido = 1, fecha_leido = NOW() WHERE id = ${id} AND leido = 0`;
}

async function setDificultad(id, dificultad) {
    await sql`UPDATE contactos SET dificultad = ${dificultad} WHERE id = ${id}`;
}

async function remove(id) {
    await sql`DELETE FROM contactos WHERE id = ${id}`;
}

// Crea un contacto desde el formulario público de la web.
async function createFromForm({ nombre, apellido, email, telefono, producto, problema, mensaje, origen }) {
    await sql`
        INSERT INTO contactos (nombre, apellido, email, telefono, producto, problema, mensaje, origen)
        VALUES (${nombre}, ${apellido}, ${email}, ${telefono}, ${producto}, ${problema}, ${mensaje}, ${origen})
    `;
}

// Crea un contacto desde el formulario AvantFix (DIY).
async function createDiy({ email, mensaje, dificultad }) {
    const rows = await sql`
        INSERT INTO contactos (email, mensaje, dificultad, origen, tipo)
        VALUES (${email}, ${mensaje}, ${dificultad}, 'DIY', 'diy')
        RETURNING id
    `;
    return rows[0]?.id ?? null;
}

// ── Estadísticas ─────────────────────────────────────────────────────────────

async function statsTotales() {
    const rows = await sql`
        SELECT
            COUNT(*)::int                            AS total,
            COUNT(*) FILTER (WHERE leido = 0)::int   AS nuevos,
            COUNT(*) FILTER (WHERE leido = 1)::int   AS leidos
          FROM contactos
    `;
    return rows[0];
}

async function statsDistribucionProducto() {
    const rows = await sql`
        SELECT producto AS name, COUNT(*)::int AS value
          FROM contactos
         GROUP BY producto
    `;
    return rows;
}

async function statsRecientes() {
    return await sql`
        SELECT nombre, apellido, email, producto, problema, dificultad, tipo, fecha_creacion, leido
          FROM contactos
         ORDER BY fecha_creacion DESC
         LIMIT 8
    `;
}

async function statsVolumenMensual() {
    return await sql`
        SELECT to_char(date_trunc('month', fecha_creacion), 'Mon') AS mes,
               COUNT(*)::int                                       AS recibidos,
               COUNT(*) FILTER (WHERE leido = 1)::int              AS leidos
          FROM contactos
         WHERE fecha_creacion > NOW() - INTERVAL '12 months'
         GROUP BY date_trunc('month', fecha_creacion)
         ORDER BY date_trunc('month', fecha_creacion) ASC
    `;
}

async function statsContactosDiarios() {
    return await sql`
        SELECT to_char(date_trunc('day', fecha_creacion), 'Dy') AS dia,
               COUNT(*)::int                                    AS contactos
          FROM contactos
         WHERE fecha_creacion > NOW() - INTERVAL '7 days'
         GROUP BY date_trunc('day', fecha_creacion)
         ORDER BY date_trunc('day', fecha_creacion) ASC
    `;
}

// Devuelve { total, leidos } para el mes ofreciendo offsetMonths (0=actual, 1=anterior).
async function statsMes(offsetMonths = 0) {
    const rows = await sql`
        SELECT COUNT(*)::int                          AS total,
               COUNT(*) FILTER (WHERE leido = 1)::int AS leidos
          FROM contactos
         WHERE date_trunc('month', fecha_creacion)
             = date_trunc('month', NOW() - (${offsetMonths} || ' months')::interval)
    `;
    return rows[0];
}

// Tiempo medio de respuesta en minutos para el mes con offset.
async function statsTiempoRespuestaMes(offsetMonths = 0) {
    const rows = await sql`
        SELECT AVG(EXTRACT(EPOCH FROM (fecha_leido - fecha_creacion)) / 60.0) AS minutos
          FROM contactos
         WHERE fecha_leido IS NOT NULL
           AND date_trunc('month', fecha_creacion)
             = date_trunc('month', NOW() - (${offsetMonths} || ' months')::interval)
    `;
    return rows[0];
}

module.exports = {
    listWithLastPresupuesto, findById,
    markRead, setDificultad, remove,
    createFromForm, createDiy,
    statsTotales, statsDistribucionProducto, statsRecientes,
    statsVolumenMensual, statsContactosDiarios,
    statsMes, statsTiempoRespuestaMes,
};
