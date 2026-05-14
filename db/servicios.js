const { sql } = require('./client');

function normalize(r) {
    return {
        ...r,
        activo: !!r.activo,
        subservicios: r.subservicios
            ? (typeof r.subservicios === 'string' ? JSON.parse(r.subservicios) : r.subservicios)
            : [],
    };
}

async function list({ soloActivos = true } = {}) {
    const rows = soloActivos
        ? await sql`SELECT * FROM servicios WHERE activo = 1 ORDER BY orden ASC, id ASC`
        : await sql`SELECT * FROM servicios ORDER BY orden ASC, id ASC`;
    return rows.map(normalize);
}

async function create({ nombre, descripcion, icono, imagen, orden, activo, subservicios }) {
    const rows = await sql`
        INSERT INTO servicios (nombre, descripcion, icono, imagen, orden, activo, subservicios)
        VALUES (${nombre}, ${descripcion}, ${icono}, ${imagen}, ${orden}, ${activo ? 1 : 0}, ${sql.json(subservicios)})
        RETURNING id
    `;
    return rows[0].id;
}

async function update(id, { nombre, descripcion, icono, imagen, orden, activo, subservicios }) {
    await sql`
        UPDATE servicios
           SET nombre       = ${nombre},
               descripcion  = ${descripcion},
               icono        = ${icono},
               imagen       = ${imagen},
               orden        = ${orden},
               activo       = ${activo ? 1 : 0},
               subservicios = ${sql.json(subservicios)}
         WHERE id = ${id}
    `;
}

async function remove(id) {
    await sql`DELETE FROM servicios WHERE id = ${id}`;
}

module.exports = { list, create, update, remove };
