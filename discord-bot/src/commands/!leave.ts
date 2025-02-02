import { Message } from "discord.js";
import { getVoiceConnection } from "@discordjs/voice";

export default async function leave(message: Message) {
  const connection = getVoiceConnection(message.guild!.id);
  if (connection) {
    connection.destroy();
    await message.reply("Left the voice channel.");
  } else {
    await message.reply("I am not in a voice channel!");
  }
}
