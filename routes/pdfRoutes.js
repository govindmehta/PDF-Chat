import express from 'express';
import multer from 'multer';
import { uploadPDF, getPdfDetails, getUserPDFs, deletePDF } from '../controllers/pdfController.js';

const router = express.Router();

// Multer config — store files temporarily in 'uploads/' folder
const upload = multer({ dest: 'uploads/' });

/**
 * POST /api/pdf/upload
 * Upload a PDF file, extract text, save to MongoDB linked to a user
 * Expects:
 * - A 'pdf' file in form-data
 * - A 'userId' field in body or query to associate PDF with user
 */
router.post('/upload', upload.single('pdf'), uploadPDF);
router.get("/getpdfs", getUserPDFs);
router.get('/pdfs/:pdfId/details', getPdfDetails);
router.delete('/pdfs/:pdfId', deletePDF);


export default router;
