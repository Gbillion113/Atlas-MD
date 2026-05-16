import HMtaiClass from "hmtai";
const hmtai = new HMtaiClass();

const sfwCommands = {
  waifu: () => hmtai.sfw.wallpaper(),
  neko: () => hmtai.sfw.neko_arts(),
  wolfgirl: () => hmtai.sfw.wolf_arts(),
  coffee: () => hmtai.sfw.coffee_arts(),
  wallpaper: () => hmtai.sfw.wallpaper(),
  mobilewallpaper: () => hmtai.sfw.mobileWallpaper(),
  jahy: () => hmtai.sfw.jahy_arts(),
};

export default {
  name: "sfw",
  alias: Object.keys(sfwCommands),
  uniquecommands: ["waifu", "neko", "wolfgirl", "coffee", "wallpaper", "mobilewallpaper", "jahy"],
  description: "SFW anime images",
  start: async (Atlas, m, { inputCMD, doReact }) => {
    if (!sfwCommands[inputCMD]) return;
    await doReact("🌸");
    try {
      const url = await sfwCommands[inputCMD]();
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