const { sql } = require('./client');

async function list() {
    return await sql`SELECT id, nombre FROM tipos_problema ORDER BY nombre ASC`;
}

// Lanza un error con .code = 'DUP' si ya existe.
async function create(nombre) {
    try {
        const rows = await sql`
            INSERT INTO tipos_problema (nombre)
            VALUES (${nombre})
            RETURNING id
        `;
        return rows[0].id;
    } catch (e) {
        if (e.code === '23505') { e.code = 'DUP'; }
        throw e;
    }
}

async function remove(id) {
    await sql`DELETE FROM tipos_problema WHERE id = ${id}`;
}

module.exports = { list, create, remove };
