const { v2: cloudinary } = require('cloudinary');

// Lee CLOUDINARY_URL automáticamente del entorno.
// Formato: cloudinary://api_key:api_secret@cloud_name

function uploadBuffer(buffer, options = {}) {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
        stream.end(buffer);
    });
}

module.exports = { uploadBuffer };
