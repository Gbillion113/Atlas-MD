import got from "got";

const headers = { "User-Agent": "AtlasBot/1.0 (WhatsApp Bot)" };

const nsfwCategories = {
  hentai: "hentai",
  milf: "milf",
  oral: "oral",
  paizuri: "paizuri",
  ecchi: "ecchi",
  ero: "ero",
  ass: "ass",
  blowjob: "blowjob",
  nsfwneko: "neko",
  pgif: "pgif",
};

export default {
  name: "nsfw",
  alias: Object.keys(nsfwCategories),
  uniquecommands: ["hentai", "milf", "oral", "paizuri", "ecchi", "ero", "ass", "blowjob"],
  description: "NSFW anime images",
  start: async (Atlas, m, { inputCMD, doReact }) => {
    await doReact("🔞");
    const category = nsfwCategories[inputCMD];
    if (!category) return;
    try {
      const data = await got(`https://api.waifu.pics/nsfw/${category}`, { headers }).json();
      const url = data.url;
      const isGif = url.endsWith(".gif");
      if (isGif) {
        await Atlas.sendMessage(m.from, {
          video: { url },
          gifPlayback: true,
          caption: `🔞 *${inputCMD.toUpperCase()}*`,
        }, { quoted: m });
      } else {
        await Atlas.sendMessage(m.from, {
          image: { url },
          caption: `🔞 *${inputCMD.toUpperCase()}*`,
        }, { quoted: m });
      }
    } catch {
      try {
        const data2 = await got(`https://nekos.best/api/v2/${category}`, { headers }).json();
        const url2 = data2.results[0].url;
        await Atlas.sendMessage(m.from, {
          image: { url: url2 },
          caption: `🔞 *${inputCMD.toUpperCase()}*`,
        }, { quoted: m });
      } catch (err2) {
        m.reply(`❌ Failed to fetch. Try again!`);
      }
    }
  },
};