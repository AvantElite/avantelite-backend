/**
 * Test de extracción de averías con conversación inventada.
 * Inserta datos de prueba, ejecuta la misma lógica que /api/averias/extraer,
 * muestra el resultado y limpia los datos al finalizar.
 *
 * Uso: node test_extraccion.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

const OLLAMA_BASE = process.env.OLLAMA_URL || 'http://localhost:11434';
const TEST_TOKEN  = 'TEST_AVERIA_' + Date.now();

// ── Conversación de prueba ────────────────────────────────────────────────────

const CONVERSACION = [
  { sender: 'cliente', mensaje: 'Hola, traigo mi iPhone 13 Pro porque se me cayó al suelo y se me ha roto la pantalla por completo, no se ve nada.' },
  { sender: 'tecnico', mensaje: 'Buenos días, entendido. ¿La pantalla está completamente negra o se ve algo?' },
  { sender: 'cliente', mensaje: 'Completamente negra, aunque el móvil vibra y suena cuando recibo llamadas.' },
  { sender: 'tecnico', mensaje: 'Vale, eso es buena señal, significa que la placa está bien. Sería una sustitución de pantalla. Para el iPhone 13 Pro con pantalla OLED original el precio es 189 euros, con garantía de 3 meses.' },
  { sender: 'cliente', mensaje: '¿Y cuánto tardaría?' },
  { sender: 'tecnico', mensaje: 'En el día, unas 2 horas aproximadamente.' },
  { sender: 'cliente', mensaje: 'Perfecto, lo dejo.' },
  { sender: 'tecnico', mensaje: 'De acuerdo, quedamos en 189€. Le avisamos cuando esté listo.' },
  { sender: 'tecnico', mensaje: 'Pantalla sustituida correctamente. El móvil funciona perfectamente, Touch ID y Face ID operativos.' },
  { sender: 'cliente', mensaje: 'Genial, muchas gracias. Quedo muy satisfecho.' },
];

const CONTEXTO = {
  lineas_desc: 'Sustitución pantalla OLED iPhone 13 Pro',
  total: 189,
  etiquetas: JSON.stringify(['Resuelto', 'Presupuesto aceptado']),
};

// ── Replicar lógica del servidor ──────────────────────────────────────────────

function extractJson(text) {
  const clean = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  const start = clean.indexOf('{');
  const end   = clean.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) return null;
  return clean.slice(start, end + 1);
}

async function aiGenerate(prompt, maxTokens = 900) {
  const cfg = await getAiConfig();
  const proveedor = cfg?.proveedor_generacion ?? 'ollama';
  console.log(`\n[IA] Proveedor: ${proveedor}`);

  if (proveedor === 'ollama') {
    const modelo = cfg?.modelo_generacion || 'qwen2.5:3b';
    console.log(`[IA] Modelo: ${modelo}`);
    const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelo,
        stream: false,
        options: { num_predict: maxTokens },
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) throw new Error(`Ollama ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return data.message?.content ?? '';
  }

  if (proveedor === 'anthropic') {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error('Sin ANTHROPIC_API_KEY en .env');
    const modelo = cfg?.modelo_generacion || 'claude-haiku-4-5-20251001';
    console.log(`[IA] Modelo: ${modelo}`);
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: modelo, max_tokens: maxTokens, messages: [{ role: 'user', content: prompt }] }),
    });
    if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return data.content[0].text;
  }

  if (proveedor === 'openai') {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error('Sin OPENAI_API_KEY en .env');
    const modelo = cfg?.modelo_generacion || 'gpt-4o-mini';
    console.log(`[IA] Modelo: ${modelo}`);
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({ model: modelo, max_tokens: maxTokens, messages: [{ role: 'user', content: prompt }] }),
    });
    if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return data.choices[0].message.content;
  }

  throw new Error(`Proveedor no soportado: ${proveedor}`);
}

let _pool;
async function getPool() {
  if (!_pool) _pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'backendavant',
    charset: 'utf8mb4',
  });
  return _pool;
}

async function getAiConfig() {
  try {
    const pool = await getPool();
    const [rows] = await pool.query("SELECT valor FROM app_config WHERE clave='ia_config' LIMIT 1");
    if (rows.length) return JSON.parse(rows[0].valor);
  } catch {}
  return null;
}

// ── Main ──────────────────────────────────────────────────────────────────────

;(async () => {
  const pool = await getPool();

  console.log('='.repeat(60));
  console.log('  TEST EXTRACCIÓN DE AVERÍAS');
  console.log('='.repeat(60));
  console.log(`Token de prueba: ${TEST_TOKEN}`);

  // 1. Insertar datos de prueba
  console.log('\n[1] Insertando conversación de prueba en BD…');
  await pool.query(
    `INSERT INTO presupuestos (token, chat_cerrado, etiquetas, total, lineas)
     VALUES (?, 1, ?, ?, '[]')`,
    [TEST_TOKEN, CONTEXTO.etiquetas, CONTEXTO.total]
  );

  for (const m of CONVERSACION) {
    await pool.query(
      `INSERT INTO chat_mensajes (token, sender, mensaje, created_at) VALUES (?, ?, ?, NOW())`,
      [TEST_TOKEN, m.sender, m.mensaje]
    );
  }
  console.log(`  ${CONVERSACION.length} mensajes insertados.`);

  // 2. Construir transcript y prompt — exactamente igual que el servidor
  console.log('\n[2] Construyendo transcript…');
  const msgsTexto = CONVERSACION.filter(m => m.mensaje && m.mensaje.trim());
  const transcript = msgsTexto
    .map(m => `${m.sender === 'cliente' ? 'Cliente' : 'Técnico'}: ${m.mensaje.trim()}`)
    .join('\n');

  console.log('--- TRANSCRIPT ---');
  console.log(transcript);
  console.log('------------------');

  const contexto = [];
  if (CONTEXTO.lineas_desc) contexto.push(`Líneas del presupuesto: ${CONTEXTO.lineas_desc}`);
  if (CONTEXTO.total)       contexto.push(`Total presupuestado: ${CONTEXTO.total} €`);
  const etiquetas = JSON.parse(CONTEXTO.etiquetas).join(', ');
  if (etiquetas)            contexto.push(`Etiquetas: ${etiquetas}`);
  const contextoStr = `CONTEXTO DEL CASO:\n${contexto.join('\n')}\n\n`;

  const prompt = `Eres un asistente técnico especializado en reparación de electrónica. Analiza la siguiente conversación de soporte y extrae información estructurada.

${contextoStr}CONVERSACIÓN:
${transcript}

Extrae los datos y responde ÚNICAMENTE con JSON válido, sin texto adicional ni bloques de código markdown.
Campos requeridos:
- es_averia: booleano (true si hay avería técnica real, false si es consulta de precio o pregunta general)
- marca: string con la marca del dispositivo, o null
- modelo: string con el modelo específico, o null
- tipo_averia: uno de estos valores exactos: "pantalla", "batería", "placa base", "software", "conector", "cámara", "altavoz", "consulta", "otro" — o null
- funcion: string corto con el componente o función afectada, o null
- resumen: string con 1-2 frases sobre qué pasó y cómo se resolvió, o null
- descripcion: string con la descripción detallada del problema del cliente, o null
- solucion: string con la solución aplicada o propuesta, o null
- precio_reparacion: número (solo dígitos, sin símbolo €) si se menciona precio, o null

Ejemplo de formato esperado:
{"es_averia":true,"marca":"Samsung","modelo":"Galaxy A52","tipo_averia":"pantalla","funcion":"pantalla rota","resumen":"Pantalla rota por caída, reemplazada con éxito.","descripcion":"El cliente trajo el móvil con la pantalla rota tras una caída.","solucion":"Sustitución de pantalla original.","precio_reparacion":89}`;

  // 3. Llamar a la IA
  console.log('\n[3] Llamando a la IA…');
  const startTime = Date.now();
  let raw;
  try {
    raw = await aiGenerate(prompt, 900);
  } catch (e) {
    console.error(`\n  ERROR llamando a la IA: ${e.message}`);
    console.error('  Comprueba que Ollama está corriendo: http://localhost:11434');
    await cleanup(pool);
    return;
  }
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`  Respuesta recibida en ${elapsed}s`);
  console.log('\n--- RESPUESTA RAW IA ---');
  console.log(raw);
  console.log('------------------------');

  // 4. Extraer y parsear JSON
  console.log('\n[4] Extrayendo JSON…');
  const jsonStr = extractJson(raw);
  if (!jsonStr) {
    console.error('  ERROR: No se encontró JSON válido en la respuesta.');
    console.error('  Posible causa: el modelo no siguió el formato o respondió con texto libre.');
    await cleanup(pool);
    return;
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (e) {
    console.error(`  ERROR parseando JSON: ${e.message}`);
    console.error(`  JSON extraído: ${jsonStr}`);
    await cleanup(pool);
    return;
  }

  console.log('\n--- JSON EXTRAÍDO ---');
  console.log(JSON.stringify(parsed, null, 2));
  console.log('---------------------');

  // 5. Validaciones
  console.log('\n[5] Validaciones:');
  const checks = [
    ['es_averia es booleano',    typeof parsed.es_averia === 'boolean'],
    ['marca no vacía',           parsed.marca && parsed.marca !== 'null'],
    ['modelo no vacío',          parsed.modelo && parsed.modelo !== 'null'],
    ['tipo_averia válido',       ['pantalla','batería','placa base','software','conector','cámara','altavoz','consulta','otro'].includes(parsed.tipo_averia)],
    ['funcion presente',         !!parsed.funcion],
    ['resumen presente',         !!parsed.resumen],
    ['descripcion presente',     !!parsed.descripcion],
    ['solucion presente',        !!parsed.solucion],
    ['precio_reparacion número', parsed.precio_reparacion === 189 || parsed.precio_reparacion === '189'],
  ];
  let passed = 0;
  for (const [label, ok] of checks) {
    console.log(`  ${ok ? '✓' : '✗'} ${label}${ok ? '' : ` (valor: ${JSON.stringify(parsed[label.split(' ')[0]])})`}`);
    if (ok) passed++;
  }
  console.log(`\n  Resultado: ${passed}/${checks.length} validaciones superadas`);

  // 6. Normalizar precio y guardar
  let precio = null;
  if (parsed.precio_reparacion !== null && parsed.precio_reparacion !== undefined) {
    const n = parseFloat(String(parsed.precio_reparacion).replace(/[^0-9.]/g, ''));
    if (!isNaN(n)) precio = n;
  }

  console.log('\n[6] Guardando en averias_resueltas…');
  try {
    await pool.query(
      `INSERT INTO averias_resueltas
          (chat_token, es_averia, marca, tipo_averia, modelo, funcion, resumen, descripcion, solucion, precio_reparacion)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
          es_averia=VALUES(es_averia), marca=VALUES(marca), tipo_averia=VALUES(tipo_averia),
          modelo=VALUES(modelo), funcion=VALUES(funcion), resumen=VALUES(resumen),
          descripcion=VALUES(descripcion), solucion=VALUES(solucion), precio_reparacion=VALUES(precio_reparacion)`,
      [
        TEST_TOKEN,
        parsed.es_averia ? 1 : 0,
        parsed.marca ?? null, parsed.tipo_averia ?? null, parsed.modelo ?? null, parsed.funcion ?? null,
        parsed.resumen ?? null, parsed.descripcion ?? null, parsed.solucion ?? null,
        precio,
      ]
    );
    console.log('  Guardado correctamente.');

    // Leer de vuelta para confirmar
    const [saved] = await pool.query('SELECT * FROM averias_resueltas WHERE chat_token=?', [TEST_TOKEN]);
    console.log('\n--- REGISTRO EN BD ---');
    console.log(JSON.stringify(saved[0], null, 2));
    console.log('----------------------');
  } catch (e) {
    console.error(`  ERROR guardando en BD: ${e.message}`);
  }

  await cleanup(pool);
  console.log('\n' + '='.repeat(60));
  console.log('  TEST COMPLETADO');
  console.log('='.repeat(60) + '\n');
})();

async function cleanup(pool) {
  console.log('\n[cleanup] Eliminando datos de prueba…');
  try {
    await pool.query('DELETE FROM averias_resueltas WHERE chat_token=?', [TEST_TOKEN]);
    await pool.query('DELETE FROM chat_mensajes WHERE token=?', [TEST_TOKEN]);
    await pool.query('DELETE FROM presupuestos WHERE token=?', [TEST_TOKEN]);
    console.log('  Datos eliminados.');
  } catch (e) {
    console.warn(`  Advertencia al limpiar: ${e.message}`);
  }
  await pool.end();
}
