import { Message } from "discord.js";
import { playerToIdMap } from "../players.ts";

export default async function list(message: Message) {
  const players = Array.from(playerToIdMap.keys());
  await message.reply(players.join("\n"));
}
