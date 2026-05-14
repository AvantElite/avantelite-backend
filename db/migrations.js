const fs = require('fs');
const path = require('path');
const { sql } = require('./client');

// Trigger reutilizable para columnas updated_at
const UPDATED_AT_FN = `
    CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
    BEGIN NEW.actualizado = NOW(); RETURN NEW; END;
    $$ LANGUAGE plpgsql;
`;

// Crea/actualiza tablas mínimas que el código asume que existen.
// Idempotente — usa IF NOT EXISTS / ON CONFLICT.
async function runMigrations() {
    // Si existe sql/store_schema.sql en versión Postgres, lo ejecutamos primero.
    try {
        const p = path.join(__dirname, '..', 'sql', 'store_schema.sql');
        if (fs.existsSync(p)) {
            const raw = fs.readFileSync(p, 'utf8');
            const cleaned = raw.split('\n').filter(l => !l.trim().startsWith('--')).join('\n');
            const stmts = cleaned.split(/;\s*[\r\n]/).map(s => s.trim()).filter(Boolean);
            for (const s of stmts) {
                try { await sql.unsafe(s); }
                catch (e) { console.warn('store_schema stmt:', e.message); }
            }
        }
    } catch (e) { console.warn('Migration store_schema:', e.message); }

    try {
        await sql`ALTER TABLE rag_knowledge ADD COLUMN IF NOT EXISTS tiene_vector SMALLINT NOT NULL DEFAULT 0`;
    } catch (e) { console.warn('Migration rag_knowledge:', e.message); }

    try {
        await sql`
            CREATE TABLE IF NOT EXISTS app_config (
                clave VARCHAR(64) PRIMARY KEY,
                valor TEXT NOT NULL
            )
        `;
    } catch (e) { console.warn('Migration app_config:', e.message); }

    try {
        await sql`
            CREATE TABLE IF NOT EXISTS portal_sesiones (
                token             VARCHAR(64)  PRIMARY KEY,
                presupuesto_token VARCHAR(64)  NOT NULL,
                expires_at        TIMESTAMPTZ  NOT NULL,
                created_at        TIMESTAMPTZ  DEFAULT NOW()
            )
        `;
        await sql`CREATE INDEX IF NOT EXISTS idx_portal_sesiones_expires ON portal_sesiones (expires_at)`;
    } catch (e) { console.warn('Migration portal_sesiones:', e.message); }

    try {
        await sql.unsafe(UPDATED_AT_FN);
        await sql`
            CREATE TABLE IF NOT EXISTS servicios (
                id           SERIAL PRIMARY KEY,
                nombre       VARCHAR(255) NOT NULL,
                descripcion  TEXT,
                icono        VARCHAR(64)  DEFAULT 'wrench',
                imagen       VARCHAR(512),
                orden        INT          DEFAULT 0,
                activo       SMALLINT     DEFAULT 1,
                subservicios JSONB,
                creado_en    TIMESTAMPTZ  DEFAULT NOW(),
                actualizado  TIMESTAMPTZ  DEFAULT NOW()
            )
        `;
        await sql`DROP TRIGGER IF EXISTS trg_servicios_updated ON servicios`;
        await sql`CREATE TRIGGER trg_servicios_updated BEFORE UPDATE ON servicios FOR EACH ROW EXECUTE FUNCTION set_updated_at()`;

        const [{ c }] = await sql`SELECT COUNT(*)::int AS c FROM servicios`;
        if (c === 0) {
            const defaults = serviciosDefaults();
            for (const s of defaults) {
                await sql`
                    INSERT INTO servicios (nombre, descripcion, icono, imagen, orden, activo, subservicios)
                    VALUES (${s.nombre}, ${s.descripcion}, ${s.icono}, ${s.imagen}, ${s.orden}, 1, ${sql.json(s.subservicios)})
                `;
            }
        } else {
            for (const s of serviciosSubservDefaults()) {
                const rows = await sql`SELECT subservicios FROM servicios WHERE nombre = ${s.nombre}`;
                if (rows.length) {
                    let subs = rows[0].subservicios;
                    if (typeof subs === 'string') { try { subs = JSON.parse(subs); } catch { subs = []; } }
                    if (!Array.isArray(subs) || !subs.length) {
                        await sql`UPDATE servicios SET subservicios = ${sql.json(s.subservicios)} WHERE nombre = ${s.nombre}`;
                    }
                }
            }
        }
    } catch (e) { console.warn('Migration servicios:', e.message); }

    try {
        await sql`
            CREATE TABLE IF NOT EXISTS tipos_problema (
                id     SERIAL PRIMARY KEY,
                nombre VARCHAR(64) NOT NULL UNIQUE
            )
        `;
        const [{ c }] = await sql`SELECT COUNT(*)::int AS c FROM tipos_problema`;
        if (c === 0) {
            const defaults = [
                'fallo-electrico', 'fallo-mecanico', 'fallo-software',
                'no-enciende', 'no-enfria', 'no-calienta',
                'fuga-agua', 'ruido-anomalo', 'pantalla-rota',
                'problemas-imagen', 'problemas-sonido', 'otros',
            ];
            for (const nombre of defaults) {
                await sql`INSERT INTO tipos_problema (nombre) VALUES (${nombre}) ON CONFLICT DO NOTHING`;
            }
        }
    } catch (e) { console.warn('Migration tipos_problema:', e.message); }

    try {
        await sql`
            CREATE TABLE IF NOT EXISTS averias_resueltas (
                id                SERIAL PRIMARY KEY,
                chat_token        VARCHAR(255) NOT NULL UNIQUE,
                es_averia         SMALLINT     NOT NULL DEFAULT 1,
                marca             VARCHAR(255),
                tipo_averia       VARCHAR(255),
                modelo            VARCHAR(255),
                funcion           VARCHAR(255),
                resumen           TEXT,
                descripcion       TEXT,
                solucion          TEXT,
                precio_reparacion NUMERIC(10,2),
                created_at        TIMESTAMPTZ DEFAULT NOW()
            )
        `;
    } catch (e) { console.warn('Migration averias_resueltas:', e.message); }
}

