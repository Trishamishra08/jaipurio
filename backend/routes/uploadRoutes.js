const express = require('express');
const multer = require('multer');
const path = require('path');
const { uploadBuffer } = require('../utils/minioStorage');

const router = express.Router();

// Use memory storage for uploading directly to MinIO
const storage = multer.memoryStorage();

function checkFileType(file, cb) {
  // Allowed extensions: images, pdfs, videos
  const filetypes = /jpg|jpeg|png|webp|gif|pdf|mp4|mov|avi|mkv|webm/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype) || file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/');

  if (extname || mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Images, PDFs, and Videos only!'));
  }
}

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

router.post('/', upload.array('documents', 10), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'No files uploaded' });
  }

  try {
    const uploaded = await Promise.all(req.files.map((file) => uploadBuffer(file, 'general')));
    const fileUrls = uploaded.map((f) => f.url);

    res.status(200).json({
      success: true,
      data: fileUrls,
    });
  } catch (error) {
    console.error('MinIO upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Upload failed',
      error: error.message,
    });
  }
});

module.exports = router;
