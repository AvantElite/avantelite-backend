const { sql } = require('./client');

// Devuelve un slug único en blog_posts derivado de `base`. Si excludeId > 0,
// permite que el propio post conserve su slug (útil al editar).
async function uniqueSlug(base, excludeId = 0) {
    let slug = base, counter = 1;
    while (true) {
        const rows = excludeId > 0
            ? await sql`SELECT id FROM blog_posts WHERE slug = ${slug} AND id <> ${excludeId} LIMIT 1`
            : await sql`SELECT id FROM blog_posts WHERE slug = ${slug} LIMIT 1`;
        if (rows.length === 0) return slug;
        slug = base + '-' + counter++;
    }
}

async function findBySlugPublicado(slug) {
    const rows = await sql`SELECT * FROM blog_posts WHERE slug = ${slug} AND publicado = 1 LIMIT 1`;
    return rows[0] || null;
}

async function listAdmin() {
    const rows = await sql`SELECT * FROM blog_posts ORDER BY fecha DESC, creado_en DESC`;
    return rows.map(r => ({ ...r, publicado: !!r.publicado, destacado: !!r.destacado }));
}

async function listPublicos({ categoria = '', soloDestacado = false } = {}) {
    if (categoria && soloDestacado) {
        return await sql`
            SELECT id, titulo, slug, categoria, resumen, emoji, destacado, fecha
              FROM blog_posts
             WHERE publicado = 1 AND categoria = ${categoria} AND destacado = 1
             ORDER BY destacado DESC, fecha DESC
        `;
    }
    if (categoria) {
        return await sql`
            SELECT id, titulo, slug, categoria, resumen, emoji, destacado, fecha
              FROM blog_posts
             WHERE publicado = 1 AND categoria = ${categoria}
             ORDER BY destacado DESC, fecha DESC
        `;
    }
    if (soloDestacado) {
        return await sql`
            SELECT id, titulo, slug, categoria, resumen, emoji, destacado, fecha
              FROM blog_posts
             WHERE publicado = 1 AND destacado = 1
             ORDER BY destacado DESC, fecha DESC
        `;
    }
    return await sql`
        SELECT id, titulo, slug, categoria, resumen, emoji, destacado, fecha
          FROM blog_posts
         WHERE publicado = 1
         ORDER BY destacado DESC, fecha DESC
    `;
}

async function create({ titulo, slug, categoria, resumen, contenido, emoji, destacado, publicado, fecha }) {
    const rows = await sql`
        INSERT INTO blog_posts (titulo, slug, categoria, resumen, contenido, emoji, destacado, publicado, fecha)
        VALUES (${titulo}, ${slug}, ${categoria}, ${resumen}, ${contenido}, ${emoji},
                ${destacado ? 1 : 0}, ${publicado ? 1 : 0}, ${fecha})
        RETURNING id
    `;
    return rows[0].id;
}

async function update(id, { titulo, slug, categoria, resumen, contenido, emoji, destacado, publicado, fecha }) {
    await sql`
        UPDATE blog_posts
           SET titulo = ${titulo}, slug = ${slug}, categoria = ${categoria},
               resumen = ${resumen}, contenido = ${contenido}, emoji = ${emoji},
               destacado = ${destacado ? 1 : 0}, publicado = ${publicado ? 1 : 0},
               fecha = ${fecha}
         WHERE id = ${id}
    `;
}

async function remove(id) {
    await sql`DELETE FROM blog_posts WHERE id = ${id}`;
}

module.exports = {
    uniqueSlug, findBySlugPublicado, listAdmin, listPublicos,
    create, update, remove,
};
