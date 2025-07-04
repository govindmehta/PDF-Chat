// // controllers/noteController.js
// import PDFDocument from 'pdfkit';
// import Note from '../models/Note.js';
// import PDF from "../models/PDF.js";
// import path from 'path';
// import fs from 'fs';
// import geminiService from "../services/geminiService.js";


// export const generateNotes = async (req, res) => {
//   try {
//     const { userId, pdfId } = req.body;

//     if (!userId || !pdfId) {
//       return res.status(400).json({ error: "userId and pdfId are required." });
//     }

//     const pdf = await PDF.findOne({ _id: pdfId, user: userId });

//     if (!pdf) {
//       return res.status(404).json({ error: "PDF not found for this user." });
//     }

//     const imageDescriptions = (pdf.images || [])
//       .map((img, i) => {
//         const desc = img.localModelDescription?.trim();
//         return desc ? `Image ${i + 1} (Page ${img.page}): ${desc}` : null;
//       })
//       .filter(Boolean)
//       .join("\n") || "No image descriptions.";

//     const prompt = `
// You are a helpful assistant. Based on the PDF content and image descriptions below, generate high-quality, concise study notes. Use bullet points and structure them clearly.

// PDF Text:
// ${pdf.extractedText || "No text content."}

// Image Descriptions:
// ${imageDescriptions}
// `;

//     const generatedContent = await geminiService.getCompletion(prompt);

//     const title = `AI Notes for ${pdf.originalName || 'PDF'}`;


//     const newNote = new Note({
//       user: userId,
//       pdf: pdfId,
//       title,
//       content: generatedContent,
//     });

//     await newNote.save();

//     res.status(201).json({
//       message: "Notes generated successfully.",
//       note: newNote,
//     });
//   } catch (error) {
//     console.error("❌ Error generating notes:", error);
//     res.status(500).json({ error: "Failed to generate notes." });
//   }
// };


// export const downloadNotesPDF = async (req, res) => {
//   try {
//     const { userId, pdfId } = req.body;

//     const notes = await Note.find({ user: userId, pdf: pdfId }).sort({ createdAt: -1 });

//     if (!notes || notes.length === 0) {
//       return res.status(404).json({ error: 'No notes found for this PDF.' });
//     }

//     // Create a PDF doc
//     const doc = new PDFDocument();
//     const pdf = await PDF.findById(pdfId);
//     const filename = `AI_Notes_${pdf.originalName?.replace(/\.pdf$/i, '') || 'PDF'}.pdf`;
//     const filePath = path.join('downloads', filename);

//     // Ensure downloads folder exists
//     if (!fs.existsSync('downloads')) fs.mkdirSync('downloads');

//     const writeStream = fs.createWriteStream(filePath);
//     doc.pipe(writeStream);

//     doc.font('Times-Roman').fontSize(20).text('Notes Summary', { align: 'center' });
//     doc.moveDown();

//     for (const note of notes) {
//       doc
//         .fontSize(14)
//         .text(`${note.title || 'Untitled Note'}`, { underline: true })
//         .moveDown(0.5);
//       doc.fontSize(12).text(note.content);
//       doc.moveDown(1.5);
//     }

//     doc.end();

//     writeStream.on('finish', () => {
//       res.download(filePath, filename, () => {
//         // Optional: delete the file after download
//         fs.unlink(filePath, () => {});
//       });
//     });
//   } catch (error) {
//     console.error('❌ Error generating notes PDF:', error);
//     res.status(500).json({ error: 'Failed to generate notes PDF.' });
//   }
// };




export const generateNotes = async (req, res) => {
  try {
    const userId = req.user._id; // ✅ Use authenticated user
    const { pdfId } = req.body;

    if (!pdfId) {
      return res.status(400).json({ error: "pdfId is required." });
    }

    const pdf = await PDF.findOne({ _id: pdfId, user: userId });

    if (!pdf) {
      return res.status(404).json({ error: "PDF not found for this user." });
    }

    const imageDescriptions = (pdf.images || [])
      .map((img, i) => {
        const desc = img.localModelDescription?.trim();
        return desc ? `Image ${i + 1} (Page ${img.page}): ${desc}` : null;
      })
      .filter(Boolean)
      .join("\n") || "No image descriptions.";

    const prompt = `
You are a helpful assistant. Based on the PDF content and image descriptions below, generate high-quality, concise study notes. Use bullet points and structure them clearly.

PDF Text:
${pdf.extractedText || "No text content."}

Image Descriptions:
${imageDescriptions}
`;

    const generatedContent = await geminiService.getCompletion(prompt);

    const title = `AI Notes for ${pdf.originalName || 'PDF'}`;

    const newNote = new Note({
      user: userId,
      pdf: pdfId,
      title,
      content: generatedContent,
    });

    await newNote.save();

    res.status(201).json({
      message: "Notes generated successfully.",
      note: newNote,
    });
  } catch (error) {
    console.error("❌ Error generating notes:", error);
    res.status(500).json({ error: "Failed to generate notes." });
  }
};


export const downloadNotesPDF = async (req, res) => {
  try {
    const userId = req.user._id; // ✅ Use authenticated user
    const { pdfId } = req.body;

    if (!pdfId) {
      return res.status(400).json({ error: "pdfId is required." });
    }

    const notes = await Note.find({ user: userId, pdf: pdfId }).sort({ createdAt: -1 });

    if (!notes || notes.length === 0) {
      return res.status(404).json({ error: 'No notes found for this PDF.' });
    }

    const pdf = await PDF.findById(pdfId);
    const filename = `AI_Notes_${pdf.originalName?.replace(/\.pdf$/i, '') || 'PDF'}.pdf`;
    const filePath = path.join('downloads', filename);

    // Ensure downloads folder exists
    if (!fs.existsSync('downloads')) fs.mkdirSync('downloads');

    const doc = new PDFDocument();
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    doc.font('Times-Roman').fontSize(20).text('Notes Summary', { align: 'center' });
    doc.moveDown();

    for (const note of notes) {
      doc
        .fontSize(14)
        .text(`${note.title || 'Untitled Note'}`, { underline: true })
        .moveDown(0.5);
      doc.fontSize(12).text(note.content);
      doc.moveDown(1.5);
    }

    doc.end();

    writeStream.on('finish', () => {
      res.download(filePath, filename, () => {
        fs.unlink(filePath, () => {}); // Optional: cleanup after download
      });
    });
  } catch (error) {
    console.error('❌ Error generating notes PDF:', error);
    res.status(500).json({ error: 'Failed to generate notes PDF.' });
  }
};