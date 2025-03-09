import { Message } from "discord.js";
import fs from "fs";

type WinRate = {
  username: string;
  elo: number;
};

type DiscordId = string;

type Ohbehave = {
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

export default async function mymmr(message: Message) {
  const userId = message.author.id;
  const winRates = JSON.parse(
    fs.readFileSync("../winrates.json", "utf-8")
  ) as WinRate[];

  const playerElo = winRates.find((rate) => rate.username === userId)?.elo;

  if (!playerElo) {
    message.reply("Player not found");
    return;
  }

  const ohbehave = JSON.parse(
    fs.readFileSync("../ohbehave.json", "utf-8")
  ) as Ohbehave;

  const toxicCount = ohbehave[userId]?.length || 0;

  message.reply(`Your MMR is ${(playerElo - toxicCount).toFixed(0)}`);
}
