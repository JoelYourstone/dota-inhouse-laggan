import { Message } from "discord.js";
import { getConnection } from "./!join.ts";

let isListening = false;
export function areWeListening() {
  return isListening;
}
export default async function listen(message: Message) {
  message.reply(
    `The year is ${new Date().getFullYear()}. Spynet has taken over the world. GDPR is dead. We are listening to your voice.`
  );
  isListening = true;

  const { connection, channelId } = getConnection();
  connection.rejoin({
    channelId,
    selfDeaf: false,
    selfMute: false,
  });
}
