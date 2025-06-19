import { Chat, LMStudioClient } from "@lmstudio/sdk";
import fs from "fs";

const client = new LMStudioClient();
const model = await client.llm.model("qwen2-vl-2b-instruct");

export async function analyzeImagesLocally(images) {
  const analysisResults = [];

  for (const image of images) {
    const imagePath = `./${image.imageUrl}`; // adjust if path differs
    const imageFile = await client.files.prepareImage(imagePath);

    const prediction = model.respond([
      {
        role: "system",
        content: "Respond shortly and precisely unless asked for detail.",
      },
      {
        role: "user",
        content: "Describe this image briefly.",
        images: [imageFile],
      },
    ]);

    let result = "";
    for await (const { content } of prediction) {
      result += content;
    }

    analysisResults.push({
      ...image,
      localModelDescription: result.trim(),
    });
  }

  return analysisResults;
}
