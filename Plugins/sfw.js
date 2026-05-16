import got from "got";

const headers = { 
  "User-Agent": "AtlasBot/1.0 (WhatsApp Group Bot)",
  "Accept": "application/json"
};

// waifu.im SFW tags
const waifuImTags = {
  waifu: "waifu",
  maid: "maid",
  uniform: "uniform",
  oppai: "oppai",
  selfies: "selfies",
  marin: "marin-kitagawa",
  raiden: "raiden-shogun",
  ayaka: "kamisato-ayaka",
};

// nekos.best SFW categories (GIFs and images)
const nekosBestTags = {
  neko: "neko",
  shinobu: "shinobu",
  megumin: "megumin",
  awoo: "awoo",
  kiss: "kiss",
  pat: "pat",
  smug: "smug",
  bonk: "bonk",
  blush: "blush",
  smile: "smile",
  wave: "wave",
  nom: "nom",
  dance: "dance",
  happy: "happy",
  hug: "hug",
  poke: "poke",
  slap: "slap",
  cry: "cry",
  bully: "bully",
  cuddle: "cuddle",
  kick: "kick",
  handhold: "handhold",
  bite: "bite",
  glomp: "glomp",
  yeet: "yeet",
  wink: "wink",
  highfive: "highfive",
  kill: "kill",
};

const reactionMessages = {
  hug: "gives a warm hug! 🤗",
  pat: "gives a gentle pat! 👋",
  kiss: "blows a kiss! 💋",
  slap: "throws a slap! 👋",
  cry: "is crying... 😢",
  cuddle: "wants to cuddle! 🥰",
  bonk: "bonks someone! 🔨",
  blush: "is blushing! 😳",
  smile: "smiles! 😊",
  wave: "waves hello! 👋",
  dance: "is dancing! 💃",
  happy: "is happy! 😄",
  bite: "bites! 😤",
  glomp: "glomps someone! 🤩",
  yeet: "yeets! 🚀",
  wink: "winks! 😉",
  highfive: "gives a high five! 🙏",
  poke: "pokes someone! 👉",
  nom: "noms! 😋",
  smug: "looks smug! 😏",
  awoo: "awoos! 🐺",
  kick: "kicks! 🦵",
  bully: "bullies someone! 😈",
  handhold: "wants to hold hands! 🤝",
  kill: "goes for the kill! ⚔️",
};

const allCommands = { ...waifuImTags, ...nekosBestTags };

export default {
  name: "sfw",
  alias: Object.keys(allCommands),
  uniquecommands: [
    "waifu", "maid", "neko", "shinobu", "megumin", "awoo",
    "dance", "happy", "hug", "pat", "kiss", "slap", "cry",
    "cuddle", "bonk", "blush", "smile", "wave", "bite",
    "glomp", "yeet", "wink", "highfive", "poke", "raiden",
    "ayaka", "marin", "uniform", "oppai", "selfies",
  ],
  description: "SFW anime images and reactions",
  start: async (Atlas, m, { inputCMD, doReact, pushName }) => {
    await doReact("🌸");
    const caption = reactionMessages[inputCMD]
      ? `🌸 *${pushName}* ${reactionMessages[inputCMD]}`
      : `🌸 *${inputCMD.toUpperCase()}*`;

    // Try waifu.im first for image categories
    if (waifuImTags[inputCMD]) {
      try {
        const data = await got(
          `https://api.waifu.im/search?included_tags=${waifuImTags[inputCMD]}&is_nsfw=false`,
          { headers }
        ).json();
        const url = data.images[0].url;
        await Atlas.sendMessage(m.from, { image: { url }, caption }, { quoted: m });
        return;
      } catch {}
    }

    // Try nekos.best for reactions/GIFs
    if (nekosBestTags[inputCMD]) {
      try {
        const data = await got(
          `https://nekos.best/api/v2/${nekosBestTags[inputCMD]}`,
          { headers }
        ).json();
        const url = data.results[0].url;
        const isGif = url.endsWith(".gif");
        if (isGif) {
          await Atlas.sendMessage(m.from, { video: { url }, gifPlayback: true, caption }, { quoted: m });
        } else {
          await Atlas.sendMessage(m.from, { image: { url }, caption }, { quoted: m });
        }
        return;
      } catch {}
    }

    m.reply(`❌ Failed to fetch. Try again!`);
  },
};