import mongoose from "mongoose";

const pdfSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    fileSize: { type: Number }, // ✅ File size in bytes
    fileType: { type: String }, // ✅ MIME type, e.g., 'application/pdf'
    extractedText: { type: String },
    images: [
      {
        page: Number,
        imageUrl: String,
        ocrText: { type: String, default: "" }, // Text from Tesseract/PyTesseract
        localModelDescription: { type: String, default: "" }, // Text from LM Studio (e.g., Qwen2-VL)
      },
    ],
    imageCount: { type: Number, default: 0 }, // ✅ Optional, for quick lookup
  },
  { timestamps: true }
);

export default mongoose.model("PDF", pdfSchema);
