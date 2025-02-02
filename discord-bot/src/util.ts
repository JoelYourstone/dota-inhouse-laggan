import { Client, type VoiceBasedChannel } from "discord.js";
import dotenv from "dotenv";
import { playerToIdMap } from "./players.ts";
import { joinVC } from "./commands/index.ts";

dotenv.config({ path: ".env.local" });

export function getBotConfig() {
  switch (process.argv[2]) {
    case "bot1":
      return botConfigs[0];
    case "bot2":
      return botConfigs[1];
    default:
      throw new Error("Invalid or missing bot number: " + process.argv[2]);
  }
}

export const botConfigs = [
  {
    id: 1,
    joinCommand: "!join",
    discordToken: process.env.DISCORD_TOKEN_1,
    gameStateServerPort: 3024,
  },
  {
    id: 2,
    joinCommand: "!join2",
    discordToken: process.env.DISCORD_TOKEN_2,
    gameStateServerPort: 3025,
  },
] as const;

export type BotConfig = (typeof botConfigs)[number];

export type Deferred<T> = Promise<T> & {
  state: "pending" | "resolved" | "rejected";
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: any) => void;
};

export function createDeferred<T>(): Deferred<T> {
  let resolveFn: (value: T | PromiseLike<T>) => void;
  let rejectFn: (reason?: any) => void;

  const promise = new Promise<T>((resolve, reject) => {
    resolveFn = resolve;
    rejectFn = reject;
  }) as Deferred<T>;

  // Initialize the state
  promise.state = "pending";

  // Wrap resolve to update state and call original resolve
  promise.resolve = (value: T | PromiseLike<T>) => {
    if (promise.state !== "pending") return;
    promise.state = "resolved";
    resolveFn(value);
  };

  // Wrap reject to update state and call original reject
  promise.reject = (reason?: any) => {
    if (promise.state !== "pending") return;
    promise.state = "rejected";
    rejectFn(reason);
  };

  return promise;
}

/**
 * Modified getGuildId using the deferred pattern.
 *
 * Returns a tuple with:
 *  - The deferred guild id promise (which you can inspect with `state`)
 *  - A setter function to resolve the promise with the guild id.
 */
export function getGuildId(): [Deferred<string>, (guildId: string) => void] {
  const deferred = createDeferred<string>();

  const setGuildId = (guildId: string) => {
    deferred.resolve(guildId);
  };

  return [deferred, setGuildId];
}

export function findAndJoinJorelVoiceChannel(client: Client) {
  const voiceChannel = client.channels.cache.find(
    (channel) =>
      channel.isVoiceBased() &&
      channel.members.some((s) => s.user.id === playerToIdMap.get("jorel")?.id)
  ) as VoiceBasedChannel | undefined;

  if (voiceChannel) {
    joinVC(voiceChannel);
  }
}
