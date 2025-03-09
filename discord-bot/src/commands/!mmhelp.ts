import { Message } from "discord.js";

export default async function mmhelp(message: Message) {
  await message.reply({
    content: `
\`\`\`
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
\`\`\`
      `,
  });
}
