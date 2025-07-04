import fs from 'fs/promises';
import path from 'path';
import PDF from '../models/PDF.js';
import Note from '../models/Note.js';
import Conversation from '../models/Conversation.js';
import { extractTextFromPDF } from '../utils/pdfUtils.js';
import { analyzeImagesLocally } from '../model/imageAnalysis.js';
import { exec } from 'child_process';
import redis from '../utils/redisClient.js';



const convertPDFToImages = async (pdfPath) => {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join('utils', 'convertToImages.py');
    exec(`python "${scriptPath}" "${pdfPath}"`, (err, stdout, stderr) => {
      if (err) return reject(stderr || err.message);
      try {
        const images = JSON.parse(stdout); // expect list of { page, imageUrl }
        resolve(images);
      } catch (e) {
        reject(`Failed to parse images: ${stdout}`);
      }
    });
  });
};

export const uploadPDF = async (req, res) => {
  try {
    const userId = req.user._id; // ✅ Extracted from JWT middleware
    const file = req.file;

    if (!file) return res.status(400).json({ error: 'PDF file is required' });

    const filePath = file.path;
    const stats = await fs.stat(filePath);
    const extractedText = await extractTextFromPDF(filePath);

    const imageList = await convertPDFToImages(filePath);
    const imagesWithDescriptions = await analyzeImagesLocally(imageList);

    const newPDF = new PDF({
      user: userId,
      filename: file.filename,
      originalName: file.originalname,
      fileSize: stats.size,
      fileType: file.mimetype,
      extractedText,
      images: imagesWithDescriptions,
      imageCount: imagesWithDescriptions.length,
    });

    await newPDF.save();
    res.status(201).json({ message: 'PDF uploaded, images analyzed, and saved.', pdf: newPDF });
  } catch (err) {
    console.error('❌ Upload Error:', err);
    res.status(500).json({ error: 'Failed to process PDF' });
  }
};



export const getUserPDFs = async (req, res) => {
  try {
    const userId = req.user._id; // ✅ from JWT

    const pdfs = await PDF.find({ user: userId }).sort({ createdAt: -1 });
    res.status(200).json(pdfs);
  } catch (error) {
    console.error('❌ Error fetching PDFs:', error);
    res.status(500).json({ error: 'Failed to fetch PDFs' });
  }
};


export const getPdfDetails = async (req, res) => {
  try {
    const userId = req.user._id; // ✅ from JWT
    const pdfId = req.params.pdfId;

    if (!pdfId) {
      return res.status(400).json({ error: 'pdfId is required' });
    }

    const pdf = await PDF.findOne({ _id: pdfId, user: userId });
    if (!pdf) {
      return res.status(404).json({ error: 'PDF not found or access denied' });
    }

    const conversations = await Conversation.find({ user: userId, pdf: pdfId }).sort({ createdAt: 1 });
    const notes = await Note.find({ user: userId, pdf: pdfId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      pdf,
      conversations,
      notes,
    });
  } catch (error) {
    console.error('❌ Error fetching PDF details:', error);
    res.status(500).json({ error: 'Failed to fetch PDF details' });
  }
};


export const deletePDF = async (req, res) => {
  try {
    const userId = req.user._id; // ✅ from JWT
    const { pdfId } = req.params;

    const pdf = await PDF.findOne({ _id: pdfId, user: userId });
    if (!pdf) return res.status(404).json({ error: 'PDF not found or access denied' });

    const mainPath = path.join('uploads', pdf.filename);
    await fs.unlink(mainPath).catch(() => {});

    for (const img of pdf.images) {
      const imagePath = path.join('public', img.imageUrl);
      await fs.unlink(imagePath).catch(() => {});
    }

    await PDF.findByIdAndDelete(pdfId);

    // ✅ Redis Cache Invalidation
    try {
      const pattern = `answer:${pdf._id}:*`;
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
        console.log(`🧹 Cleared ${keys.length} cached entries for PDF ${pdf._id}`);
      }
    } catch (err) {
      console.warn('⚠️ Failed to clear Redis cache:', err.message);
    }

    res.status(200).json({ message: 'PDF deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting PDF:', error);
    res.status(500).json({ error: 'Failed to delete PDF' });
  }
};