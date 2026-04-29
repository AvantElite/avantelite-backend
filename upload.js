const crypto = require('crypto');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');

const FILE_SIGNATURES = {
    '.jpg':  [{ offset: 0, bytes: [0xFF, 0xD8, 0xFF] }],
    '.jpeg': [{ offset: 0, bytes: [0xFF, 0xD8, 0xFF] }],
    '.png':  [{ offset: 0, bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] }],
    '.gif':  [{ offset: 0, bytes: [0x47, 0x49, 0x46, 0x38] }],
    '.webp': [{ offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] }, { offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] }],
    '.pdf':  [{ offset: 0, bytes: [0x25, 0x50, 0x44, 0x46] }],
    '.doc':  [{ offset: 0, bytes: [0xD0, 0xCF, 0x11, 0xE0] }],
    '.docx': [{ offset: 0, bytes: [0x50, 0x4B, 0x03, 0x04] }],
};

function validateMagicBytes(filePath, ext) {
    const sigs = FILE_SIGNATURES[ext];
    if (!sigs) return true;
    const needed = Math.max(...sigs.map(s => s.offset + s.bytes.length));
    const buf = Buffer.alloc(needed, 0);
    const fd = fs.openSync(filePath, 'r');
    try { fs.readSync(fd, buf, 0, needed, 0); }
    finally { fs.closeSync(fd); }
    return sigs.every(sig => sig.bytes.every((b, i) => buf[sig.offset + i] === b));
}

const storage = multer.diskStorage({
    destination: path.join(__dirname, 'uploads'),
    filename: (_req, file, cb) => {
        const ext  = path.extname(file.originalname).toLowerCase().replace(/[^a-z0-9.]/g, '');
        const rand = crypto.randomBytes(16).toString('hex');
        cb(null, `${rand}${ext}`);
    },
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const ALLOWED_CHAT_EXTENSIONS  = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx', '.txt']);
const ALLOWED_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);

module.exports = { upload, FILE_SIGNATURES, validateMagicBytes, ALLOWED_CHAT_EXTENSIONS, ALLOWED_IMAGE_EXTENSIONS };
