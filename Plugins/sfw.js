import got from "got";

const headers = { "User-Agent": "AtlasBot/1.0 (WhatsApp Group Bot)" };

const sfwTags = {
  waifu: "waifu",
  neko: "neko",
  shinobu: "shinobu",
  megumin: "megumin",
  awoo: "awoo",
};

export default {
  name: "sfw",
  alias: Object.keys(sfwTags),
  uniquecommands: ["waifu", "neko", "shinobu", "megumin", "awoo"],
  description: "SFW anime images",
  start: async (Atlas, m, { inputCMD, doReact }) => {
    if (!sfwTags[inputCMD]) return;
    await doReact("🌸");
    try {
      const data = await got(
        `https://nekos.best/api/v2/${sfwTags[inputCMD]}`,
        { headers }
      ).json();
      const url = data.results[0].url;
      const isGif = url.endsWith(".gif");
      if (isGif) {
        await Atlas.sendMessage(m.from, {
          video: { url },
          gifPlayback: true,
          caption: `🌸 *${inputCMD.toUpperCase()}*`,
        }, { quoted: m });
      } else {
        await Atlas.sendMessage(m.from, {
          image: { url },
          caption: `🌸 *${inputCMD.toUpperCase()}*`,
        }, { quoted: m });
      }
    } catch (err) {
      m.reply(`❌ Failed: ${err.message}`);
    }
  },
};