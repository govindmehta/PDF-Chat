import express from 'express';
import { askQuestion } from '../controllers/aiController.js';

const router = express.Router();

/**
 * POST /api/ai/ask
 * Body: { userId, pdfId, text, question }
 * Purpose: Sends user question + PDF text to Gemini API, saves conversation, returns answer
 */
router.post('/ask', askQuestion);

export default router;
