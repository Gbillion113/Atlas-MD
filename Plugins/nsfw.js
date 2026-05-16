import got from "got";

const headers = {
  "User-Agent": "AtlasBot/1.0 (WhatsApp Group Bot)",
  "Accept": "application/json"
};

const nsfwTags = {
  hentai: "hentai",
  milf: "milf",
  ass: "ass",
  ecchi: "ecchi",
  ero: "ero",
  nsfwneko: "neko",
  nsfwwaifu: "waifu",
};

export default {
  name: "nsfw",
  alias: Object.keys(nsfwTags),
  uniquecommands: ["hentai", "milf", "ass", "ecchi", "ero", "nsfwneko", "nsfwwaifu"],
  description: "NSFW anime images",
  start: async (Atlas, m, { inputCMD, doReact }) => {
    if (!nsfwTags[inputCMD]) return;
    await doReact("🔞");
    try {
      const data = await got(
        `https://api.waifu.im/images?IncludedTags=${nsfwTags[inputCMD]}&IsNsfw=True`,
        { headers }
      ).json();
      const url = data.items[0].url;
      await Atlas.sendMessage(m.from, {
        image: { url },
        caption: `🔞 *${inputCMD.toUpperCase()}*`,
      }, { quoted: m });
    } catch (err) {
      m.reply(`❌ Failed: ${err.message}`);
    }
  },
};