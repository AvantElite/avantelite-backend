require('dotenv').config();
const nodemailer = require('nodemailer');

const mailer = nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   parseInt(process.env.SMTP_PORT),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },
});

async function sendMail({ to, toName, subject, html, replyTo } = {}) {
    await mailer.sendMail({
        from:    `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM}>`,
        to:      toName ? { name: toName, address: to } : to,
        subject,
        html,
        ...(replyTo ? { replyTo } : {}),
    });
}

const emailShell = (content) => `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0b0f19;color:#e2e8f0;border-radius:12px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#0057ff,#00f0ff22);padding:28px 36px;">
            <h1 style="margin:0;font-size:1.5rem;color:#fff;"><span style="color:#00f0ff;">Avant</span>Service</h1>
            <p style="margin:6px 0 0;color:#94a3b8;font-size:0.88rem;">Servicio Técnico Profesional</p>
        </div>
        ${content}
        <div style="border-top:1px solid #ffffff1a;padding:16px 36px;text-align:center;">
            <p style="margin:0;color:#475569;font-size:0.76rem;">© 2026 AvantService</p>
        </div>
    </div>`;

const esc   = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const nl2br = (s) => esc(s).replace(/\n/g, '<br>');

function confirmationEmailHtml({ nombre, apellido, producto, problema }) {
    return emailShell(`
        <div style="padding:36px 40px;">
            <p style="font-size:1rem;margin:0 0 16px;">Hola, <strong>${esc(nombre)} ${esc(apellido)}</strong>:</p>
            <p style="color:#94a3b8;line-height:1.7;margin:0 0 24px;">
                Hemos recibido correctamente tu consulta y nuestro equipo técnico la está revisando.
            </p>
            <div style="background:#ffffff0d;border:1px solid #ffffff1a;border-radius:10px;padding:20px 24px;margin-bottom:28px;">
                <p style="margin:0 0 10px;font-size:0.8rem;text-transform:uppercase;letter-spacing:0.08em;color:#00f0ff;">Resumen de tu consulta</p>
                <table style="width:100%;border-collapse:collapse;font-size:0.92rem;">
                    <tr><td style="color:#94a3b8;padding:4px 0;width:140px;">Producto:</td><td style="color:#e2e8f0;"><strong>${esc(producto)}</strong></td></tr>
                    <tr><td style="color:#94a3b8;padding:4px 0;">Tipo de consulta:</td><td style="color:#e2e8f0;"><strong>${esc(problema)}</strong></td></tr>
                </table>
            </div>
        </div>`);
}

module.exports = { sendMail, emailShell, esc, nl2br, confirmationEmailHtml };
