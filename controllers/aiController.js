// import mongoose from "mongoose";
// import PDF from "../models/PDF.js";
// import geminiService from "../services/geminiService.js";
// import Conversation from "../models/Conversation.js";
// import redis from "../utils/redisClient.js";

// export const askQuestion = async (req, res) => {
//   try {
//     const { userId, pdfId, question } = req.body;

//     if (!userId || !pdfId || !question) {
//       return res
//         .status(400)
//         .json({ error: "userId, pdfId, and question are required." });
//     }

//     if (!mongoose.Types.ObjectId.isValid(pdfId)) {
//       return res.status(400).json({ error: "Invalid PDF ID format." });
//     }

//     const cacheKey = `answer:${pdfId}:${question}`;
//     const cachedAnswer = await redis.get(cacheKey);
//     if (cachedAnswer) {
//       console.log("✅ Answer from Redis cache");
//       return res.status(200).json({ answer: cachedAnswer });
//     }

//     const pdf = await PDF.findOne({ _id: pdfId, user: userId });

//     if (!pdf) {
//       return res
//         .status(404)
//         .json({ error: "PDF not found for the given user." });
//     }

//     const imageSummary =
//       (pdf.images || [])
//         .map((img, i) => {
//           const desc = img.localModelDescription?.trim();
//           return desc ? `Image ${i + 1} (page ${img.page}): ${desc}` : null;
//         })
//         .filter(Boolean)
//         .join("\n") || "No image descriptions available.";

//     // Construct prompt
//     const prompt = `
// You are a helpful AI assistant. Answer the question based on the PDF text and image descriptions.
// Answer should be based on users demands according to it.

// PDF Text Content:
// ${pdf.extractedText || "No text extracted from the PDF."}

// PDF Description From Local Model:
// ${imageSummary}

// User Question:
// ${question}
// `;

//     const answer = await geminiService.getCompletion(prompt);

//     const conversation = new Conversation({
//       user: userId,
//       pdf: pdfId,
//       question,
//       answer,
//     });
//     await conversation.save();
//     await redis.set(cacheKey, answer, 'EX', 60 * 60); // 1 hour cache


//     res.status(200).json({ answer });
//   } catch (error) {
//     console.error("❌ Error in askQuestion:", error);
//     res.status(500).json({ error: "Failed to generate AI response" });
//   }
// };


import mongoose from "mongoose";
import PDF from "../models/PDF.js";
import geminiService from "../services/geminiService.js";
import Conversation from "../models/Conversation.js";
import redis from "../utils/redisClient.js";

export const askQuestion = async (req, res) => {
  try {
    const userId = req.user._id; // ✅ Extract from decoded JWT
    const { pdfId, question } = req.body;

    if (!pdfId || !question) {
      return res.status(400).json({ error: "pdfId and question are required." });
    }

    if (!mongoose.Types.ObjectId.isValid(pdfId)) {
      return res.status(400).json({ error: "Invalid PDF ID format." });
    }

    const cacheKey = `answer:${pdfId}:${question}`;
    const cachedAnswer = await redis.get(cacheKey);
    if (cachedAnswer) {
      console.log("✅ Answer from Redis cache");
      return res.status(200).json({ answer: cachedAnswer });
    }

    const pdf = await PDF.findOne({ _id: pdfId, user: userId });

    if (!pdf) {
      return res.status(404).json({ error: "PDF not found for the given user." });
    }

    const imageSummary =
      (pdf.images || [])
        .map((img, i) => {
          const desc = img.localModelDescription?.trim();
          return desc ? `Image ${i + 1} (page ${img.page}): ${desc}` : null;
        })
        .filter(Boolean)
        .join("\n") || "No image descriptions available.";

    const prompt = `
You are a helpful AI assistant. Answer the question based on the PDF text and image descriptions.
Answer should be based on users demands according to it.

PDF Text Content:
${pdf.extractedText || "No text extracted from the PDF."}

PDF Description From Local Model:
${imageSummary}

User Question:
${question}
`;

    const answer = await geminiService.getCompletion(prompt);

    const conversation = new Conversation({
      user: userId,
      pdf: pdfId,
      question,
      answer,
    });
    await conversation.save();

    await redis.set(cacheKey, answer, 'EX', 60 * 60); // 1 hour cache

    res.status(200).json({ answer });
  } catch (error) {
    console.error("❌ Error in askQuestion:", error);
    res.status(500).json({ error: "Failed to generate AI response" });
  }
};
