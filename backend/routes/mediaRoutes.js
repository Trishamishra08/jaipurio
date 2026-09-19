const express = require('express');
const multer = require('multer');
const path = require('path');
const { protect, authorize } = require('../middlewares/authMiddleware');
const {
  listMedia,
  getMedia,
  createFolder,
  uploadMedia,
  renameMedia,
  updateAlt,
  replaceMediaFile,
  toggleFavorite,
  moveMedia,
  copyMedia,
  trashMedia,
  restoreMedia,
  destroyMedia,
  downloadMedia,
  ensureDefaultFolders,
} = require('../controllers/mediaController');

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const ok =
      /jpg|jpeg|png|webp|gif|pdf|mp4|mov|avi|mkv|webm/i.test(path.extname(file.originalname)) ||
      file.mimetype.startsWith('image/') ||
      file.mimetype.startsWith('video/') ||
      file.mimetype === 'application/pdf';
    cb(ok ? null : new Error('Images, PDFs, and Videos only'), ok);
  },
});

router.use(protect, authorize('admin'));

router.get('/', listMedia);
router.post('/folders/ensure-defaults', ensureDefaultFolders);
router.post('/folders', createFolder);
router.post('/upload', upload.array('documents', 20), uploadMedia);
router.get('/:id/download', downloadMedia);
router.put('/:id/rename', renameMedia);
router.put('/:id/alt', updateAlt);
router.put('/:id/replace', upload.single('document'), replaceMediaFile);
router.put('/:id/favorite', toggleFavorite);
router.put('/:id/move', moveMedia);
router.post('/:id/copy', copyMedia);
router.put('/:id/trash', trashMedia);
router.put('/:id/restore', restoreMedia);
router.delete('/:id', destroyMedia);
router.get('/:id', getMedia);

module.exports = router;
