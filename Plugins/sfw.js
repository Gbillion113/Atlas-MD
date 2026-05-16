import got from "got";

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
};

const headers = {
  "User-Agent": "AtlasBot/1.0 (WhatsApp Bot)",
};

export default {
  name: "sfw",
  alias: Object.keys(sfwCategories),
  uniquecommands: ["waifu", "neko", "shinobu", "megumin", "awoo", "dance", "happy"],
  description: "SFW anime images",
  start: async (Atlas, m, { inputCMD, doReact }) => {
    const category = sfwCategories[inputCMD];
    if (!category) return;
    await doReact("🌸");
    try {
      const data = await got(`https://nekos.best/api/v2/${category}`, { headers }).json();
      const url = data.results[0].url;
      await Atlas.sendMessage(m.from, {
        image: { url },
        caption: `🌸 *${inputCMD.toUpperCase()}*`,
      }, { quoted: m });
    } catch (err) {
      m.reply(`❌ Failed: ${err.message}`);
    }
  },
};