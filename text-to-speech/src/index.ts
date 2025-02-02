import { exec, spawn } from "child_process";
import fs from "fs/promises";
import OpenAI from "openai";
import { toFile } from "openai";
import path from "path";
import postgres from "postgres";
import pLimit from "p-limit";
import * as aiOpenAi from "@ai-sdk/openai";
import { embedMany } from "ai";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

console.log("Connecting to database");
const sql = postgres({
  host: "localhost",
  port: 5433,
  user: "postgres",
  password: "mysecretpassword",
  database: "dota-tts",
});

console.log("Connected to database");

await sql`
  CREATE TABLE IF NOT EXISTS "transcriptions" (
    "user_discord_id" TEXT,
    "file" TEXT,
    "message" TEXT,
    "path_on_disk" TEXT,
    "debug_info" JSONB
  )
`;

const openai = new OpenAI({
  apiKey: process.env.OPEN_API_KEY,
});

const recordingsFolder = path.join("..", "discord-bot", "src", "recordings");

const limit = pLimit(40);

async function processFolder(folder: string) {
  console.log(`Processing folder: ${folder}`);
  const files = await fs.readdir(path.join(recordingsFolder, folder));
  const tasks = files.map((file) =>
    limit(async () => {
      try {
        if (!file.endsWith(".ogg")) {
          console.log(`Skipping ${file} because it is not an ogg file`);
          return;
        }

        const result =
          await sql`SELECT * FROM "transcriptions" WHERE "file" = ${file} AND "user_discord_id" = ${folder}`;
        if (result.length > 0) {
          // console.log(
          //   `Skipping ${file} because it has already been transcribed`
          // );
          return;
        }

        const fileSize = (
          await fs.stat(path.join(recordingsFolder, folder, file))
        ).size;
        if (fileSize < 2048) {
          console.log(`Skipping ${file} because it is less than 2kb`);
          await sql`INSERT INTO "transcriptions" ("user_discord_id", "file", "message", "path_on_disk") VALUES (${folder}, ${file}, ${null}, ${path.join(
            process.cwd(),
            recordingsFolder,
            folder,
            file
          )})`;
          return;
        }

        console.log(`Converting ${file} to mp3`);
        const mp3Stream = convertOggToMp3Stream(
          path.join(recordingsFolder, folder, file)
        );
        const aiFile = await toFile(mp3Stream, "audio.mp3", {
          type: "audio/mpeg",
        });

        console.log(`Requesting transcription for ${file}`);
        const transcription = await openai.audio.transcriptions.create({
          file: aiFile,
          model: "whisper-1",
          language: "en",
          response_format: "verbose_json",
        });

        console.log(
          `Transcription for ${file}: ${transcription.text}, ${JSON.stringify(
            transcription
          )}`
        );

        const avgLogProb = transcription.segments?.reduce(
          (acc, segment) => acc + segment.avg_logprob,
          0
        );
        const avgNoSpeechProb = transcription.segments?.reduce(
          (acc, segment) => acc + segment.no_speech_prob,
          0
        );

        console.log("\n\n\n");
        console.log(transcription.text);
        console.log(`Avg log prob: ${avgLogProb}`);
        console.log(`Avg no speech prob: ${avgNoSpeechProb}`);
        console.log("\n\n\n");

        await sql`INSERT INTO "transcriptions" ("user_discord_id", "file", "message", "path_on_disk", "debug_info") VALUES (${folder}, ${file}, ${
          transcription.text
        }, ${path.join(
          process.cwd(),
          recordingsFolder,
          folder,
          file
        )}, ${JSON.stringify(transcription)})`;

        console.log("all seems well");
      } catch (error) {
        console.error(
          `Error processing file ${file} in folder ${folder}. Path on disk: ${path.join(
            process.cwd(),
            recordingsFolder,
            folder,
            file
          )}`,
          error
        );
      }
    })
  );

  await Promise.allSettled(tasks);
}

async function main() {
  try {
    console.log("Reading recordings folder");
    const allItems = await fs.readdir(recordingsFolder);
    const folders = allItems.filter((item) => !item.includes("."));

    for (const folder of folders) {
      await processFolder(folder);
    }

    console.log("all done!!");
  } catch (error) {
    console.error("Error in main function:", error);
  }
}

if (process.argv.length === 2) {
  main().catch(console.error);
}

function convertOggToMp3Stream(oggPath: string): NodeJS.ReadableStream {
  const ffmpegProcess = spawn("ffmpeg", [
    "-i",
    oggPath,
    "-codec:a",
    "libmp3lame",
    "-qscale:a",
    "5",
    "-f",
    "mp3",
    "pipe:1",
  ]);

  ffmpegProcess.stderr.on("data", (data) => {
    console.error(`FFmpeg stderr: ${data}`);
  });

  return ffmpegProcess.stdout;
}

