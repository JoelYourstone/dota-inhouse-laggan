import { Message } from "discord.js";
import { playerToIdMap } from "../players.ts";
import { queryAi, queryKeyword } from "../query.ts";
import { playFile, playLatestSound } from "../play.ts";
import type { BotConfig } from "../util.ts";

export default async function play(
  message: Message,
  config: BotConfig,
  queryMode: "embed" | "keyword",
  requireCommand = true
) {
  // People will write !play <player>, resolve the ID
  const content = message.content.trim();
  const playerString = content.split(" ")[requireCommand ? 1 : 0];
  let queryHasNoPlayerString = false;
  let discordUserId = playerToIdMap.has(playerString)
    ? playerToIdMap.get(playerString)?.id
    : null;
  if (!discordUserId && requireCommand) {
    await message.reply("Player not found, use !list to see all players");
    return;
  } else if (!requireCommand && !discordUserId) {
    // Randomly pick a player
    queryHasNoPlayerString = true;
    discordUserId = Array.from(playerToIdMap.values())[
      Math.floor(Math.random() * playerToIdMap.size)
    ]?.id;
  }

  if (!requireCommand || content.split(" ").length > 2) {
    let query = content;
    if (!queryHasNoPlayerString && requireCommand) {
      query = query.split(" ").slice(2).join(" ");
    } else if (!queryHasNoPlayerString && !requireCommand) {
      query = query.split(" ").slice(1).join(" ");
    }

    const playerName = Array.from(playerToIdMap.values()).find(
      (entry) => entry.id === discordUserId
    )?.name;

    let any = false;
    if (query.endsWith("!")) {
      any = true;
      query = query.substring(0, query.length - 1);
    }

    console.log("Querying AI with", query, playerName);
    let result;
    if (queryMode === "embed") {
      result = await queryAi(query, discordUserId!);
    } else if (queryMode === "keyword") {
      result = await queryKeyword(query, discordUserId!, any);
    }

    if (!result) {
      message.react("😔");
      return;
    }

    console.log("Ok, now playing file", result.path_on_disk);

    // Fire-hugo-wall
    if (result.path_on_disk.includes("1738454363252")) {
      message.react("🖕");
      return;
    }

    playFile(
      message.guild!.id,
      result.path_on_disk,
      message,
      config.joinCommand
    );
    message.react("✅");
    return;
  }

  try {
    await playLatestSound(message.guild!.id, discordUserId!);
    await message.reply("Now playing audio.");
  } catch (e) {
    await message.reply("Error playing audio: " + (e as Error).message);
  }
}
