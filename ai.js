const pool = require('./db');

const OLLAMA_BASE = process.env.OLLAMA_URL || 'http://localhost:11434';

function extractJson(text) {
    const clean = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    const start = clean.indexOf('{');
    const end   = clean.lastIndexOf('}');
    if (start === -1 || end === -1 || end < start) return null;
    return clean.slice(start, end + 1);
}

async function getAiConfig() {
    try {
        const [rows] = await pool.query("SELECT valor FROM app_config WHERE clave='ia_config' LIMIT 1");
        if (rows.length) return JSON.parse(rows[0].valor);
    } catch {}
    return null;
}

async function aiGenerate(prompt, maxTokens = 2048) {
    const cfg      = await getAiConfig();
    const proveedor = cfg?.proveedor_generacion ?? 'ollama';

    if (proveedor === 'ollama') {
        const modelo = cfg?.modelo_generacion || 'qwen2.5:3b';
        const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model:   modelo,
                stream:  false,
                options: { num_predict: maxTokens },
                messages: [{ role: 'user', content: prompt }],
            }),
        });
        if (!res.ok) {
            const errBody = await res.text();
            const e = new Error(`Ollama error ${res.status}: ${errBody}`);
            e.userFacing = true; throw e;
        }
        const data = await res.json();
        return data.message?.content ?? '';
    }

    if (proveedor === 'anthropic') {
        const key = process.env.ANTHROPIC_API_KEY;
        if (!key) { const e = new Error('No hay clave ANTHROPIC_API_KEY. Añádela en el .env del servidor.'); e.userFacing = true; throw e; }
        const modelo = cfg?.modelo_generacion || 'claude-haiku-4-5-20251001';
        const res = await fetch('https://api.anthropic.com/v1/messages', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
            body: JSON.stringify({ model: modelo, max_tokens: maxTokens, messages: [{ role: 'user', content: prompt }] }),
        });
        if (!res.ok) { const e = new Error(`Anthropic error ${res.status}: ${await res.text()}`); e.userFacing = true; throw e; }
        const data = await res.json();
        return data.content[0].text;
    }

    if (proveedor === 'openai') {
        const key = process.env.OPENAI_API_KEY;
        if (!key) { const e = new Error('No hay clave OPENAI_API_KEY. Añádela en el .env del servidor.'); e.userFacing = true; throw e; }
        const modelo = cfg?.modelo_generacion || 'gpt-4o-mini';
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
            body: JSON.stringify({ model: modelo, max_tokens: maxTokens, messages: [{ role: 'user', content: prompt }] }),
        });
        if (!res.ok) { const e = new Error(`OpenAI error ${res.status}: ${await res.text()}`); e.userFacing = true; throw e; }
        const data = await res.json();
        return data.choices[0].message.content;
    }

    const e = new Error(`Proveedor de IA no soportado: ${proveedor}`); e.userFacing = true; throw e;
}

module.exports = { extractJson, getAiConfig, aiGenerate, OLLAMA_BASE };
