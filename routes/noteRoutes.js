import express from 'express';
import { generateNotes, downloadNotesPDF } from '../controllers/noteController.js';

const router = express.Router();

router.post('/generate', generateNotes); // POST /api/notes/generate
router.get('/download', downloadNotesPDF); 

export default router;
