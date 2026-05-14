// Repositorio del dominio "store" (frontend tienda).
// Sub-namespaces: productos, categorias, usuarios, carrito, tracking.

const { sql, tx } = require('./client');

// ── Productos + especificaciones ─────────────────────────────────────────────

const productos = {
    async listConCategoriaYSpecs() {
        const productosRows = await sql`
            SELECT p.*, c.nombre AS categoria_nombre
              FROM store_productos p
              LEFT JOIN store_categorias c ON c.id = p.categoria_id
        `;
        if (productosRows.length === 0) return [];
        const ids = productosRows.map(p => p.id);
        const specsRows = await sql`
            SELECT producto_id, nombre_dato, valor_dato
              FROM store_especificaciones
             WHERE producto_id IN ${sql(ids)}
        `;
        const byProd = {};
        for (const s of specsRows) {
            (byProd[s.producto_id] ??= []).push({ nombre_dato: s.nombre_dato, valor_dato: s.valor_dato });
        }
        for (const p of productosRows) p.especificaciones = byProd[p.id] || [];
        return productosRows;
    },

    async findByIdConSpecs(id) {
        const rows = await sql`
            SELECT p.*, c.nombre AS categoria_nombre
              FROM store_productos p
              LEFT JOIN store_categorias c ON c.id = p.categoria_id
             WHERE p.id = ${id}
        `;
        if (!rows.length) return null;
        const producto = rows[0];
        producto.especificaciones = await sql`
            SELECT nombre_dato, valor_dato
              FROM store_especificaciones
             WHERE producto_id = ${id}
        `;
        return producto;
    },

    // Crea producto + reemplaza especificaciones en una transacción.
    async createConSpecs({ marca, modelo, precio, categoria_id, stock, eficiencia, imagen_url }, specs) {
        return await tx(async (txSql) => {
            const rows = await txSql`
                INSERT INTO store_productos
                    (marca, modelo, precio, categoria_id, stock, eficiencia_energetica, imagen_url)
                VALUES
                    (${marca}, ${modelo}, ${precio}, ${categoria_id}, ${stock}, ${eficiencia}, ${imagen_url})
                RETURNING id
            `;
            const id = rows[0].id;
            await _replaceSpecs(txSql, id, specs);
            return id;
        });
    },

    // Aplica solo los campos provistos. specs: undefined = no tocar; array = reemplazar.
    async updatePartial(id, fields, specs) {
        return await tx(async (txSql) => {
            const sets = [];
            const params = {};
            for (const k of ['marca','modelo','precio','stock','categoria_id','eficiencia_energetica','imagen_url']) {
                if (fields[k] !== undefined) { sets.push(k); params[k] = fields[k]; }
            }
            if (sets.length) {
                // sql construye SET dinámico con sql() helper
                await txSql`UPDATE store_productos SET ${txSql(params, ...sets)} WHERE id = ${id}`;
            }
            if (specs !== undefined) await _replaceSpecs(txSql, id, specs);
        });
    },

    async remove(id) {
        await sql`DELETE FROM store_productos WHERE id = ${id}`;
    },
};

async function _replaceSpecs(txSql, producto_id, specs) {
    await txSql`DELETE FROM store_especificaciones WHERE producto_id = ${producto_id}`;
    if (!specs.length) return;
    const values = specs.map(s => ({ producto_id, nombre_dato: s.nombre_dato, valor_dato: s.valor_dato }));
    await txSql`INSERT INTO store_especificaciones ${txSql(values, 'producto_id', 'nombre_dato', 'valor_dato')}`;
}

// ── Categorías ───────────────────────────────────────────────────────────────

const categorias = {
    async list() {
        return await sql`
            SELECT id, nombre, slug, descripcion, parent_id, fecha_creacion
              FROM store_categorias
             ORDER BY nombre ASC
        `;
    },

    // Lanza .code = 'DUP' si ya existe (UNIQUE conflict).
    async create({ nombre, slug, descripcion, parent_id }) {
        try {
            const rows = await sql`
                INSERT INTO store_categorias (nombre, slug, descripcion, parent_id)
                VALUES (${nombre}, ${slug}, ${descripcion}, ${parent_id})
                RETURNING id
            `;
            return rows[0].id;
        } catch (e) {
            if (e.code === '23505') { e.code = 'DUP'; }
            throw e;
        }
    },

    // fields contiene solo las columnas que cambian.
    async updatePartial(id, fields) {
        const allowed = ['nombre','slug','descripcion','parent_id'];
        const cols = allowed.filter(k => fields[k] !== undefined);
        if (!cols.length) return false;
        const obj = Object.fromEntries(cols.map(k => [k, fields[k]]));
        await sql`UPDATE store_categorias SET ${sql(obj, ...cols)} WHERE id = ${id}`;
        return true;
    },

    async remove(id) {
        await sql`DELETE FROM store_categorias WHERE id = ${id}`;
    },
};

