import type { Message, TextBasedChannel } from "discord.js";

export default async function here(
  message: Message,
  selectedInputChannel: TextBasedChannel | undefined
) {
  const messageChannel = message.channel;

  // Check if it's the same channel, in that case, we toggle out of it
  if (messageChannel.id === selectedInputChannel?.id) {
    message.react("👋");
    return undefined;
  }

  if (messageChannel.isTextBased()) {
    message.react("👀");
    return message.channel;
  }
  message.reply(
    "Please use this command in a text channel, idk how you didn't..."
  );
  return undefined;
}
