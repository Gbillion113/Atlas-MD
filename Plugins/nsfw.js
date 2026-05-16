import HMtaiClass from "hmtai";
const hmtai = new HMtaiClass();

const nsfwCommands = {
  hentai: () => hmtai.nsfw.hentai(),
  ass: () => hmtai.nsfw.ass(),
  bdsm: () => hmtai.nsfw.bdsm(),
  cum: () => hmtai.nsfw.cum(),
  pussy: () => hmtai.nsfw.pussy(),
  ahegao: () => hmtai.nsfw.ahegao(),
  boobs: () => hmtai.nsfw.boobs(),
  thighs: () => hmtai.nsfw.thighs(),
  uniform: () => hmtai.nsfw.uniform(),
  gangbang: () => hmtai.nsfw.gangbang(),
  tentacles: () => hmtai.nsfw.tentacles(),
  nsfwneko: () => hmtai.nsfw.nsfwNeko(),
  yuri: () => hmtai.nsfw.yuri(),
  nsfwgif: () => hmtai.nsfw.gif(),
  zettai: () => hmtai.nsfw.zettaiRyouiki(),
};

export default {
  name: "nsfw",
  alias: Object.keys(nsfwCommands),
  uniquecommands: ["hentai", "ass", "bdsm", "cum", "pussy", "ahegao", "boobs", "thighs", "uniform", "gangbang", "nsfwneko", "yuri"],
  description: "NSFW anime images",
  start: async (Atlas, m, { inputCMD, doReact }) => {
    if (!nsfwCommands[inputCMD]) return;
    await doReact("🔞");
    try {
      const url = await nsfwCommands[inputCMD]();
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