// ── Usuarios de la tienda ────────────────────────────────────────────────────

const usuarios = {
    async existsEmail(email) {
        const rows = await sql`SELECT id FROM store_usuarios WHERE email = ${email}`;
        return rows.length > 0;
    },

    async findByEmail(email) {
        const rows = await sql`SELECT id, nombre, email, password FROM store_usuarios WHERE email = ${email}`;
        return rows[0] || null;
    },

    async create({ nombre, email, passwordHash }) {
        const rows = await sql`
            INSERT INTO store_usuarios (nombre, email, password)
            VALUES (${nombre}, ${email}, ${passwordHash})
            RETURNING id
        `;
        return rows[0].id;
    },

    async list() {
        return await sql`
            SELECT id, nombre, email, fecha_registro
              FROM store_usuarios
             ORDER BY id ASC
        `;
    },
};

// ── Carrito ──────────────────────────────────────────────────────────────────

const carrito = {
    async listByUsuario(usuario_id) {
        return await sql`
            SELECT id, producto_id, producto_nombre, producto_marca, producto_precio,
                   producto_imagen, cantidad, fecha_agregado
              FROM store_carrito
             WHERE usuario_id = ${usuario_id}
             ORDER BY fecha_agregado DESC
        `;
    },

    async findExistente(usuario_id, producto_id) {
        const rows = await sql`
            SELECT id, cantidad
              FROM store_carrito
             WHERE usuario_id = ${usuario_id} AND producto_id = ${producto_id}
        `;
        return rows[0] || null;
    },

    async incrementarCantidad(id, nuevaCantidad) {
        await sql`UPDATE store_carrito SET cantidad = ${nuevaCantidad} WHERE id = ${id}`;
    },

    async add({ usuario_id, producto_id, producto_nombre, producto_marca, producto_precio, producto_imagen, cantidad }) {
        const rows = await sql`
            INSERT INTO store_carrito
                (usuario_id, producto_id, producto_nombre, producto_marca, producto_precio, producto_imagen, cantidad)
            VALUES
                (${usuario_id}, ${producto_id}, ${producto_nombre}, ${producto_marca},
                 ${producto_precio}, ${producto_imagen}, ${cantidad})
            RETURNING id
        `;
        return rows[0].id;
    },

    // Devuelve true si eliminó algo.
    async removeOwn(carrito_id, usuario_id) {
        const rows = await sql`
            DELETE FROM store_carrito
             WHERE id = ${carrito_id} AND usuario_id = ${usuario_id}
             RETURNING id
        `;
        return rows.length > 0;
    },
};

// ── Tracking (sesiones / visitas / eventos) ──────────────────────────────────

const tracking = {
    // Inserta una sesión de tracking. Si ya existe el id (PK), no hace nada.
    async ensureSesion({
        session_id, dispositivo, pais, ciudad, fuente,
        utm_source, utm_medium, utm_campaign, referrer, user_agent, ip,
    }) {
        await sql`
            INSERT INTO store_sesiones
                (id, inicio, paginas_vistas, rebote, dispositivo, pais, ciudad, fuente,
                 utm_source, utm_medium, utm_campaign, referrer, user_agent, ip)
            VALUES
                (${session_id}, NOW(), 0, 1, ${dispositivo}, ${pais}, ${ciudad}, ${fuente},
                 ${utm_source}, ${utm_medium}, ${utm_campaign}, ${referrer}, ${user_agent}, ${ip})
            ON CONFLICT (id) DO NOTHING
        `;
    },

    async addPageview(session_id, pagina, titulo) {
        await sql`
            INSERT INTO store_visitas (session_id, fecha, pagina, titulo)
            VALUES (${session_id}, NOW(), ${pagina}, ${titulo})
        `;
    },

    // Incrementa páginas_vistas y desactiva rebote si supera 1.
    async incrementarPageviews(session_id) {
        await sql`
            UPDATE store_sesiones
               SET paginas_vistas = paginas_vistas + 1,
                   rebote = CASE WHEN paginas_vistas + 1 >= 2 THEN 0 ELSE 1 END
             WHERE id = ${session_id}
        `;
    },

    async cerrarSesion(session_id, duracion_seg) {
        await sql`
            UPDATE store_sesiones
               SET fin = NOW(), duracion_seg = ${duracion_seg}
             WHERE id = ${session_id}
        `;
    },

    async addEvento({ session_id, tipo, nombre, pagina, valor }) {
        await sql`
            INSERT INTO store_eventos (session_id, fecha, tipo, nombre, pagina, valor)
            VALUES (${session_id}, NOW(), ${tipo}, ${nombre}, ${pagina}, ${valor})
        `;
    },
};

module.exports = { productos, categorias, usuarios, carrito, tracking };
