import got from "got";

const sfwEndpoints = {
  waifu: "https://api.waifu.pics/sfw/waifu",
  neko: "https://api.waifu.pics/sfw/neko",
  shinobu: "https://api.waifu.pics/sfw/shinobu",
  megumin: "https://api.waifu.pics/sfw/megumin",
  bully: "https://api.waifu.pics/sfw/bully",
  awoo: "https://api.waifu.pics/sfw/awoo",
  kiss: "https://api.waifu.pics/sfw/kiss",
  lick: "https://api.waifu.pics/sfw/lick",
  pat: "https://api.waifu.pics/sfw/pat",
  smug: "https://api.waifu.pics/sfw/smug",
  bonk: "https://api.waifu.pics/sfw/bonk",
  blush: "https://api.waifu.pics/sfw/blush",
  smile: "https://api.waifu.pics/sfw/smile",
  wave: "https://api.waifu.pics/sfw/wave",
  highfive: "https://api.waifu.pics/sfw/highfive",
  nom: "https://api.waifu.pics/sfw/nom",
  dance: "https://api.waifu.pics/sfw/dance",
  happy: "https://api.waifu.pics/sfw/happy",
};

export default {
  name: "sfw",
  alias: Object.keys(sfwEndpoints),
  uniquecommands: ["waifu", "neko", "shinobu", "megumin", "awoo", "dance", "happy"],
  description: "SFW anime images",
  start: async (Atlas, m, { inputCMD, doReact }) => {
    const url = sfwEndpoints[inputCMD];
    if (!url) return;
    await doReact("🌸");
    try {
      const data = await got(url).json();
      await Atlas.sendMessage(m.from, {
        image: { url: data.url },
        caption: `🌸 *${inputCMD.toUpperCase()}*`,
      }, { quoted: m });
    } catch (err) {
      m.reply(`❌ Failed to fetch image: ${err.message}`);
    }
  },
};