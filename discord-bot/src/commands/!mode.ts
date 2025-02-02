import { Message } from "discord.js";

export default async function mode(
  message: Message,
  currentMode: "embed" | "keyword"
): Promise<"embed" | "keyword"> {
  // !mode embed or !mode keyword
  const mode = message.content.split(" ")[1];

  if (!mode) {
    return currentMode;
  }

  if (mode === "embed") {
    await message.react("🤖");
    return "embed";
  } else if (mode === "keyword") {
    await message.react("🔍");
    return "keyword";
  } else {
    await message.reply("Mode: unknown, defaulting to embed");
    return currentMode;
  }
}
