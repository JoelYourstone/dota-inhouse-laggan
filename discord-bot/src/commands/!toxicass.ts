import { Message } from "discord.js";
import fs from "fs";

type DiscordId = string;

export type Ohbehave = {
  [key: DiscordId]: {
    awardedBy: DiscordId;
    reason: string;
    timestamp: number;
  }[];
};

type Alias = {
  id: string;
  aliases: string[];
};

export default async function toxicass(message: Message) {
  // Syntax: !toxicass <player> <reason>
  const content = message.content.trim();
  const playerString = content.split(" ")[1];
  const reason = content.split(" ").slice(2).join(" ");

  if (!playerString || !reason) {
    message.reply("Syntax: !toxicass <player> <reason>");
    return;
  }

  const aliasResponse = await fetch(
    "https://europe-west1-laggkep.cloudfunctions.net/alias/all"
  );
  const aliasData = (await aliasResponse.json()) as Alias[];

  const playerAliases = aliasData.find((alias) =>
    alias.aliases.includes(playerString)
  );

  if (!playerAliases) {
    message.reply("Player not found, maybe an alias is missing?");
    return;
  }

  const reportedPlayerId = playerAliases.id;
  const reporterId = message.author.id;

  const ohbehave = JSON.parse(
    fs.readFileSync("../ohbehave.json", "utf-8")
  ) as Ohbehave;

  if (!ohbehave[reportedPlayerId]) {
    ohbehave[reportedPlayerId] = [];
  }

  ohbehave[reportedPlayerId].push({
    awardedBy: reporterId,
    reason: reason,
    timestamp: Date.now(),
  });

  fs.writeFileSync("../ohbehave.json", JSON.stringify(ohbehave, null, 2));

  message.reply(
    `Player ${playerAliases.aliases[0]} has been reported for "${reason}". 1 mmr point has been removed from their account.`
  );
}
