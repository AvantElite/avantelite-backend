const https = require('https');
const { blog } = require('./db/index');

// ── Async wrapper ─────────────────────────────────────────────────────────────
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ── Blog helpers ──────────────────────────────────────────────────────────────
function slugify(text) {
    return text.toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/[\s-]+/g, '-').trim() || 'post';
}

// Re-exporta uniqueSlug para compatibilidad con código existente.
// Nuevo código debería importarlo de './db/blog' directamente.
const uniqueSlug = (_dbIgnored, base, excludeId = 0) => blog.uniqueSlug(base, excludeId);

// ── User-agent parsing ────────────────────────────────────────────────────────
function parseBrowser(ua = '') {
    if (ua.includes('Edg/'))    return 'Edge';
    if (ua.includes('OPR/') || ua.includes('Opera')) return 'Opera';
    if (ua.includes('Chrome'))  return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari'))  return 'Safari';
    if (ua.includes('MSIE') || ua.includes('Trident')) return 'IE';
    return 'Otro';
}

function parseOS(ua = '') {
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac OS X')) return 'macOS';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
    if (ua.includes('Linux'))   return 'Linux';
    return 'Otro';
}

// ── Geo IP ────────────────────────────────────────────────────────────────────
async function geoFromIP(ip) {
    if (['127.0.0.1', '::1', ''].includes(ip)) return ['', '', ''];
    return new Promise((resolve) => {
        https.get(`https://ip-api.com/json/${ip}?fields=status,country,regionName,city&lang=es`, (res) => {
            let data = '';
            res.on('data', (c) => data += c);
            res.on('end', () => {
                try {
                    const g = JSON.parse(data);
                    if (g.status === 'fail') return resolve(['', '', '']);
                    resolve([g.country ?? '', g.regionName ?? '', g.city ?? '']);
                } catch { resolve(['', '', '']); }
            });
        }).on('error', () => resolve(['', '', '']));
    });
}

module.exports = { asyncHandler, slugify, uniqueSlug, parseBrowser, parseOS, geoFromIP };
