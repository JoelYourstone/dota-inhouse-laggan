import { StreamType } from "@discordjs/voice";
import { createAudioResource } from "@discordjs/voice";
import { createReadStream } from "node:fs";
import { createAudioPlayer, getVoiceConnection } from "@discordjs/voice";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { Message } from "discord.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function playLatestSound(guildId: string, discordUserId: string) {
  const connection = getVoiceConnection(guildId);
  if (!connection) {
    throw new Error("I need to be in a voice channel first. Use !join");
  }

  // In the recordings folder, find the newest file for this user, should be within top 20 sorted by date
  const recordings = fs.readdirSync(
    path.join(__dirname, "recordings", discordUserId)
  );
  const newestRecording = recordings.sort((a, b) => {
    // If it's not a ogg file, ignore it
    if (!a.endsWith(".ogg")) {
      return 1;
    }

    return a > b ? -1 : 1;
  })[0];

  console.log("FOUND", newestRecording);

  // Create an audio player and play play.mp3
  const player = createAudioPlayer();
  connection.subscribe(player);

  const recordingPath = path.join(
    __dirname,
    "recordings",
    discordUserId,
    newestRecording
  );

  console.log("Recording path is ", recordingPath);

  // Adjust the path as necessary if the file location changes
  const resource = createAudioResource(createReadStream(recordingPath), {
    inputType: StreamType.OggOpus,
  });
  player.play(resource);
}

export function playFile(
  guildId: string,
  file: string,
  message: Message,
  joinCommand: string
) {
  const connection = getVoiceConnection(guildId);
  if (!connection) {
    message.reply(`I need to be in a voice channel first. Use ${joinCommand}`);
    return;
  }

  const player = createAudioPlayer();
  connection.subscribe(player);

  const resource = createAudioResource(createReadStream(file), {
    inputType: StreamType.OggOpus,
  });
  player.play(resource);
}
