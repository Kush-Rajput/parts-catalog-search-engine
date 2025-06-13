import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import fetch from 'node-fetch';

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = './data';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const name = path.basename(file.originalname, path.extname(file.originalname));
    cb(null, `${name}.xlsx`);
  }
});

const upload = multer({ storage });

router.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  const baseName = path.basename(req.file.originalname, path.extname(req.file.originalname)).toLowerCase();

  // Notify FastAPI
  try {
    await fetch(`http://localhost:8000/api/refresh/${baseName}`, { method: 'POST' });
  } catch (err) {
    console.error(`⚠️ Failed to notify FastAPI to reload: ${err.message}`);
  }

  res.json({ message: `Uploaded and refreshed ${req.file.originalname}` });
});

export default router;
