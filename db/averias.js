const { sql } = require('./client');

async function list() {
    return await sql`SELECT * FROM averias_resueltas ORDER BY created_at DESC`;
}

// Presupuestos cerrados que aún no han sido procesados como avería.
// Devuelve token, total, etiquetas y la concatenación de descripciones de líneas.
async function listChatsCandidatos(limit = 20) {
    return await sql`
        SELECT p.token,
               p.total,
               p.etiquetas,
               (
                   SELECT string_agg(line->>'descripcion', ', ')
                     FROM jsonb_array_elements(
                              CASE
                                  WHEN p.lineas IS NULL THEN '[]'::jsonb
                                  WHEN jsonb_typeof(p.lineas) = 'array' THEN p.lineas
                                  ELSE '[]'::jsonb
                              END
                          ) AS line
               ) AS lineas_desc
          FROM presupuestos p
         WHERE p.chat_cerrado = 1
           AND p.token NOT IN (SELECT chat_token FROM averias_resueltas)
         GROUP BY p.token, p.total, p.etiquetas, p.lineas
         LIMIT ${limit}
    `;
}

async function getMensajesByToken(token, limit = 80) {
    return await sql`
        SELECT sender, mensaje
          FROM chat_mensajes
         WHERE token = ${token}
         ORDER BY created_at ASC
         LIMIT ${limit}
    `;
}

async function upsertExtraido({
    chat_token, es_averia, marca, tipo_averia, modelo, funcion,
    resumen, descripcion, solucion, precio_reparacion,
}) {
    await sql`
        INSERT INTO averias_resueltas
            (chat_token, es_averia, marca, tipo_averia, modelo, funcion,
             resumen, descripcion, solucion, precio_reparacion)
        VALUES
            (${chat_token}, ${es_averia ? 1 : 0}, ${marca}, ${tipo_averia}, ${modelo}, ${funcion},
             ${resumen}, ${descripcion}, ${solucion}, ${precio_reparacion})
        ON CONFLICT (chat_token) DO UPDATE SET
            es_averia         = EXCLUDED.es_averia,
            marca             = EXCLUDED.marca,
            tipo_averia       = EXCLUDED.tipo_averia,
            modelo            = EXCLUDED.modelo,
            funcion           = EXCLUDED.funcion,
            resumen           = EXCLUDED.resumen,
            descripcion       = EXCLUDED.descripcion,
            solucion          = EXCLUDED.solucion,
            precio_reparacion = EXCLUDED.precio_reparacion
    `;
}

module.exports = { list, listChatsCandidatos, getMensajesByToken, upsertExtraido };
