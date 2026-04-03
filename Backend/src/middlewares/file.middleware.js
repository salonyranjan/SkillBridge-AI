const multer = require("multer");

// MUST use memoryStorage for pdf-parse to work with req.file.buffer
const storage = multer.memoryStorage();

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

module.exports = upload;