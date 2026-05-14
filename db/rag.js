const { sql } = require('./client');

async function list() {
    return await sql`
        SELECT id, titulo, contenido, categoria, created_at, tiene_vector
          FROM rag_knowledge
         ORDER BY created_at DESC
    `;
}

async function topRecientes(limit = 5) {
    return await sql`
        SELECT id, titulo, categoria, contenido
          FROM rag_knowledge
         ORDER BY created_at DESC
         LIMIT ${limit}
    `;
}

async function create({ titulo, contenido, categoria }) {
    const rows = await sql`
        INSERT INTO rag_knowledge (titulo, contenido, categoria)
        VALUES (${titulo}, ${contenido}, ${categoria})
        RETURNING id
    `;
    return rows[0].id;
}

async function update(id, { titulo, contenido, categoria }) {
    await sql`
        UPDATE rag_knowledge
           SET titulo = ${titulo}, contenido = ${contenido}, categoria = ${categoria}
         WHERE id = ${id}
    `;
}

async function remove(id) {
    await sql`DELETE FROM rag_knowledge WHERE id = ${id}`;
}

// Marca todo como vectorizado. Devuelve cuántas filas se actualizaron.
async function markAllVectorizado() {
    const rows = await sql`
        UPDATE rag_knowledge SET tiene_vector = 1
         WHERE tiene_vector = 0
         RETURNING id
    `;
    return rows.length;
}

async function resetVectores() {
    await sql`UPDATE rag_knowledge SET tiene_vector = 0`;
}

module.exports = { list, topRecientes, create, update, remove, markAllVectorizado, resetVectores };
