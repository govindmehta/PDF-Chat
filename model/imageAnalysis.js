import { Chat, LMStudioClient } from "@lmstudio/sdk";

const client = new LMStudioClient();
const model = await client.llm.model("qwen2-vl-2b-instruct");

export async function analyzeImagesLocally(images) {
  const results = await Promise.all(images.map(async (image) => {
    const imagePath = `./${image.imageUrl}`;
    const imageFile = await client.files.prepareImage(imagePath);

    const prediction = model.respond([
      {
        role: "system",
        content: "You are an expert visual analyst. Always provide rich, thorough, and structured descriptions of images when asked.",
      },
      {
        role: "user",
        content: `Describe the image in great detail. 
Include layout, visible elements (like text, charts, tables, diagrams), positions, styles, colors, and any inferred purpose or meaning.
If text is present, summarize its content. Be exhaustive.`,
        images: [imageFile],
      },
    ]);

    let result = "";
    for await (const { content } of prediction) {
      result += content;
    }

    return {
      ...image,
      localModelDescription: result.trim(),
    };
  }));

  return results;
}
