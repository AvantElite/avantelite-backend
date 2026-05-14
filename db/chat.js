const { sql } = require('./client');

async function listMensajes(token) {
    return await sql`
        SELECT sender, sender_nombre, mensaje, archivo, created_at
          FROM chat_mensajes
         WHERE token = ${token}
         ORDER BY created_at ASC
    `;
}

async function listMensajesParaIA(token, limit = 30) {
    return await sql`
        SELECT sender, mensaje
          FROM chat_mensajes
         WHERE token = ${token}
         ORDER BY created_at ASC
         LIMIT ${limit}
    `;
}

async function insertMensaje({ token, sender, mensaje, archivo = null }) {
    const rows = await sql`
        INSERT INTO chat_mensajes (token, sender, mensaje, archivo)
        VALUES (${token}, ${sender}, ${mensaje}, ${archivo})
        RETURNING id
    `;
    return rows[0].id;
}

// Historial agregado para el panel del técnico.
async function listHistorial() {
    const rows = await sql`
        SELECT p.token, p.contacto_id, p.chat_cerrado, p.etiquetas, p.created_at AS presupuesto_fecha,
               c.nombre, c.apellido, c.email,
               COUNT(m.id)::int   AS total_mensajes,
               MAX(m.mensaje)     AS ultimo_mensaje,
               MAX(m.created_at)  AS ultima_fecha
          FROM presupuestos p
          JOIN contactos c ON c.id = p.contacto_id
          LEFT JOIN chat_mensajes m ON m.token = p.token
         GROUP BY p.token, p.contacto_id, p.chat_cerrado, p.etiquetas, p.created_at,
                  c.nombre, c.apellido, c.email
         ORDER BY ultima_fecha DESC NULLS LAST, p.created_at DESC
    `;
    return rows.map(r => ({
        ...r,
        chat_cerrado: r.chat_cerrado === 1 || r.chat_cerrado === true,
        etiquetas:    parseEtiquetas(r.etiquetas),
        total_mensajes: r.total_mensajes ?? 0,
    }));
}

function parseEtiquetas(v) {
    if (Array.isArray(v)) return v;
    if (v == null) return [];
    if (typeof v === 'string') { try { const x = JSON.parse(v); return Array.isArray(x) ? x : []; } catch { return []; } }
    return [];
}

module.exports = { listMensajes, listMensajesParaIA, insertMensaje, listHistorial };
