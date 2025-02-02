import { GuildMember, Message, type VoiceBasedChannel } from "discord.js";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import {
  joinVoiceChannel,
  EndBehaviorType,
  VoiceConnection,
} from "@discordjs/voice";
import prism from "prism-media";
import { pipeline } from "node:stream/promises";
import { areWeListening } from "./!listen.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const userIdsRecording: string[] = [];

// Persistent file descriptiors for each player
const playerFileDescriptors = new Map<string, fs.WriteStream>();
let recordingDir = path.join(__dirname, "..", "recordings");
if (!fs.existsSync(recordingDir)) {
  fs.mkdirSync(recordingDir);
}

export default async function join(message: Message) {
  const member = message.member as GuildMember;
  if (!member.voice.channel) {
    await message.reply("You must be in a voice channel to use this command!");
    return;
  }
  const voiceChannel = member.voice.channel;

  joinVC(voiceChannel);

  await message.reply("Joined the voice channel.");
}

let connection: VoiceConnection;
let channelId: string;

export function getConnection() {
  return { connection, channelId };
}

export function joinVC(voiceChannel: VoiceBasedChannel) {
  // Join the voice channel
  channelId = voiceChannel.id;
  connection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId: voiceChannel.guild.id,
    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    selfDeaf: true,
    selfMute: false,
  });
  console.log("Joined voice channel " + voiceChannel.name);

  // Listen for users starting to speak
  connection.receiver.speaking.on("start", async (userId: string) => {
    if (!areWeListening()) {
      return;
    }

    console.log(`User ${userId} started speaking.`);

    if (userIdsRecording.includes(userId)) {
      return;
    }
    userIdsRecording.push(userId);

    const playerRecordingDir = path.join(recordingDir, userId);
    if (!playerFileDescriptors.has(userId)) {
      if (!fs.existsSync(playerRecordingDir)) {
        fs.mkdirSync(playerRecordingDir, { recursive: true });
      }

      const logPath = path.join(playerRecordingDir, "log.txt");
      const fileDescriptor = fs.createWriteStream(logPath, { flags: "a" });
      playerFileDescriptors.set(userId, fileDescriptor);
    }

    // Generate a filename based on user id and current timestamp
    const actualFileName = `${Date.now()}.ogg`;
    const filename = path.join(playerRecordingDir, actualFileName);

    // Subscribe to the user's audio stream.
    // End recording after silence lasting 1 second.
    const audioStream = connection.receiver.subscribe(userId, {
      end: { behavior: EndBehaviorType.AfterSilence, duration: 500 },
    });

    const oggStream = new prism.opus.OggLogicalBitstream({
      opusHead: new prism.opus.OpusHead({
        channelCount: 2,
        sampleRate: 48_000,
      }),
      pageSizeControl: {
        maxPackets: 10,
      },
    });

    userIdsRecording.splice(userIdsRecording.indexOf(userId), 1);
    const fileStream = fs.createWriteStream(filename);

    await pipeline(audioStream, oggStream, fileStream);
    playerFileDescriptors.get(userId)!.write(`${actualFileName}\n`);

    console.log(`Finished recording for ${userId}. Saved to ${filename}`);
  });
}
