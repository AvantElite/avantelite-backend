const { sql } = require('./client');

function normalizePermisos(p) {
    if (Array.isArray(p)) return p;
    if (p == null) return [];
    if (typeof p === 'string') {
        try { const v = JSON.parse(p); return Array.isArray(v) ? v : []; } catch { return []; }
    }
    return [];
}

async function list() {
    const rows = await sql`
        SELECT id, nombre, permisos, created_at
          FROM roles
         ORDER BY nombre
    `;
    return rows.map(r => ({ ...r, permisos: normalizePermisos(r.permisos) }));
}

async function findByName(nombre) {
    const rows = await sql`SELECT id FROM roles WHERE nombre = ${nombre} LIMIT 1`;
    return rows[0] || null;
}

async function getPermisosByName(nombre) {
    const rows = await sql`SELECT permisos FROM roles WHERE nombre = ${nombre} LIMIT 1`;
    if (!rows.length) return null;
    return normalizePermisos(rows[0].permisos);
}

async function create(nombre, permisos) {
    const rows = await sql`
        INSERT INTO roles (nombre, permisos)
        VALUES (${nombre}, ${sql.json(permisos)})
        RETURNING id
    `;
    return rows[0].id;
}

async function updatePermisos(id, permisos) {
    await sql`UPDATE roles SET permisos = ${sql.json(permisos)} WHERE id = ${id}`;
}

async function remove(id) {
    await sql`DELETE FROM roles WHERE id = ${id}`;
}

// Devuelve los permisos (array) del rol asignado a un usuario, o [] si no tiene.
async function getPermisosByUsuarioId(usuario_id) {
    const rows = await sql`
        SELECT r.permisos
          FROM usuarios u
          JOIN roles r ON r.id = u.rol_id
         WHERE u.id = ${usuario_id}
         LIMIT 1
    `;
    if (!rows.length) return [];
    return normalizePermisos(rows[0].permisos);
}

module.exports = { list, findByName, getPermisosByName, create, updatePermisos, remove, getPermisosByUsuarioId };
