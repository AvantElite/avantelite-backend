const { sql } = require('./client');

async function findByEmail(email) {
    const rows = await sql`SELECT * FROM usuarios WHERE email = ${email.toLowerCase()} LIMIT 1`;
    return rows[0] || null;
}

async function findById(id) {
    const rows = await sql`SELECT * FROM usuarios WHERE id = ${id} LIMIT 1`;
    return rows[0] || null;
}

async function existsEmail(email) {
    const rows = await sql`SELECT id FROM usuarios WHERE email = ${email.toLowerCase()} LIMIT 1`;
    return rows.length > 0;
}

async function list() {
    return await sql`
        SELECT id, nombre, email, rol, created_at
          FROM usuarios
         ORDER BY created_at DESC
    `;
}

async function create({ nombre, email, passwordHash, rol }) {
    const rows = await sql`
        INSERT INTO usuarios (nombre, email, password, rol)
        VALUES (${nombre}, ${email.toLowerCase()}, ${passwordHash}, ${rol})
        RETURNING id
    `;
    return rows[0].id;
}

async function updateRol(id, rol) {
    await sql`UPDATE usuarios SET rol = ${rol} WHERE id = ${id}`;
}

async function updatePassword(id, passwordHash) {
    await sql`UPDATE usuarios SET password = ${passwordHash} WHERE id = ${id}`;
}

async function remove(id) {
    await sql`DELETE FROM usuarios WHERE id = ${id}`;
}

module.exports = {
    findByEmail, findById, existsEmail, list,
    create, updateRol, updatePassword, remove,
};
