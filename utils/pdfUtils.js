import pdfParse from 'pdf-parse/lib/pdf-parse.js'; 

/**
 * Extracts text content from a PDF buffer.
 * @param {Buffer} fileBuffer - The PDF file buffer.
 * @returns {Promise<string>} - Extracted text content.
 */
export const extractTextFromPDF = async (fileBuffer) => {
  try {
    const parsed = await pdfParse(fileBuffer);
    return parsed.text;
  } catch (error) {
    console.error('❌ Error extracting text from PDF:', error);
    throw error;
  }
};
