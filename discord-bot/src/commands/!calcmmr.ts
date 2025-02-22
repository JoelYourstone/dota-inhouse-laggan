// Function to read JSON files
import { Message } from "discord.js";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define TypeScript types for player data and aliases
interface Game {
  id: string;
  gameId: number;
  username: string;
  timestamp: string;
  win: boolean;
  _game: string;
  game: string;
  matchId: string;
}

interface Alias {
  id: string;
  aliases: string[];
}

export default async function calcmmr(message: Message) {
  const reply = await message.reply("Making maakep's wallet sad...");
  const resultResponse = await fetch(
    "https://europe-west1-laggkep.cloudfunctions.net/result/all"
  );
  const allData = (await resultResponse.json()) as Game[];

  const aliasResponse = await fetch(
    "https://europe-west1-laggkep.cloudfunctions.net/alias/all"
  );
  const aliasData = (await aliasResponse.json()) as Alias[];

  const playerEloRating = new Map<string, number>();

  // Find all the unique usernames
  const uniqueUsernames = new Set<string>();
  allData.forEach(({ username }) => {
    uniqueUsernames.add(username);
  });

  // populate all players with a rating of 1000
  uniqueUsernames.forEach((username) => {
    playerEloRating.set(username, 1000);
  });

  const usernNameToFirstAliasMap = new Map<string, string>();

  aliasData.forEach(({ id, aliases }) => {
    usernNameToFirstAliasMap.set(id, aliases[0]);
  });

  // Aggregate match data by alias
  const almostAllData = allData.filter((game) => game._game === "dota 3");

  const games = almostAllData.reduce((acc, match) => {
    if (!acc.has(match.matchId)) {
      acc.set(match.matchId, []);
    }
    acc.get(match.matchId)!.push(match);
    return acc;
  }, new Map<string, Game[]>());

  // Loop through all the games and update the elo rating of the players
  games.forEach((game) => {
    const winningPlayers = game
      .filter((game) => game.win)
      .map((game) => game.username);
    const losingPlayers = game
      .filter((game) => !game.win)
      .map((game) => game.username);

    const winningTeamAvgElo =
      winningPlayers.reduce(
        (acc, player) => acc + playerEloRating.get(player)!,
        0
      ) / winningPlayers.length;
    const losingTeamAvgElo =
      losingPlayers.reduce(
        (acc, player) => acc + playerEloRating.get(player)!,
        0
      ) / losingPlayers.length;

    const k = 50;

    winningPlayers.forEach((player) => {
      playerEloRating.set(
        player,
        playerEloRating.get(player)! +
          k *
            (1 -
              1 /
                (2 +
                  10 **
                    ((losingTeamAvgElo - playerEloRating.get(player)!) / 400)))
      );
    });

    losingPlayers.forEach((player) => {
      playerEloRating.set(
        player,
        playerEloRating.get(player)! +
          k *
            (0 -
              1 /
                (1 +
                  10 **
                    ((winningTeamAvgElo - playerEloRating.get(player)!) / 400)))
      );
    });

    [...winningPlayers, ...losingPlayers].forEach((player) => {
      console.log(player, playerEloRating.get(player));
    });
  });

  const x = JSON.stringify(
    Array.from(playerEloRating.entries()).map(([username, elo]) => ({
      username,
      elo,
    })),
    null,
    2
  );

  const filePath = path.join(__dirname, "..", "..", "..", "winrates.json");
  fs.writeFileSync(filePath, x);

  await reply.edit("Done! Check the winrates.json file in the root folder.");
}
