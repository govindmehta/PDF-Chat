import { Chat, LMStudioClient } from "@lmstudio/sdk";
import { createInterface } from "readline/promises";
import fs from "fs";
import path from "path";

// Define image paths
const imagePaths = [
  "../uploads/images/man7.jpg",
];

const rl = createInterface({ input: process.stdin, output: process.stdout });
const client = new LMStudioClient();
const model = await client.llm.model("qwen2-vl-2b-instruct");

async function loadImages(paths) {
  const images = [];
  for (const imgPath of paths) {
    if (fs.existsSync(imgPath)) {
      const image = await client.files.prepareImage(imgPath);
      images.push(image);
    } else {
      console.warn(`⚠️ Image not found: ${imgPath}`);
    }
  }
  return images;
}

const images = await loadImages(imagePaths);

while (true) {
  const question = await rl.question("You: ");
  if (question.trim().toLowerCase() === "exit") break;

  const prediction = model.respond([
    {
      role: "system",
      content: "Only answer shortly and precisely until asked for details.",
    },
    {
      role: "user",
      content: question,
      images,
    },
  ]);

  process.stdout.write("Bot: ");
  for await (const { content } of prediction) {
    process.stdout.write(content);
  }
  process.stdout.write("\n");
}

rl.close();
