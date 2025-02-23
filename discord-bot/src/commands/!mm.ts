import { Message } from "discord.js";
import fs from "fs";

type WinRate = {
  username: string;
  elo: number;
};

type Alias = {
  id: string;
  aliases: string[];
};

// const aliasData: Alias[] = JSON.parse(
//   fs.readFileSync("../allias.json", "utf-8")
// ) as Alias[];

export default async function mm(message: Message) {
  const aliasResponse = await fetch(
    "https://europe-west1-laggkep.cloudfunctions.net/alias/all"
  );
  const aliasData = (await aliasResponse.json()) as Alias[];

  const playerAliases = message.content.split(" ").slice(1);
  console.log(playerAliases);
  const [team1, team2, team1AvgElo, team2AvgElo] = matchmake(
    playerAliases,
    message,
    aliasData
  );
  // console.log([team1], [team2]);
  if (team1.length === 0 && team2.length === 0) {
    return;
  }

  // Team 1 and 2 should be either radiant or dire, randomize it
  const team1Radiant = Math.random() < 0.5;

  message.reply(
    `Radiant : ${team1Radiant ? team1.join(", ") : team2.join(", ")} \nDire: ${
      team1Radiant ? team2.join(", ") : team1.join(", ")
    }`
  );
}

function matchmake(
  playerAliases: string[],
  message: Message,
  aliasData: Alias[]
): [string[], string[], number, number] {
  const winRates = JSON.parse(
    fs.readFileSync("../winrates.json", "utf-8")
  ) as WinRate[];
  // Assume players array contains 10 player aliases

  const players: { alias: string; playerId: string; elo: number }[] = [];
  for (const alias of playerAliases) {
    const playerId = aliasData.find((a) => a.aliases.includes(alias))?.id;
    if (!playerId) {
      message.reply("Player not found: " + alias);
      return [[], [], 0, 0];
      // throw new Error("Player not found: " + alias);
    }
    const winRatePlayerObject = winRates.find(
      (wr) => wr.username === playerId
    )!;
    players.push({ alias, playerId, elo: winRatePlayerObject.elo });
  }

  // Example usage:
  const all5Stacks = getCombinationsOf5(players);

  if (!all5Stacks) {
    message.reply("Not enough players to matchmake");
    return [[], [], 0, 0];
  }

  const all5StacksWithElo = all5Stacks.map((stack) => {
    const elo = stack.reduce((acc, player) => acc + player.elo, 0);
    return { stack, elo };
  });

  // Find the two stacks with the lowest elo difference
  const sortedStacks = all5StacksWithElo.sort((a, b) => a.elo - b.elo);
  // const team1 = sortedStacks[0].stack;
  // const team2 = sortedStacks[1].stack;

  // const team1AvgElo = team1.reduce((acc, player) => acc + player.elo, 0) / 5;
  // const team2AvgElo = team2.reduce((acc, player) => acc + player.elo, 0) / 5;

  // return [
  //   team1.map((player) => player.alias),
  //   team2.map((player) => player.alias),
  //   team1AvgElo,
  //   team2AvgElo,
  // ];

  // return stupidMatchMake(players);

  return normalMatchMake(players);
}

function normalMatchMake(
  players: Player[]
): [string[], string[], number, number] {
  // Sort players by win rate
  const sortedPlayers = players.sort((a, b) => b.elo - a.elo);

  // Distribute players into two teams
  const team1: string[] = [];
  const team2: string[] = [];
  sortedPlayers.forEach((player, index) => {
    if (index % 2 === 0) {
      team1.push(player.alias);
    } else {
      team2.push(player.alias);
    }
  });

  const team1AvgElo =
    team1.reduce(
      (acc, player) => acc + players.find((p) => p.alias === player)!.elo,
      0
    ) / team1.length;
  const team2AvgElo =
    team2.reduce(
      (acc, player) => acc + players.find((p) => p.alias === player)!.elo,
      0
    ) / team2.length;

  return [team1, team2, team1AvgElo, team2AvgElo];
}

type Player = { alias: string; playerId: string; elo: number };

function stupidMatchMake(
  players: Player[]
): [string[], string[], number, number] {
  // const allCombinations = generateAllPlayerCombinations(players);
  // console.log(allCombinations);
  return [[], [], 0, 0];
}

/**
 * Returns an array of all combinations (order does NOT matter) of length 5
 * chosen from the input array of 10 unique numbers.
 *
 * @param arr - An array of exactly 10 unique numbers.
 * @returns An array of combinations, where each combination is an array of 5 numbers.
 *          The total number of combinations is C(10,5) = 252.
 */
function getCombinationsOf5(arr: Player[]): Player[][] | null {
  if (arr.length !== 10) {
    return null;
  }

  const results: Player[][] = [];
  const currentCombination: Player[] = [];

  /**
   * Backtracks over the array, picking elements to form a combination of length 5.
   *
   * @param startIndex - The index in `arr` to start picking from.
   * @param leftToPick - How many more elements we need to pick to complete a combination.
   */
  function backtrack(startIndex: number, leftToPick: number): void {
    // If we've picked 5 elements, we have a complete combination
    if (leftToPick === 0) {
      results.push([...currentCombination]);
      return;
    }

    // If there are not enough elements remaining to complete a combination, stop early
    // => But in the loop condition we handle that by `i <= arr.length - leftToPick`

    // Try picking each remaining element in turn
    for (let i = startIndex; i <= arr.length - leftToPick; i++) {
      currentCombination.push(arr[i]);

      // Move on to the next element with one fewer to pick
      backtrack(i + 1, leftToPick - 1);

      // Remove the last picked element before trying the next
      currentCombination.pop();
    }
  }

  // Start backtracking with all 10 elements available (from index 0)
  // and 5 elements left to pick
  backtrack(0, 5);

  return results;
}
