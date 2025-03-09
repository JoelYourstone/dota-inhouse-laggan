import {
  Client,
  GatewayIntentBits,
  type TextBasedChannel,
  type Message,
  TextChannel,
  ThreadChannel,
} from "discord.js";
import {
  play,
  leave,
  list,
  join,
  listen,
  here,
  mode,
  mix,
  mm,
  calcmmr,
  mymmr,
  toxicass,
  mmhelp,
  hacker,
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

let lastMessage: Message | undefined;

discordClient.on("messageCreate", async (message) => {
  if (guildIdPromise.state === "pending") {
    setGuildId(message.guild!.id);
  }
  if (message.author.bot) return;

  const command = message.content?.trim()?.split(" ")[0];

  let commandFound = true;
  switch (command) {
    case "!play":
      await play(message, botConfig, queryMode);
      break;
    case "!leave":
      await leave(message);
      break;
    case "!list":
      await list(message);
      break;
    case botConfig.joinCommand: // !join or !join2
      await join(message);
      break;
    case "!listen":
      await listen(message);
      break;
    case "!here":
      selectedInputChannel = await here(message, selectedInputChannel);
      break;
    case "!mode":
      queryMode = await mode(message, queryMode);
      break;
    case "!mm":
      await mm(message);
      break;
    case "!mix":
      await mix(message);
      break;
    case "!calcmmr":
      await calcmmr(message);
      break;
    case "!mymmr":
      await mymmr(message);
      break;
    case "!toxicass":
      await toxicass(message);
      break;
    case "!mmhelp":
      await mmhelp(message);
      break;
    case "!hacker":
      await hacker(message);
      break;
    default:
      commandFound = false;
      message.channel.id === selectedInputChannel?.id &&
        (await play(message, botConfig, queryMode, false));
  }

  if (commandFound) {
    lastMessage = message;
  }
});

console.log(123);
// const guildId = await guildIdPromise;
// console.log("guildId", guildId);
// startGameStateServer(botConfig, guildId);
// console.log("Game state server started");

// // Read stdin
process.stdin.on("data", (data) => {
  if (lastMessage) {
    console.log("lastMessage", lastMessage);
    const channel = lastMessage.channel;
    let respondWith = data
      .toString()
      .replace("!p", `<@${lastMessage.author.id}>`);

    const client = lastMessage.client;

    client.users.cache.get("395189309688512512")?.send("???");

    if (channel.isSendable() && respondWith.length > 0) {
      console.log("Sending message to channel", channel.id);
      channel.send(respondWith);
    } else {
      console.log("Channel is not a TextChannel", channel);
    }
  } else {
    console.log("No last message");
  }
});
