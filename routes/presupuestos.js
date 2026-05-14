const crypto  = require('crypto');
const { Router } = require('express');
const { presupuestos, sesiones, contactos, chat } = require('../db/index');
const { asyncHandler } = require('../helpers');
const { requireAuth, requirePortalAuth } = require('../auth');
const { aiGenerate, extractJson } = require('../ai');
const { sendMail, emailShell, esc, nl2br, confirmationEmailHtml } = require('../mailer');

const router = Router();

// ── Portal login  POST /api/portal/login ─────────────────────────────────────
router.post('/portal/login', asyncHandler(async (req, res) => {
    const token = (req.body.token ?? '').trim();
    const email = (req.body.email ?? '').trim().toLowerCase();
    if (!token || !email) return res.status(400).json({ error: 'Datos inválidos.' });

    const r       = await presupuestos.findByTokenWithContacto(token);
    const emailBD = (r?.email ?? '').trim().toLowerCase();
    if (!r || (emailBD && emailBD !== email))
        return res.status(401).json({ error: 'Enlace o correo inválidos.' });

    const portalToken = crypto.randomBytes(32).toString('hex');
    const expiresAt   = new Date(Date.now() + 24 * 3600 * 1000);
    await sesiones.createPortalSession(portalToken, token, expiresAt);

    res.json({
        success:      true,
        portal_token: portalToken,
        presupuesto: {
            nombre:  `${r.nombre ?? ''} ${r.apellido ?? ''}`.trim(),
            lineas:  presupuestos.parseLineas(r.lineas),
            total:   parseFloat(r.total ?? 0),
            mensaje: r.mensaje ?? '',
            notas:   r.notas ?? '',
            estado:  r.estado ?? 'pendiente',
            fecha:   r.created_at ?? null,
        },
    });
}));

// ── GET /api/presupuesto ──────────────────────────────────────────────────────
router.get('/presupuesto', asyncHandler(async (req, res) => {
    const token = (req.query.token ?? '').trim();
    if (!token) return res.status(400).json({ error: 'Token requerido.' });

    const adminToken = (req.headers['x-token'] ?? '').trim();
    if (adminToken) {
        if (!await requireAuth(req, res)) return;
        const r = await presupuestos.findByTokenWithContacto(token);
        if (!r) return res.status(404).json({ error: 'Presupuesto no encontrado.' });
        return res.json({
            email:   r.email,
            nombre:  `${r.nombre ?? ''} ${r.apellido ?? ''}`.trim(),
            lineas:  presupuestos.parseLineas(r.lineas),
            total:   parseFloat(r.total ?? 0),
            mensaje: r.mensaje ?? '',
            notas:   r.notas ?? '',
            estado:  r.estado ?? 'pendiente',
            fecha:   r.created_at ?? null,
        });
    }

    const session = await requirePortalAuth(req, res);
    if (!session || session.presupuestoToken !== token)
        return res.status(401).json({ error: 'No autorizado.' });

    const r = await presupuestos.findByTokenWithContacto(token);
    if (!r) return res.status(404).json({ error: 'Presupuesto no encontrado.' });
    res.json({
        nombre:  `${r.nombre ?? ''} ${r.apellido ?? ''}`.trim(),
        lineas:  presupuestos.parseLineas(r.lineas),
        total:   parseFloat(r.total ?? 0),
        mensaje: r.mensaje ?? '',
        notas:   r.notas ?? '',
        estado:  r.estado ?? 'pendiente',
        fecha:   r.created_at ?? null,
    });
}));

