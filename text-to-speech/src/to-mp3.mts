// C:\Projects\dota-spectator\discord-bot\src\recordings\207840759087497217\1738454363252.ogg

import { spawn } from "child_process";
import * as process from "process";

async function convertOggToWav(
  inputPath: string,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    // The '-y' flag automatically overwrites output files if they exist.
    // '-acodec pcm_s16le' specifies uncompressed PCM (16-bit little-endian)
    // '-ar 44100' sets the sample rate to 44100 Hz.
    const ffmpegProcess = spawn("ffmpeg", [
      "-y",
      "-i",
      inputPath,
      "-codec:a",
      "libmp3lame",
      "-qscale:a",
      "5", // You may adjust this value for different quality/speed trade-offs.
      outputPath,
    ]);

    // Log FFmpeg's stdout (mostly optional output)
    ffmpegProcess.stdout.on("data", (data) => {
      console.log(`stdout: ${data}`);
    });

    // FFmpeg outputs progress and errors on stderr
    ffmpegProcess.stderr.on("data", (data) => {
      console.error(`stderr: ${data}`);
    });

    // Resolve or reject the Promise based on FFmpeg's exit code.
    ffmpegProcess.on("close", (code) => {
      if (code === 0) {
        console.log("Conversion finished successfully.");
        resolve();
      } else {
        reject(new Error(`ffmpeg exited with code ${code}`));
      }
    });
  });
}

convertOggToWav(
  "C:\\Projects\\dota-spectator\\discord-bot\\src\\recordings\\207840759087497217\\1738454363252.ogg",
  "C:\\Projects\\dota-spectator\\discord-bot\\src\\recordings\\1738454363252.mp3"
)
  .then(() => {
    console.log("Conversion finished successfully.");
  })
  .catch((error) => {
    console.error("Conversion failed:", error);
  });
