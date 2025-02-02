import postgres from "postgres";
import * as aiOpenAi from "@ai-sdk/openai";
import { embedMany } from "ai";

console.log("Connecting to database");
const sql = postgres({
  host: "localhost",
  port: 5433,
  user: "postgres",
  password: "mysecretpassword",
  database: "dota-tts",
});

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

export async function queryAi(rawQuery: string, userId: string) {
  const query = normalizeText(rawQuery);
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
    WHERE t.user_discord_id = ${userId}
    ORDER BY e.embedding <=> ${vectorLiteral}::vector
    LIMIT 10;
  `;

  console.log(results);

  return results[0];
}

export async function queryKeyword(
  rawQuery: string,
  userId: string,
  any: boolean = false
) {
  let results = [];
  if (!any) {
    results = await sql`
      SELECT
        t.file,
      t.message,
      t.path_on_disk,
      ts_rank_cd(
        to_tsvector('english', t.message),
        plainto_tsquery('english', ${rawQuery})
      ) AS rank
    FROM transcriptions t
    WHERE t.user_discord_id = ${userId}
      AND to_tsvector('english', t.message) @@ plainto_tsquery('english', ${rawQuery})
    ORDER BY rank DESC
      LIMIT 10;
    `;
  } else {
    console.log("Querying any keyword: ", rawQuery);
    results = await sql`
      SELECT
        t.file,
      t.message,
      t.path_on_disk,
      ts_rank_cd(
        to_tsvector('english', t.message),
        plainto_tsquery('english', ${rawQuery})
      ) AS rank
    FROM transcriptions t
    WHERE to_tsvector('english', t.message) @@ plainto_tsquery('english', ${rawQuery})
    ORDER BY rank DESC
      LIMIT 10;
    `;
  }

  console.log(results);
  return results[0];
}
