import got from "got";

const BASE = "https://fantox-apis.vercel.app";
const headers = { "User-Agent": "AtlasBot/1.0", "Accept": "application/json" };

const sfwTags = {
  waifu: "waifu",
  maid: "maid",
  uniform: "schooluniform",
  oppai: "breasts",
  selfies: "idol",
  neko: "neko",
  swimsuit: "swimsuit",
  bikini: "bikini",
  foxgirl: "foxgirl",
  catgirl: "catgirl",
  bunnygirl: "bunnygirl",
  wolfgirl: "wolfgirl",
};

export default {
  name: "sfw",
  alias: Object.keys(sfwTags),
  uniquecommands: ["waifu", "maid", "uniform", "neko", "swimsuit", "bikini", "foxgirl", "catgirl", "bunnygirl", "wolfgirl"],
  description: "SFW anime images",
  start: async (Atlas, m, { inputCMD, doReact }) => {
    if (!sfwTags[inputCMD]) return;
    await doReact("🌸");
    try {
      const data = await got(`${BASE}/${sfwTags[inputCMD]}`, { headers }).json();
      const url = data.url || data.image || data.link;
      if (!url) return m.reply("❌ No image found!");
      await Atlas.sendMessage(m.from, {
        image: { url },
        caption: `🌸 *${inputCMD.toUpperCase()}*`,
      }, { quoted: m });
    } catch (err) {
      m.reply(`❌ Failed: ${err.message}`);
    }
  },
};