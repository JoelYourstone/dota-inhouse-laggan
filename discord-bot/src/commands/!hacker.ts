import { Message } from "discord.js";

// Mesage will be evaluated as a javascript expression, remove dangerous things
const dangerousKeywords = [
  "import",
  "require",
  "process",
  "eval",
  "exec",
  "execSync",
  "execFile",
  "execFileSync",
  "spawn",
  "spawnSync",
  "fork",
  "forkSync",
  "execSync",
  "execFileSync",
  "spawnSync",
  "forkSync",
  "global",
  "globalThis",
  "this",
  "self",
  "fetch",
];

export default async function hacker(message: Message) {
  const content = message.content.replace("!hacker", "");
  // message.react("🚪");
  // return;

  const log = console.log;

  if (dangerousKeywords.some((keyword) => content.includes(keyword))) {
    message.react("🚫");
    return;
  }

  console.log("Evaluating", content);

  try {
    let reply = "";
    console.log = (...args: any[]) => {
      reply += args.join(" ") + "\n";
    };
    const result = await eval(content);
    reply += result ?? "";

    const replyString = reply.toString();

    if (replyString.length === 0) {
      message.reply("No output");
    } else {
      console.log("Replying with", replyString);
      message.reply(replyString.substring(0, 1900));
    }
  } catch (error) {
    log("Error", error);
    message.reply("You are not a worthy hacker");
  } finally {
    console.log = log;
  }
}
