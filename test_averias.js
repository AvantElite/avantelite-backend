const mysql = require('mysql2/promise');
require('dotenv').config({ path: __dirname + '/.env' });

const OLLAMA_BASE = 'http://localhost:11434';

function extractJson(text) {
  const m = text.match(/\{[\s\S]*\}/);
  return m ? m[0] : null;
}

async function aiGenerate(prompt) {
  const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'qwen2.5:3b',
      stream: false,
      options: { num_predict: 512 },
      messages: [{ role: 'user', content: prompt }]
    })
  });
  const data = await res.json();
  return data.message?.content ?? '';
}

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'backendavant'
  });

  // 1. Buscar un presupuesto con mensajes
  const [candidatos] = await conn.query(`
    SELECT p.token FROM presupuestos p
    WHERE EXISTS (SELECT 1 FROM chat_mensajes cm WHERE cm.token = p.token)
    LIMIT 1
  `);

  if (!candidatos.length) {
    console.log('No hay presupuestos con mensajes de chat para probar.');
    await conn.end(); return;
  }

  const token = candidatos[0].token;
  console.log('Token de prueba:', token);

  // 2. Leer mensajes del chat
  const [msgs] = await conn.query(
    'SELECT sender, mensaje FROM chat_mensajes WHERE token=? ORDER BY created_at ASC LIMIT 60',
    [token]
  );
  console.log(`Mensajes encontrados: ${msgs.length}`);
  msgs.forEach(m => console.log(`  [${m.sender}]: ${m.mensaje}`));

  // 3. Llamar a la IA
  console.log('\nLlamando a la IA...');
  const transcript = msgs.map(m => `${m.sender === 'cliente' ? 'Cliente' : 'Técnico'}: ${m.mensaje}`).join('\n');
  const prompt = `Analiza esta conversación de soporte técnico de electrónica y extrae la siguiente información en JSON. Si no puedes determinar algún campo, usa null.\n\nCONVERSACIÓN:\n${transcript}\n\nResponde SOLO con este JSON:\n{"marca": "...", "tipo_averia": "...", "modelo": "...", "funcion": "...", "resumen": "...", "descripcion": "...", "solucion": "..."}`;

  const raw = await aiGenerate(prompt);
  console.log('\nRespuesta IA raw:', raw);

  const jsonStr = extractJson(raw);
  if (!jsonStr) { console.log('No se encontró JSON en la respuesta.'); await conn.end(); return; }

  const p = JSON.parse(jsonStr);
  console.log('\nDatos extraídos:', p);

  // 4. Guardar en BD
  await conn.query(
    `INSERT INTO averias_resueltas (chat_token, marca, tipo_averia, modelo, funcion, resumen, descripcion, solucion)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE marca=VALUES(marca)`,
    [token, p.marca ?? null, p.tipo_averia ?? null, p.modelo ?? null, p.funcion ?? null, p.resumen ?? null, p.descripcion ?? null, p.solucion ?? null]
  );
  console.log('\nGuardado en BD correctamente.');

  // 5. REVERTIR
  await conn.query('DELETE FROM averias_resueltas WHERE chat_token=?', [token]);
  console.log('Revertido — registro eliminado de averias_resueltas.');

  await conn.end();
})().catch(e => console.error('ERROR:', e.message));
