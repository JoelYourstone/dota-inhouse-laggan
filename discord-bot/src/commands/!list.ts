import { Message } from "discord.js";

type Alias = {
  id: string;
  aliases: string[];
};

export default async function list(message: Message) {
  const aliasResponse = await fetch(
    "https://europe-west1-laggkep.cloudfunctions.net/alias/all"
  );
  const aliasData = (await aliasResponse.json()) as Alias[];
  const players = aliasData.map((alias) => alias.aliases[0] ?? alias.id);

  await message.reply(`**All players' first alias:** \n ${players.join("\n")}`);
}
