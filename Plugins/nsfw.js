import got from "got";

const BASE = "https://fantox-apis.vercel.app";
const headers = { "User-Agent": "AtlasBot/1.0", "Accept": "application/json" };

const nsfwTags = {
  hentai: "sex",
  hentai2: "sex2",
  hentai3: "sex3",
  milf: "milf",
  ass: "ass",
  pussy: "pussy",
  spreadpussy: "spreadpussy",
  nude: "nude",
  nipples: "nipples",
  uncensored: "uncensored",
  topless: "topless",
  cum: "cum",
  yuri: "yuri",
  bondage: "bondage",
  fingering: "fingering",
  paizuri: "breasthold",
  nsfwneko: "neko",
  nsfwmaid: "maid",
  bunnygirl: "bunnygirl",
  stockings: "stockings",
};

export default {
  name: "nsfw",
  alias: Object.keys(nsfwTags),
  uniquecommands: ["hentai", "hentai2", "hentai3", "milf", "ass", "pussy", "nude", "nipples", "uncensored", "topless", "cum", "yuri", "bondage", "fingering", "paizuri"],
  description: "NSFW anime images",
  start: async (Atlas, m, { inputCMD, doReact }) => {
    if (!nsfwTags[inputCMD]) return;
    await doReact("🔞");
    try {
      const data = await got(`${BASE}/${nsfwTags[inputCMD]}`, { headers }).json();
      const url = data.url || data.image || data.link;
      if (!url) return m.reply("❌ No image found!");
      await Atlas.sendMessage(m.from, {
        image: { url },
        caption: `🔞 *${inputCMD.toUpperCase()}*`,
      }, { quoted: m });
    } catch (err) {
      m.reply(`❌ Failed: ${err.message}`);
    }
  },
};