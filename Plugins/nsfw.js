import got from "got";

const headers = {
  "User-Agent": "AtlasBot/1.0 (WhatsApp Group Bot)",
  "Accept": "application/json"
};

// waifu.im NSFW tags
const nsfwTags = {
  hentai: "hentai",
  milf: "milf",
  oral: "oral",
  paizuri: "paizuri",
  ecchi: "ecchi",
  ero: "ero",
  ass: "ass",
  hass: "ass",
  nsfwneko: "neko",
};

// waifu.pics NSFW categories
const waifuPicsTags = {
  blowjob: "blowjob",
  pgif: "pgif",
  nsfwwaifu: "waifu",
};

const allNsfw = { ...nsfwTags, ...waifuPicsTags };

export default {
  name: "nsfw",
  alias: Object.keys(allNsfw),
  uniquecommands: ["hentai", "milf", "oral", "paizuri", "ecchi", "ero", "ass", "blowjob", "nsfwneko", "pgif"],
  description: "NSFW anime images",
  start: async (Atlas, m, { inputCMD, doReact }) => {
    await doReact("🔞");

    // Try waifu.im for main NSFW tags
    if (nsfwTags[inputCMD]) {
      try {
        const data = await got(
          `https://api.waifu.im/search?included_tags=${nsfwTags[inputCMD]}&is_nsfw=true`,
          { headers }
        ).json();
        const url = data.images[0].url;
        await Atlas.sendMessage(m.from, {
          image: { url },
          caption: `🔞 *${inputCMD.toUpperCase()}*`,
        }, { quoted: m });
        return;
      } catch {}
    }

    // Try waifu.pics for blowjob/pgif/waifu
    if (waifuPicsTags[inputCMD]) {
      try {
        const category = waifuPicsTags[inputCMD];
        const data = await got(
          `https://api.waifu.pics/nsfw/${category}`,
          { headers }
        ).json();
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
        return;
      } catch {}
    }

    m.reply(`❌ Failed to fetch. Try again!`);
  },
};