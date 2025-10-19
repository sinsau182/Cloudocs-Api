import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import dotenv from 'dotenv';
import cors from 'cors';
import authRouter from './routes/auth.js';
import authMiddleware from './middleware/auth.js';

import File from './models/File.js';
import { uploadToS3 } from './utils/s3.js';
import AWS from 'aws-sdk';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI);

// Multer middleware: store file in memory
const storage = multer.memoryStorage();
const upload = multer({ storage });

app.use('/auth', authRouter);

// protect upload and file endpoints
app.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ message: 'No file uploaded.' });
    const s3Url = await uploadToS3(file);

    const fileDoc = await File.create({
      fileName: file.originalname,
      fileUrl: s3Url,
      size: file.size,
      type: file.mimetype,
      owner: req.userId, // <-- associate with current user
    });
    res.status(201).json(fileDoc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/files', authMiddleware, async (req, res) => {
  try {
    // return only files belonging to the authenticated user
    const files = await File.find({ owner: req.userId });
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/files/:id', authMiddleware, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'File not found.' });
    if (file.owner.toString() !== req.userId) return res.status(403).json({ message: 'Access denied' });

    res.json(file);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/files/:id/download', authMiddleware, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'File not found.' });
    if (file.owner.toString() !== req.userId) return res.status(403).json({ message: 'Access denied' });

    // Extract the S3 key (filename) from the S3 URL
    // Example S3 URL: https://bucket-name.s3.amazonaws.com/1634567890-filename.txt
    const urlParts = file.fileUrl.split('/');
    const s3Key = urlParts.slice(3).join('/'); // after the bucket name

    const s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
    });

    // Set headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);

    // Stream the file from S3 through this API endpoint
    const s3Stream = s3.getObject({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: s3Key,
    }).createReadStream();

    s3Stream.on('error', (err) => {
      return res.status(500).json({ error: 'Failed to download file' });
    });

    s3Stream.pipe(res);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(process.env.PORT || 5000, () => console.log('Server started'));
