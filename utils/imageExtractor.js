import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function extractImagesFromPDF(pdfPath) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, 'extractImage.py');

    exec(`python "${scriptPath}" "${pdfPath}"`, { maxBuffer: 1024 * 1024 * 10 }, (err, stdout, stderr) => {
      if (err) {
        console.error('❌ Python execution error:', stderr || err.message);
        return reject(new Error('Python script failed.'));
      }

      try {
        const imagesWithOCR = JSON.parse(stdout); // Expecting array of { page, imageUrl, ocrText }
        if (!Array.isArray(imagesWithOCR)) throw new Error("Output is not an array");
        resolve(imagesWithOCR);
      } catch (parseError) {
        console.error('❌ JSON parse error from Python output:', parseError.message);
        console.error('Raw output:', stdout);
        reject(new Error('Failed to parse image data from Python script.'));
      }
    });
  });
}
