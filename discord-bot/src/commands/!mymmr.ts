import { Message } from "discord.js";
import fs from "fs";

type WinRate = {
  username: string;
  elo: number;
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

  message.reply(`Your MMR is ${playerElo.toFixed(0)}`);
}
