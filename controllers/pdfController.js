import fs from 'fs/promises';
import path from 'path';
import PDF from '../models/PDF.js';
import Note from '../models/Note.js';
import Conversation from '../models/Conversation.js';
import { extractTextFromPDF } from '../utils/pdfUtils.js';
import { extractImagesFromPDF } from '../utils/imageExtractor.js';
import { analyzeImagesLocally } from '../model/imageAnalysis.js';

export const uploadPDF = async (req, res) => {
  try {
    const { userId } = req.body;
    const file = req.file;

    if (!userId || !file) {
      return res.status(400).json({ error: 'userId and PDF file are required' });
    }

    if (file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'Uploaded file must be a PDF' });
    }

    const filePath = file.path;
    const stats = await fs.stat(filePath);

    console.log(filePath);
    const extractedText = await extractTextFromPDF(filePath);
    const imagesWithOCR = await extractImagesFromPDF(filePath); // includes ocrText
    console.log('🖼️ Extracted images with OCR:', imagesWithOCR.length);

    const imagesWithAnalysis = await analyzeImagesLocally(imagesWithOCR);

    console.log('📄 PDF uploaded:', file.originalname);
    const newPDF = new PDF({
      user: userId,
      filename: file.filename,
      originalName: file.originalname,
      fileSize: stats.size,
      fileType: file.mimetype,
      extractedText,
      images: imagesWithAnalysis,
      imageCount: imagesWithAnalysis.length,
    });

    await newPDF.save();

    res.status(201).json({ message: 'PDF uploaded and processed with OCR + image analysis', pdf: newPDF });
  } catch (error) {
    console.error('❌ Error uploading PDF:', error);
    res.status(500).json({ error: 'Failed to process PDF' });
  }
};



// Get all PDFs for a user
export const getUserPDFs = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const pdfs = await PDF.find({ user: userId }).sort({ createdAt: -1 });
    res.status(200).json(pdfs);
  } catch (error) {
    console.error('❌ Error fetching PDFs:', error);
    res.status(500).json({ error: 'Failed to fetch PDFs' });
  }
};

// Get detailed info for a specific PDF
export const getPdfDetails = async (req, res) => {
  try {
    const userId = req.body.userId;
    const pdfId = req.params.pdfId;

    if (!userId || !pdfId) {
      return res.status(400).json({ error: 'userId and pdfId are required' });
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

// Delete a PDF and related files
export const deletePDF = async (req, res) => {
  try {
    const { pdfId } = req.params;

    const pdf = await PDF.findById(pdfId);
    if (!pdf) return res.status(404).json({ error: 'PDF not found' });

    const mainPath = path.join('uploads', pdf.filename);
    await fs.unlink(mainPath).catch(() => {});

    for (const img of pdf.images) {
      const imagePath = path.join('public', img.imageUrl);
      await fs.unlink(imagePath).catch(() => {});
    }

    await PDF.findByIdAndDelete(pdfId);

    res.status(200).json({ message: 'PDF deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting PDF:', error);
    res.status(500).json({ error: 'Failed to delete PDF' });
  }
};
