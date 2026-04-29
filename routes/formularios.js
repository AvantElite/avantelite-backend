const { Router } = require('express');
const pool   = require('../db');
const { asyncHandler } = require('../helpers');
const { sendMail, emailShell, esc, nl2br, confirmationEmailHtml } = require('../mailer');

const router = Router();

// POST /contacto — formulario HTML del sitio
router.post('/contacto', asyncHandler(async (req, res) => {
    const nombre       = String(req.body.nombre       ?? '').trim().slice(0, 100);
    const apellido     = String(req.body.apellido     ?? '').trim().slice(0, 100);
    const email        = String(req.body.email        ?? '').trim().toLowerCase().slice(0, 200);
    const telefono     = String(req.body.telefono     ?? '').trim().slice(0, 30);
    const producto     = String(req.body.producto     ?? 'General').trim().slice(0, 100);
    const problema     = String(req.body.problema     ?? '').trim().slice(0, 300);
    const mensaje      = String(req.body.mensaje      ?? '').trim().slice(0, 2000);
    const origen_sitio = String(req.body.origen_sitio ?? 'AVANTSTORE').trim().slice(0, 50);

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        return res.status(400).json({ error: 'Email inválido.' });

    await pool.query(
        'INSERT INTO contactos (nombre,apellido,email,telefono,producto,problema,mensaje,origen) VALUES (?,?,?,?,?,?,?,?)',
        [nombre, apellido, email, telefono, producto, problema, mensaje, origen_sitio]
    );
    const body = confirmationEmailHtml({ nombre, apellido, producto, problema });
    try { await sendMail({ to: email, toName: `${nombre} ${apellido}`, subject: 'Hemos recibido tu consulta — AvantService', html: body }); }
    catch (e) { console.error('Email confirmation error:', e.message); }
    res.json({ success: true });
}));

// POST /api/diy — formulario AvantFix
router.post('/api/diy', asyncHandler(async (req, res) => {
    const { nivel='', email='', mensaje='' } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !['facil','medio','dificil'].includes(nivel))
        return res.status(400).json({ error: 'Datos inválidos.' });

    const [result] = await pool.query(
        "INSERT INTO contactos (email,mensaje,dificultad,origen,tipo) VALUES (?,?,?,'DIY','diy')",
        [email, mensaje, nivel]
    );
    if (!result.affectedRows) return res.status(500).json({ error: 'Error al guardar.' });

    const nl = { facil:'Fácil', medio:'Medio', dificil:'Difícil' }[nivel];

    const bodyEmpresa = emailShell(`
        <div style="padding:28px 36px;">
            <table style="width:100%;border-collapse:collapse;font-size:0.92rem;margin-bottom:20px;">
                <tr><td style="color:#94a3b8;padding:6px 0;width:160px;">Correo:</td><td style="color:#e2e8f0;">${esc(email)}</td></tr>
                <tr><td style="color:#94a3b8;padding:6px 0;">Nivel:</td><td style="color:#e2e8f0;font-weight:700;">${nl}</td></tr>
            </table>
            <div style="background:#ffffff0d;border:1px solid #ffffff1a;border-radius:10px;padding:18px 22px;">
                <p style="margin:0 0 8px;font-size:0.78rem;text-transform:uppercase;letter-spacing:0.08em;color:#00f0ff;">Descripción</p>
                <p style="margin:0;color:#e2e8f0;line-height:1.65;">${nl2br(mensaje)}</p>
            </div>
        </div>`);

    const bodyCliente = emailShell(`
        <div style="padding:36px 40px;">
            <p style="font-size:1rem;margin:0 0 16px;">Hola,</p>
            <p style="color:#94a3b8;line-height:1.7;margin:0 0 24px;">
                Hemos recibido tu consulta de <strong style="color:#e2e8f0;">AvantFix</strong>. Nuestro equipo la está revisando.
            </p>
            <div style="background:#ffffff0d;border:1px solid #ffffff1a;border-radius:10px;padding:20px 24px;">
                <table style="width:100%;border-collapse:collapse;font-size:0.92rem;">
                    <tr><td style="color:#94a3b8;padding:4px 0;width:160px;">Nivel:</td><td style="color:#e2e8f0;"><strong>${nl}</strong></td></tr>
                    <tr><td style="color:#94a3b8;padding:4px 0;vertical-align:top;">Descripción:</td><td style="color:#e2e8f0;">${nl2br(mensaje)}</td></tr>
                </table>
            </div>
        </div>`);

    try {
        await sendMail({ to: process.env.COMPANY_EMAIL || process.env.MAIL_FROM, toName: 'AvantService', subject: `[AvantFix — ${nl}] Consulta de ${email}`, html: bodyEmpresa, replyTo: email });
        await sendMail({ to: email, subject: 'Hemos recibido tu consulta — AvantService', html: bodyCliente });
        res.json({ success: true });
    } catch (e) {
        console.error('[diy] sendMail error:', e.message);
        res.status(500).json({ error: 'Error al enviar el correo. Inténtalo de nuevo.' });
    }
}));

module.exports = router;
