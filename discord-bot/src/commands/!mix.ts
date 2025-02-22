import { joinVoiceChannel, EndBehaviorType } from "@discordjs/voice";
import prism from "prism-media";
import { Mixer, Input } from "audio-mixer";
import Speaker from "speaker";
import { Message } from "discord.js";
import { Transform } from "stream";

// Track active inputs for each user
const activeInputs = new Map<string, Input>();

let mixing = false;
export default async function mix(message: Message) {
  if (mixing) {
    message.reply("Already mixing.");
    return;
  }
  mixing = true;
  const voiceChannel = message.member?.voice.channel;
  if (!voiceChannel) {
    message.reply("You are not in a voice channel.");
    return;
  }

  const connection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId: voiceChannel.guild.id,
    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    selfDeaf: true,
  });

  const streams = voiceChannel.members.map((u) =>
    connection.receiver.createStream(u.id, { mode: "pcm", end: "manual" })
  );

  // 1) Join the voice channel

  // 2) Create a mixer
  const mixer = new Mixer({
    channels: 2,
    bitDepth: 16,
    sampleRate: 48000,
  });

  // 3) Pipe the mixer output to a speaker (or a virtual cable)
  const speaker = new Speaker({
    channels: 2,
    bitDepth: 16,
    sampleRate: 48000,
  });
  mixer.pipe(speaker);

  // 4) Subscribe to user audio and pipe to the mixer
  connection.receiver.speaking.on("start", (userId) => {
    // Subscribe to user's Opus stream
    const audioStream = connection.receiver.subscribe(userId, {
      end: {
        behavior: EndBehaviorType.AfterSilence,
        duration: 1000,
      },
    });

    // Decode to PCM
    const opusDecoder = new prism.opus.Decoder({
      rate: 48000,
      channels: 2,
      frameSize: 960,
    });

    opusDecoder.on("error", (error) => {
      console.error("Opus decoder error:", error);
      // Optionally, you could choose to destroy/cleanup the stream here.
    });

    const pcmStream = audioStream.pipe(opusDecoder);

    // Create an input and pipe the user's PCM into it
    const input = new Input({
      channels: 2,
      bitDepth: 16,
      sampleRate: 48000,
      volume: 1,
    });
    activeInputs.set(userId, input);
    pcmStream.pipe(rebuffer(3840)).pipe(input);

    // Add the input to the mixer
    mixer.addInput(input);
    audioStream.on("end", () => {
      mixer.removeInput(input);
      activeInputs.delete(userId);
    });

    // Also handle the speaking 'end' event to clean up inputs if not already done
  });
  connection.receiver.speaking.on("end", (userId) => {
    const input = activeInputs.get(userId);
    if (input) {
      mixer.removeInput(input);
      activeInputs.delete(userId);
    }
  });

  // Cleanup all active inputs if the connection disconnects
  connection.on("stateChange", (oldState, newState) => {
    if (newState.status === "disconnected") {
      activeInputs.forEach((input) => mixer.removeInput(input));
      activeInputs.clear();
    }
  });
}

function rebuffer(frameBytes: number) {
  let remainder = Buffer.alloc(0);
  return new Transform({
    transform(chunk, encoding, callback) {
      const buffer = Buffer.concat([remainder, chunk]);
      const completeLength =
        Math.floor(buffer.length / frameBytes) * frameBytes;
      if (completeLength > 0) {
        this.push(buffer.slice(0, completeLength));
        remainder = buffer.slice(completeLength);
      } else {
        remainder = buffer;
      }
      callback();
    },
    flush(callback) {
      callback();
    },
  });
}
