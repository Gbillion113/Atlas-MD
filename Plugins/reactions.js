import got from "got";
import { GIFBufferToVideoBuffer } from "../System/Function2.js";

const headers = { "User-Agent": "AtlasBot/1.0 (WhatsApp Group Bot)" };

let mergedCommands = [
  "bite", "blush", "bonk", "bully", "cringe", "cry", "cuddle",
  "dance", "glomp", "handhold", "happy", "highfive", "hug",
  "kick", "kill", "kiss", "lick", "nom", "pat", "poke",
  "slap", "smile", "smug", "wave", "wink", "yeet",
];

const suitableWords = {
  bite: "bited",
  blush: "is blushing at",
  bonk: "bonked",
  bully: "is bullying",
  cringe: "cringed at",
  cry: "cried in front of",
  cuddle: "is cuddling",
  dance: "is dancing with",
  glomp: "glomped at",
  handhold: "holding hands of",
  happy: "is happy with",
  highfive: "high-fived at",
  hug: "is hugging",
  kick: "kicked",
  kill: "killed",
  kiss: "is kissing",
  lick: "is licking",
  nom: "is eating with",
  pat: "is patting",
  poke: "is poking",
  slap: "slapped",
  smile: "is smiling at",
  smug: "smugged at",
  wave: "waved at",
  wink: "winked at",
  yeet: "yeeted at",
};

export default {
  name: "reactions",
  alias: [...mergedCommands],
  uniquecommands: [...mergedCommands],
  description: "All reaction Commands",
  start: async (Atlas, m, { text, prefix, mentionByTag, doReact }) => {
    await doReact("🎭");

    const command = m.body
      .split(" ")[0]
      .toLowerCase()
      .slice(prefix.length)
      .trim();

    const reaction = command;
    if (!suitableWords[reaction]) return;

    const users = mentionByTag ? [...mentionByTag] : [];
    if (m.quoted && !users.includes(m.quoted.sender)) users.push(m.quoted.sender);
    while (users.length < 1) users.push(m.sender);
    const reactant = users[0];
    const single = reactant === m.sender;

    try {
      const data = await got(
        `https://nekos.best/api/v2/${reaction}`,
        { headers }
      ).json();
      const url = data.results[0].url;
      const isGif = url.endsWith(".gif");

      if (isGif) {
        const result = await got(url, { headers, responseType: "buffer" }).buffer();
        const buffer = await GIFBufferToVideoBuffer(result);
        await Atlas.sendMessage(
          m.from,
          {
            video: buffer,
            gifPlayback: true,
            caption: `*@${m.sender.split("@")[0]} ${suitableWords[reaction]} ${
              single ? "Themselves" : `@${reactant.split("@")[0]}`
            }*`,
            mentions: [m.sender, reactant],
          },
          { quoted: m }
        );
      } else {
        await Atlas.sendMessage(
          m.from,
          {
            image: { url },
            caption: `*@${m.sender.split("@")[0]} ${suitableWords[reaction]} ${
              single ? "Themselves" : `@${reactant.split("@")[0]}`
            }*`,
            mentions: [m.sender, reactant],
          },
          { quoted: m }
        );
      }
    } catch (err) {
      m.reply(`❌ Failed to fetch reaction: ${err.message}`);
    }
  },
};