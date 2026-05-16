import got from "got";

const headers = { "User-Agent": "AtlasBot/1.0 (WhatsApp Bot)" };

const sfwCategories = {
  waifu: "waifu",
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
};

export default {
  name: "sfw",
  alias: Object.keys(sfwCategories),
  uniquecommands: [
    "waifu", "neko", "shinobu", "megumin", "awoo",
    "dance", "happy", "hug", "pat", "kiss", "slap",
    "cry", "cuddle", "bonk", "blush", "smile", "wave",
    "bite", "glomp", "yeet", "wink", "highfive", "poke",
  ],
  description: "SFW anime images and reactions",
  start: async (Atlas, m, { inputCMD, doReact, pushName, text }) => {
    const category = sfwCategories[inputCMD];
    if (!category) return;
    await doReact("🌸");

    const reactionMessages = {
      hug: `🤗 *${pushName}* gives a warm hug!`,
      pat: `👋 *${pushName}* gives a gentle pat!`,
      kiss: `💋 *${pushName}* blows a kiss!`,
      slap: `👋 *${pushName}* throws a slap!`,
      cry: `😢 *${pushName}* is crying...`,
      cuddle: `🥰 *${pushName}* wants to cuddle!`,
      bonk: `🔨 *${pushName}* bonks someone!`,
      blush: `😳 *${pushName}* is blushing!`,
      smile: `😊 *${pushName}* smiles!`,
      wave: `👋 *${pushName}* waves hello!`,
      dance: `💃 *${pushName}* is dancing!`,
      happy: `😄 *${pushName}* is happy!`,
      bite: `😤 *${pushName}* bites!`,
      glomp: `🤩 *${pushName}* glomps someone!`,
      yeet: `🚀 *${pushName}* yeets!`,
      wink: `😉 *${pushName}* winks!`,
      highfive: `🙏 *${pushName}* gives a high five!`,
      poke: `👉 *${pushName}* pokes someone!`,
      nom: `😋 *${pushName}* noms!`,
      smug: `😏 *${pushName}* looks smug!`,
      awoo: `🐺 *${pushName}* awoos!`,
      kick: `🦵 *${pushName}* kicks!`,
      bully: `😈 *${pushName}* bullies someone!`,
      handhold: `🤝 *${pushName}* wants to hold hands!`,
    };

    const caption = reactionMessages[inputCMD] || `🌸 *${inputCMD.toUpperCase()}*`;

    try {
      const data = await got(`https://nekos.best/api/v2/${category}`, { headers }).json();
      const url = data.results[0].url;
      const isGif = url.endsWith(".gif");
      if (isGif) {
        await Atlas.sendMessage(m.from, {
          video: { url },
          gifPlayback: true,
          caption,
        }, { quoted: m });
      } else {
        await Atlas.sendMessage(m.from, {
          image: { url },
          caption,
        }, { quoted: m });
      }
    } catch (err) {
      m.reply(`❌ Failed to fetch. Try again!`);
    }
  },
};