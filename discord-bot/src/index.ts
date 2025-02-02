import { Client, GatewayIntentBits, type TextBasedChannel } from "discord.js";
import {
  play,
  leave,
  list,
  join,
  listen,
  here,
  mode,
} from "./commands/index.ts";
import {
  findAndJoinJorelVoiceChannel,
  getBotConfig,
  getGuildId,
} from "./util.ts";
import { startGameStateServer } from "./game-state-server.ts";

const botConfig = getBotConfig();
let [guildIdPromise, setGuildId] = getGuildId();

const discordClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});
discordClient.login(botConfig.discordToken);

discordClient.on("ready", (client) => {
  console.log("Logged in as", client.user?.username);
  findAndJoinJorelVoiceChannel(client);
});

let selectedInputChannel: TextBasedChannel | undefined;
let queryMode: "embed" | "keyword" = "keyword";

discordClient.on("messageCreate", async (message) => {
  if (guildIdPromise.state === "pending") {
    setGuildId(message.guild!.id);
  }
  if (message.author.bot) return;

  const command = message.content?.trim()?.split(" ")[0];

  switch (command) {
    case "!play":
      await play(message, botConfig, queryMode);
      return;
    case "!leave":
      await leave(message);
      return;
    case "!list":
      await list(message);
      return;
    case botConfig.joinCommand: // !join or !join2
      await join(message);
      return;
    case "!listen":
      await listen(message);
      return;
    case "!here":
      selectedInputChannel = await here(message, selectedInputChannel);
      return;
    case "!mode":
      queryMode = await mode(message, queryMode);
      return;
    default:
      message.channel.id === selectedInputChannel?.id &&
        (await play(message, botConfig, queryMode, false));
  }
});

const guildId = await guildIdPromise;
console.log("guildId", guildId);
startGameStateServer(botConfig, guildId);
console.log("Game state server started");
