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
app.use(cors({
  origin: ['http://localhost:3000', 'https://your-frontend-domain.com'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Disposition', 'Content-Type', 'Content-Length'],
}));

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

app.delete('/files/:id', authMiddleware, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'File not found.' });
    if (file.owner.toString() !== req.userId) return res.status(403).json({ message: 'Access denied' });

    // Delete from MongoDB only
    await File.deleteOne({ _id: file._id });
    res.status(204).send();
    
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/files/:id/download', authMiddleware, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'File not found.' });
    if (file.owner.toString() !== req.userId) return res.status(403).json({ message: 'Access denied' });

    // Improved S3 key extraction
    const s3Key = decodeURIComponent(file.fileUrl.split('.com/')[1]);

    const s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
    });

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.fileName)}"`);

    const s3Stream = s3.getObject({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: s3Key,
    }).createReadStream();

    s3Stream.on('error', (err) => {
      console.error('S3 Error:', err, {
        bucket: process.env.AWS_BUCKET_NAME,
        key: s3Key,
        fileUrl: file.fileUrl
      });
      return res.status(500).json({ error: 'Failed to download file' });
    });

    s3Stream.pipe(res);

  } catch (err) {
    console.error('Download Error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/files/:id/preview', authMiddleware, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'File not found.' });
    if (file.owner.toString() !== req.userId) return res.status(403).json({ message: 'Access denied' });

    const s3Key = decodeURIComponent(file.fileUrl.split('.com/')[1]);

    const s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
    });

    // Generate signed URL that expires in 5 minutes
    const signedUrl = await s3.getSignedUrlPromise('getObject', {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: s3Key,
      Expires: 300, // URL expires in 5 minutes
      ResponseContentDisposition: 'inline', // This makes it preview in browser
      ResponseContentType: file.type, // Use original file type
    });

    res.json({ previewUrl: signedUrl });

  } catch (err) {
    console.error('Preview Error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(process.env.PORT || 5000, () => console.log('Server started'));
