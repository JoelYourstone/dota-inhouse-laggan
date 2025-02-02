import { playLatestSound } from "./play.ts";
import { steamIdToDiscordId } from "./players.ts";
import { botConfigs, type BotConfig } from "./util.ts";
import express from "express";

const recentlyPlayedPlayers = new Map<string, string>();

export async function startGameStateServer(
  botConfig: BotConfig,
  guildId: string
) {
  const app = express();
  app.get("/", async (req, res) => {
    // Get user id from query param
    const userId = req.query.userId as string;
    if (!userId) {
      res.status(400).send("User ID is required");
      return;
    }

    if (botConfig.id === 1) {
      const otherBots = botConfigs.filter((c) => c.id !== botConfig.id);
      for (const otherBot of otherBots) {
        fetch(
          `http://localhost:${otherBot.gameStateServerPort}?userId=${userId}`
        ).catch((e) => {
          console.error("Failed to fetch from other bot", e);
        });
      }
    }

    if (steamIdToDiscordId.has(userId)) {
      const player = steamIdToDiscordId.get(userId);

      if (recentlyPlayedPlayers.has(userId)) {
        res.send("Already played.");
        return;
      }
      recentlyPlayedPlayers.set(userId, player!.discordId);

      // The event is sent from game state for 30s, just act on the first one
      setTimeout(() => {
        recentlyPlayedPlayers.delete(userId);
      }, 1000 * 31);

      await playLatestSound(guildId, player!.discordId);
    } else {
      console.log("User ID is not a valid steam ID", userId);
    }

    res.send("Hello World");
  });
  app.listen(botConfig.gameStateServerPort);
}
