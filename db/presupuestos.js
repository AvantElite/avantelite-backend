const { sql } = require('./client');

function parseLineas(v) {
    if (Array.isArray(v)) return v;
    if (v == null) return [];
    if (typeof v === 'string') { try { return JSON.parse(v); } catch { return []; } }
    return [];
}

// Devuelve el presupuesto + datos del contacto, o null.
async function findByTokenWithContacto(token) {
    const rows = await sql`
        SELECT p.*, c.email, c.nombre, c.apellido
          FROM presupuestos p
          JOIN contactos c ON c.id = p.contacto_id
         WHERE p.token = ${token}
         LIMIT 1
    `;
    return rows[0] || null;
}

async function create({ contacto_id, token, lineas, total, mensaje, notas }) {
    await sql`
        INSERT INTO presupuestos (contacto_id, token, lineas, total, mensaje, notas)
        VALUES (${contacto_id}, ${token}, ${sql.json(lineas)}, ${total}, ${mensaje}, ${notas})
    `;
}

async function update(token, { lineas, total, mensaje, notas }) {
    await sql`
        UPDATE presupuestos
           SET lineas = ${sql.json(lineas)}, total = ${total}, mensaje = ${mensaje}, notas = ${notas}
         WHERE token = ${token}
    `;
}

// Marca como aceptado/rechazado solo si está pendiente. Devuelve si afectó alguna fila.
async function setEstadoSiPendiente(token, estado) {
    const rows = await sql`
        UPDATE presupuestos
           SET estado = ${estado}, fecha_respuesta = NOW()
         WHERE token = ${token} AND estado = 'pendiente'
         RETURNING id
    `;
    return rows.length > 0;
}

async function setChatCerrado(token, cerrado) {
    await sql`UPDATE presupuestos SET chat_cerrado = ${cerrado ? 1 : 0} WHERE token = ${token}`;
}

async function setEtiquetas(token, etiquetas) {
    await sql`UPDATE presupuestos SET etiquetas = ${sql.json(etiquetas)} WHERE token = ${token}`;
}

// Devuelve { id, chat_cerrado } o null.
async function findIdAndCerrado(token) {
    const rows = await sql`SELECT id, chat_cerrado FROM presupuestos WHERE token = ${token}`;
    return rows[0] || null;
}

// Devuelve { chat_cerrado } o null.
async function findChatCerrado(token) {
    const rows = await sql`SELECT chat_cerrado FROM presupuestos WHERE token = ${token} LIMIT 1`;
    return rows[0] || null;
}

// Para presupuesto/sugerir cuando entra por token.
async function findContactoByPresupuestoToken(token) {
    const rows = await sql`
        SELECT c.*, p.token AS chat_token
          FROM presupuestos p
          JOIN contactos c ON c.id = p.contacto_id
         WHERE p.token = ${token}
    `;
    return rows[0] || null;
}

async function findContactoBasicoByPresupuestoToken(token) {
    const rows = await sql`
        SELECT c.nombre, c.apellido, c.producto, c.problema
          FROM presupuestos p
          JOIN contactos c ON c.id = p.contacto_id
         WHERE p.token = ${token}
         LIMIT 1
    `;
    return rows[0] || null;
}

module.exports = {
    parseLineas,
    findByTokenWithContacto,
    create, update,
    setEstadoSiPendiente, setChatCerrado, setEtiquetas,
    findIdAndCerrado, findChatCerrado,
    findContactoByPresupuestoToken, findContactoBasicoByPresupuestoToken,
};
