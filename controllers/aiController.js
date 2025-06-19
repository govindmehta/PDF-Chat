import mongoose from 'mongoose';
import PDF from '../models/PDF.js';
import geminiService from '../services/geminiService.js';
import Conversation from '../models/Conversation.js';

export const askQuestion = async (req, res) => {
  try {
    const { userId, pdfId, question } = req.body;

    if (!userId || !pdfId || !question) {
      return res.status(400).json({ error: 'userId, pdfId, and question are required.' });
    }

    if (!mongoose.Types.ObjectId.isValid(pdfId)) {
      return res.status(400).json({ error: 'Invalid PDF ID format.' });
    }

    const pdf = await PDF.findOne({ _id: pdfId, user: userId });

    if (!pdf) {
      return res.status(404).json({ error: 'PDF not found for the given user.' });
    }

    // Prepare OCR text from images
    const imageTextSummary = (pdf.images || [])
      .map((img, i) => {
        const ocr = img.ocrText?.trim();
        return ocr ? `Image ${i + 1} (page ${img.page}): ${ocr}` : null;
      })
      .filter(Boolean)
      .join('\n') || 'No OCR data available.';

    // Construct prompt
    const prompt = `
You are a helpful AI assistant. Answer the question based on the PDF text and OCR-extracted image descriptions.

PDF Text Content:
${pdf.extractedText || 'No text extracted from the PDF.'}

Image Descriptions from OCR:
${imageTextSummary}

User Question:
${question}
`;

    const answer = await geminiService.getCompletion(prompt);

    const conversation = new Conversation({ user: userId, pdf: pdfId, question, answer });
    await conversation.save();

    res.status(200).json({ answer });
  } catch (error) {
    console.error('❌ Error in askQuestion:', error);
    res.status(500).json({ error: 'Failed to generate AI response' });
  }
};