const vercelOpenAi = aiOpenAi.createOpenAI({
  apiKey: process.env.OPEN_API_KEY,
});
const embeddingModel = vercelOpenAi.embedding("text-embedding-3-small");

const normalizeText = (text: string) =>
  text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
    .trim();

async function generateEmbeddings(
  chunks: { message: string; id: number }[]
): Promise<Array<{ embedding: number[]; content: string; id: number }>> {
  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: chunks.map((chunk) => chunk.message),
  });
  return embeddings.map((e, i) => ({
    content: chunks[i].message,
    embedding: e,
    id: chunks[i].id,
  }));
}

// If run with "embed" argument:
if (process.argv.includes("embed")) {
  const totalEmbeddings =
    await sql`SELECT COUNT(*) as count FROM "transcriptions" WHERE "embedding_generated" = FALSE AND "message" IS NOT NULL AND "message" != ''`;

  console.log("Starting process of " + totalEmbeddings[0].count + " files");

  const start = Date.now();

  let proccessed = 0;
  while (proccessed < totalEmbeddings[0].count) {
    const startBatch = Date.now();
    const rows =
      await sql`SELECT * FROM "transcriptions" WHERE "embedding_generated" = FALSE AND "message" IS NOT NULL AND "message" != '' LIMIT 500`;
    const embeddings = await generateEmbeddings(
      rows.map((row) => ({
        message: normalizeText(row.message),
        id: row.id,
      }))
    );

    for (const embedding of embeddings) {
      const vectorLiteral = `[${embedding.embedding.join(",")}]`;
      await sql`
        INSERT INTO "transcription_embeddings" ("transcription_id", "embedding")
        VALUES (${embedding.id}, ${vectorLiteral}::vector);
      `;
      await sql`UPDATE "transcriptions" SET "embedding_generated" = TRUE WHERE "id" = ${embedding.id}`;
    }

    proccessed += 500;

    console.log(
      `Processed ${proccessed} of ${
        totalEmbeddings[0].count
      } embeddings, batch took ${formatDuration(
        Date.now() - startBatch
      )}, total time: ${formatDuration(Date.now() - start)}`
    );
  }

  console.log("All embeddings generated");
}

function formatDuration(ms: number) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

if (process.argv.includes("query")) {
  const query = normalizeText(process.argv[3]);
  const [queryEmbeddingObj] = await generateEmbeddings([
    { message: query, id: 1 },
  ]);

  console.log("Searching for query: ", query);

  const queryEmbedding = queryEmbeddingObj.embedding;

  const vectorLiteral = `[${queryEmbedding.join(",")}]`;
  const results = await sql`
    SELECT t.file, t.message, t.path_on_disk,
           e.embedding <=> ${vectorLiteral}::vector AS distance
    FROM transcriptions t
    JOIN transcription_embeddings e ON t.id = e.transcription_id
    WHERE t.user_discord_id = '101367380017442816'
    ORDER BY e.embedding <=> ${vectorLiteral}::vector
    LIMIT 10;
  `;

  console.log(results);

  process.exit(0);
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce((sum, aVal, idx) => sum + aVal * vecB[idx], 0);
  const normA = Math.sqrt(vecA.reduce((sum, aVal) => sum + aVal * aVal, 0));
  const normB = Math.sqrt(vecB.reduce((sum, bVal) => sum + bVal * bVal, 0));
  return dotProduct / (normA * normB);
}

function l2Distance(vecA: number[], vecB: number[]): number {
  return Math.sqrt(
    vecA.reduce((sum, aVal, idx) => sum + Math.pow(aVal - vecB[idx], 2), 0)
  );
}
async function compareEmbeddings() {
  // Prepare the two messages
  const messages = [
    { message: "thanks", id: 1 },
    { message: "thank you.", id: 2 },
  ];

  // Generate embeddings for both messages
  const embeddings = await generateEmbeddings(
    messages.map((m) => ({ message: m.message, id: m.id }))
  );

  // Assuming the order is preserved, extract the vectors:
  const thanksEmbedding = embeddings[0].embedding;
  const thankYouEmbedding = embeddings[1].embedding;

  // Calculate distances
  const cosine = cosineSimilarity(thanksEmbedding, thankYouEmbedding);
  const l2 = l2Distance(thanksEmbedding, thankYouEmbedding);

  // Log the distances
  console.log(`Cosine similarity between "thanks" and "thank you.": ${cosine}`);
  console.log(`L2 distance between "thanks" and "thank you.": ${l2}`);
}

if (process.argv.includes("compare")) {
  compareEmbeddings().catch(console.error);
}