// ── POST /api/presupuesto/enviar ──────────────────────────────────────────────
router.post('/presupuesto/enviar', asyncHandler(async (req, res) => {
    if (!await requireAuth(req, res)) return;
    const { email='', nombre='', contacto_id=0, lineas=[], total=0, mensaje='', notas='' } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        return res.status(400).json({ error: 'Email inválido.' });

    const token        = crypto.randomBytes(32).toString('hex');
    const PORTAL_BASE  = process.env.PORTAL_URL || 'http://localhost/backendavant/portal.html';
    const ALLOWED_PORTAL_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
    try {
        const u = new URL(PORTAL_BASE);
        if (ALLOWED_PORTAL_ORIGINS.length && !ALLOWED_PORTAL_ORIGINS.some(o => { try { return new URL(o).origin === u.origin; } catch { return false; } }))
            throw new Error('PORTAL_URL no está entre los orígenes permitidos (ALLOWED_ORIGINS).');
    } catch (e) { if (e.message.includes('PORTAL_URL')) throw e; }
    const portalUrl = `${PORTAL_BASE}?token=${token}`;

    if (parseInt(contacto_id)) {
        await presupuestos.create({
            contacto_id: parseInt(contacto_id),
            token, lineas, total: parseFloat(total), mensaje, notas,
        });
    }

    const lineasHtml = (lineas || []).map(l => {
        const desc   = esc(l.descripcion ?? '');
        const precio = l.precio !== '' && l.precio != null ? `${parseFloat(l.precio).toFixed(2)} €` : 'A consultar';
        return desc ? `<tr><td style="padding:8px 0;color:#e2e8f0;border-bottom:1px solid #ffffff0d;">${desc}</td><td style="padding:8px 0;color:#e2e8f0;border-bottom:1px solid #ffffff0d;text-align:right;font-weight:600;">${precio}</td></tr>` : '';
    }).join('');

    const mensajeHtml = mensaje
        ? `<p style="color:#94a3b8;line-height:1.7;margin:0 0 24px;">${nl2br(mensaje)}</p>`
        : '<p style="color:#94a3b8;line-height:1.7;margin:0 0 24px;">Tras revisar su solicitud, le enviamos el presupuesto para la reparación de su dispositivo.</p>';

    const notasHtml = notas
        ? `<div style="margin-top:20px;padding:14px 18px;background:#ffffff08;border-radius:8px;"><p style="margin:0 0 6px;font-size:0.78rem;text-transform:uppercase;letter-spacing:0.08em;color:#00f0ff;">Observaciones</p><p style="margin:0;color:#94a3b8;font-size:0.88rem;line-height:1.65;">${nl2br(notas)}</p></div>`
        : '';

    const html = emailShell(`
        <div style="padding:32px 36px;">
            <p style="font-size:1rem;margin:0 0 16px;">Estimado/a ${esc(nombre || 'cliente')},</p>
            ${mensajeHtml}
            <div style="background:#ffffff0d;border:1px solid #ffffff1a;border-radius:10px;padding:20px 24px;">
                <p style="margin:0 0 14px;font-size:0.78rem;text-transform:uppercase;letter-spacing:0.08em;color:#00f0ff;">Desglose del presupuesto</p>
                <table style="width:100%;border-collapse:collapse;font-size:0.9rem;">
                    ${lineasHtml}
                    <tr><td style="padding:12px 0 0;color:#94a3b8;font-size:0.82rem;">Total estimado (IVA incluido)</td><td style="padding:12px 0 0;text-align:right;font-size:1.2rem;font-weight:700;color:#00f0ff;">${parseFloat(total).toFixed(2)} €</td></tr>
                </table>
            </div>
            ${notasHtml}
            <div style="margin:24px 0 0;text-align:center;">
                <a href="${portalUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#0057ff,#00f0ff);color:#fff;font-weight:700;font-size:0.95rem;border-radius:10px;text-decoration:none;">Chatear →</a>
                <p style="margin:12px 0 0;color:#475569;font-size:0.78rem;">Este presupuesto tiene una validez de <strong style="color:#94a3b8;">15 días</strong>.</p>
            </div>
        </div>`);

    try {
        await sendMail({ to: email, toName: nombre, subject: 'Presupuesto de reparación — AvantService', html });
        res.json({ success: true, token });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}));

// ── POST /api/presupuesto/aceptar ─────────────────────────────────────────────
router.post('/presupuesto/aceptar', asyncHandler(async (req, res) => {
    const token  = (req.body.token  ?? '').trim();
    const accion = (req.body.accion ?? '').trim();
    if (!token || !['aceptado','rechazado'].includes(accion))
        return res.status(400).json({ error: 'Datos inválidos.' });
    const ok = await presupuestos.setEstadoSiPendiente(token, accion);
    ok
        ? res.json({ success: true, estado: accion })
        : res.json({ success: false, message: 'El presupuesto ya fue respondido o no existe.' });
}));

// ── POST /api/presupuesto/rechazar ────────────────────────────────────────────
router.post('/presupuesto/rechazar', asyncHandler(async (req, res) => {
    if (!await requireAuth(req, res)) return;
    const { email='', nombre='', motivo='' } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        return res.status(400).json({ error: 'Email inválido.' });
    if (!motivo) return res.status(400).json({ error: 'El motivo de rechazo es obligatorio.' });

    const html = emailShell(`
        <div style="padding:32px 36px;">
            <p style="font-size:1rem;margin:0 0 20px;">Estimado/a ${esc(nombre || 'cliente')},</p>
            <div style="background:#f43f5e0d;border:1px solid #f43f5e30;border-radius:10px;padding:20px 24px;">
                <p style="margin:0;color:#e2e8f0;line-height:1.7;">${nl2br(motivo)}</p>
            </div>
            <p style="margin:24px 0 0;color:#94a3b8;font-size:0.85rem;line-height:1.6;">Si tiene alguna duda, puede responder a este correo.</p>
        </div>`);

    try {
        await sendMail({ to: email, toName: nombre, subject: 'Respuesta a su solicitud — AvantService', html });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}));

// ── POST /api/presupuesto/reply ───────────────────────────────────────────────
router.post('/presupuesto/reply', asyncHandler(async (req, res) => {
    if (!await requireAuth(req, res)) return;
    const { email='', nombre='', apellido='', producto='', problema='', respuesta='' } = req.body;
    if (!email || !respuesta)
        return res.status(400).json({ error: 'Email y respuesta son obligatorios.' });

    const html = confirmationEmailHtml({ nombre, apellido, producto, problema }) + `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0b0f19;padding:0 40px 32px;">
            <div style="border-top:1px solid #ffffff1a;padding-top:24px;">
                <p style="margin:0 0 10px;font-size:0.8rem;text-transform:uppercase;letter-spacing:0.08em;color:#00f0ff;">Respuesta de nuestro equipo</p>
                <div style="background:#ffffff08;border-left:3px solid #00f0ff;border-radius:0 8px 8px 0;padding:16px 20px;color:#e2e8f0;font-size:0.93rem;line-height:1.7;">${nl2br(respuesta)}</div>
            </div>
        </div>`;

    try {
        await sendMail({ to: email, toName: `${nombre} ${apellido}`, subject: `Re: ${problema} — AvantService`, html });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}));

// ── POST /api/presupuesto/actualizar ─────────────────────────────────────────
router.post('/presupuesto/actualizar', asyncHandler(async (req, res) => {
    if (!await requireAuth(req, res)) return;
    const { token='', lineas=[], total=0, mensaje='', notas='' } = req.body;
    if (!token) return res.status(400).json({ error: 'Token requerido.' });

    const r = await presupuestos.findByTokenWithContacto(token);
    if (!r) return res.status(404).json({ error: 'Presupuesto no encontrado.' });

    await presupuestos.update(token, { lineas, total: parseFloat(total), mensaje, notas });

    const nombre   = `${r.nombre ?? ''} ${r.apellido ?? ''}`.trim() || r.email;
    const portalUrl = `${process.env.PORTAL_URL || 'http://localhost/backendavant/portal.html'}?token=${token}`;

    const lineasHtml = (lineas || []).map(l => {
        const desc   = esc(l.descripcion ?? '');
        const precio = l.precio !== '' && l.precio != null ? `${parseFloat(l.precio).toFixed(2)} €` : 'A consultar';
        return desc ? `<tr><td style="padding:8px 0;color:#e2e8f0;border-bottom:1px solid #ffffff0d;">${desc}</td><td style="padding:8px 0;color:#e2e8f0;border-bottom:1px solid #ffffff0d;text-align:right;font-weight:600;">${precio}</td></tr>` : '';
    }).join('');

    const html = emailShell(`
        <div style="padding:32px 36px;">
            <p style="font-size:1rem;margin:0 0 16px;">Estimado/a ${esc(nombre)},</p>
            <p style="color:#94a3b8;line-height:1.7;margin:0 0 24px;">${mensaje ? nl2br(mensaje) : 'Hemos actualizado el presupuesto para la reparación de su dispositivo.'}</p>
            <div style="background:#ffffff0d;border:1px solid #ffffff1a;border-radius:10px;padding:20px 24px;">
                <p style="margin:0 0 14px;font-size:0.78rem;text-transform:uppercase;letter-spacing:0.08em;color:#00f0ff;">Presupuesto actualizado</p>
                <table style="width:100%;border-collapse:collapse;font-size:0.9rem;">${lineasHtml}
                    <tr><td style="padding:12px 0 0;color:#94a3b8;font-size:0.82rem;">Total estimado (IVA incluido)</td><td style="padding:12px 0 0;text-align:right;font-size:1.2rem;font-weight:700;color:#00f0ff;">${parseFloat(total).toFixed(2)} €</td></tr>
                </table>
            </div>
            <div style="margin:24px 0 0;text-align:center;">
                <a href="${portalUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#0057ff,#00f0ff);color:#fff;font-weight:700;font-size:0.95rem;border-radius:10px;text-decoration:none;">Ver presupuesto →</a>
            </div>
        </div>`);

    try {
        await sendMail({ to: r.email, toName: nombre, subject: 'Presupuesto actualizado — AvantService', html });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}));

// ── POST /api/presupuesto/sugerir ─────────────────────────────────────────────
router.post('/presupuesto/sugerir', asyncHandler(async (req, res) => {
    if (!await requireAuth(req, res)) return;
    const { contacto_id, token } = req.body;

    let contacto     = null;
    let chatMensajes = [];

    if (token) {
        contacto = await presupuestos.findContactoByPresupuestoToken(token);
    } else if (contacto_id) {
        contacto = await contactos.findById(parseInt(contacto_id));
    }

    if (!contacto) return res.status(404).json({ error: 'Contacto no encontrado.' });

    const chatToken = token || contacto.chat_token;
    if (chatToken) {
        chatMensajes = await chat.listMensajesParaIA(chatToken, 40);
    }

    const sanitizeForPrompt = (s) => String(s ?? '').replace(/[<>]/g, '').replace(/\bignora\b|\bolvida\b|\bsystem\b|\bprompt\b/gi, '[...]').slice(0, 500);

    const chatTranscript = chatMensajes.length
        ? '\n\nConversación del chat:\n' + chatMensajes.map(m => `[${m.sender === 'tecnico' ? 'Técnico' : 'Cliente'}]: ${sanitizeForPrompt(m.mensaje)}`).join('\n')
        : '';

    const prompt = `Eres un asistente de una empresa de reparación de electrodomésticos y tecnología.
Basándote en la siguiente información del cliente, genera líneas de presupuesto detalladas y realistas.

Datos del cliente:
- Producto: ${sanitizeForPrompt(contacto.producto) || 'No especificado'}
- Problema: ${sanitizeForPrompt(contacto.problema) || 'No especificado'}
- Mensaje del cliente: ${sanitizeForPrompt(contacto.mensaje)}${chatTranscript}

Genera entre 2 y 5 líneas de presupuesto. Responde SOLO con un JSON válido en este formato exacto:
{
  "lineas": [
    { "descripcion": "Diagnóstico y revisión del equipo", "precio": 25 },
    { "descripcion": "Cambio de pieza X", "precio": 80 }
  ],
  "mensaje": "Tras revisar su solicitud, hemos preparado el siguiente presupuesto para la reparación de su equipo.",
  "notas": "Plazo estimado: 3-5 días hábiles. Garantía de 3 meses en piezas y mano de obra."
}
No incluyas texto fuera del JSON.`;

    const aiText = await aiGenerate(prompt, 600);

    let parsed;
    try {
        const jsonStr = extractJson(aiText);
        if (!jsonStr) throw new Error('No JSON found');
        parsed = JSON.parse(jsonStr);
    } catch {
        console.error('[presupuesto/sugerir] AI raw response:', aiText);
        return res.status(500).json({ error: 'La IA devolvió un formato inesperado. Inténtalo de nuevo.' });
    }

    res.json({ success: true, lineas: parsed.lineas ?? [], mensaje: parsed.mensaje ?? '', notas: parsed.notas ?? '' });
}));

module.exports = router;