function serviciosDefaults() {
    return [
        {
            nombre: 'Televisores',
            descripcion: 'Reparamos todo tipo de televisores: LED, OLED, QLED y Smart TV con piezas originales y garantía de servicio.',
            icono: 'tv', imagen: '', orden: 1,
            subservicios: serviciosSubservDefaults().find(x => x.nombre === 'Televisores').subservicios,
        },
        {
            nombre: 'Electrodomésticos',
            descripcion: 'Servicio técnico especializado en lavadoras, frigoríficos, hornos, lavavajillas y más, a domicilio.',
            icono: 'washing-machine', imagen: '', orden: 2,
            subservicios: serviciosSubservDefaults().find(x => x.nombre === 'Electrodomésticos').subservicios,
        },
        {
            nombre: 'Calderas y Calefacción',
            descripcion: 'Reparación y mantenimiento de calderas y sistemas de calefacción. Revisiones preventivas y detección de fugas.',
            icono: 'flame', imagen: '', orden: 3,
            subservicios: serviciosSubservDefaults().find(x => x.nombre === 'Calderas y Calefacción').subservicios,
        },
    ];
}

function serviciosSubservDefaults() {
    return [
        { nombre: 'Televisores', subservicios: [
            { nombre: 'Problemas de Imagen', descripcion: 'Pantalla negra, líneas, colores o brillo incorrectos.', icono: 'monitor', es_directo: false, tipo_problema: '', opciones: [{ texto: 'Pantalla negra con sonido', tipo_problema: 'fallo-electrico' }, { texto: 'Líneas verticales u horizontales', tipo_problema: 'fallo-electrico' }, { texto: 'Falta de brillo (backlight)', tipo_problema: 'fallo-electrico' }, { texto: 'Colores distorsionados o manchas', tipo_problema: 'fallo-electrico' }] },
            { nombre: 'Problemas de Encendido', descripcion: 'No enciende, LED parpadea o se apaga solo.', icono: 'zap', es_directo: true, tipo_problema: 'fallo-electrico', opciones: [] },
            { nombre: 'Software y Conectividad', descripcion: 'Firmware, Wi-Fi, apps o errores de Smart TV.', icono: 'wifi', es_directo: false, tipo_problema: '', opciones: [{ texto: 'Actualización de firmware fallida', tipo_problema: 'error-software' }, { texto: 'Wi-Fi no conecta o se desconecta', tipo_problema: 'error-software' }, { texto: 'Apps que no cargan (Netflix, YouTube…)', tipo_problema: 'error-software' }] },
        ]},
        { nombre: 'Electrodomésticos', subservicios: [
            { nombre: 'Lavadoras y Secadoras', descripcion: 'Gomas, bombas, motor, centrifugado y placa base.', icono: 'washing-machine', es_directo: false, tipo_problema: '', opciones: [{ texto: 'Ruidos o vibraciones anormales', tipo_problema: 'ruido-extrano' }, { texto: 'Fuga de agua', tipo_problema: 'fuga-agua' }, { texto: 'No centrifuga o no termina el ciclo', tipo_problema: 'fallo-electrico' }, { texto: 'Error en panel o placa base', tipo_problema: 'fallo-electrico' }] },
            { nombre: 'Frigoríficos y Congeladores', descripcion: 'Gas, compresor, escarcha y termostato digital.', icono: 'refrigerator', es_directo: false, tipo_problema: '', opciones: [{ texto: 'No enfría correctamente', tipo_problema: 'fuga-agua' }, { texto: 'Acumulación de escarcha (No Frost)', tipo_problema: 'fallo-electrico' }, { texto: 'Ruido excesivo del compresor', tipo_problema: 'ruido-extrano' }] },
            { nombre: 'Hornos y Vitrocerámicas', descripcion: 'Resistencias, selectores, vidrios e inducción.', icono: 'flame', es_directo: true, tipo_problema: 'fallo-electrico', opciones: [] },
        ]},
        { nombre: 'Calderas y Calefacción', subservicios: [
            { nombre: 'Calderas de Gas y Gasoil', descripcion: 'Quemadores, bomba, vaso de expansión y panel.', icono: 'fuel', es_directo: false, tipo_problema: '', opciones: [{ texto: 'Fuga de agua o gas', tipo_problema: 'fuga-agua' }, { texto: 'Caldera no enciende o da error', tipo_problema: 'fallo-electrico' }, { texto: 'Mantenimiento anual preventivo', tipo_problema: 'otros' }] },
            { nombre: 'Radiadores y Circuitos', descripcion: 'Purgado, ruidos, fugas y equilibrado de calor.', icono: 'waves', es_directo: true, tipo_problema: 'ruido-extrano', opciones: [] },
            { nombre: 'Termostatos Inteligentes', descripcion: 'Instalación y configuración Wifi.', icono: 'thermometer', es_directo: true, tipo_problema: 'error-software', opciones: [] },
        ]},
    ];
}

module.exports = { runMigrations };
