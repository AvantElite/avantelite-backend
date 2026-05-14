require('dotenv').config();
const postgres = require('postgres');

const connectionString =
    process.env.DATABASE_URL ||
    `postgres://${encodeURIComponent(process.env.DB_USER || '')}:${encodeURIComponent(process.env.DB_PASS || '')}` +
    `@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'postgres'}`;

const sql = postgres(connectionString, {
    max: 10,
    idle_timeout: 30,
    connect_timeout: 10,
    ssl: process.env.PGSSL === 'disable'
        ? false
        : process.env.NODE_ENV === 'production'
            ? { rejectUnauthorized: false }
            : false,
    types: {
        bigint: postgres.BigInt,
    },
    transform: { undefined: null },
});

// Ejecuta una transacción. cb recibe el cliente sql transaccional.
//   await tx(async (txSql) => { await txSql`...`; });
function tx(cb) {
    return sql.begin(cb);
}

module.exports = { sql, tx };
