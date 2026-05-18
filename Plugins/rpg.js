import fs from "fs";
import mongoose from "mongoose";

const cooldowns = new Map();
const COOLDOWN_TIME = 30000;

const playerSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  name: { type: String, default: "Player" },
  inventory: {
    wood: { type: Number, default: 0 },
    stone: { type: Number, default: 0 },
    iron: { type: Number, default: 0 },
    diamonds: { type: Number, default: 0 },
    goldenApple: { type: Number, default: 0 },
    diamondpickaxe: { type: Number, default: 0 },
    ironpickaxe: { type: Number, default: 0 },
    stonepickaxe: { type: Number, default: 0 },
    woodenaxe: { type: Number, default: 0 },
  },
});

const player = mongoose.models.Player || mongoose.model("Player", playerSchema);

const getEcoUser = async (id) => {
  const EcoUser = mongoose.models.EcoUser;
  if (!EcoUser) return null;
  let user = await EcoUser.findOne({ id });
  if (!user) user = await EcoUser.create({ id });
  return user;
};

const rpgItems = {
  woodenaxe: { cost: 250, field: "woodenaxe", name: "🪓 Wooden Axe" },
  stonepickaxe: { cost: 500, field: "stonepickaxe", name: "⛏️ Stone Pickaxe" },
  ironpickaxe: { cost: 2000, field: "ironpickaxe", name: "⛏️ Iron Pickaxe" },
  diamondpickaxe: { cost: 5000, field: "diamondpickaxe", name: "💠 Diamond Pickaxe" },
  goldenapple: { cost: 1000, field: "goldenApple", name: "🍎 Golden Apple" },
};

const rpgSellPrices = {
  wood: 30,
  stone: 50,
  iron: 150,
  diamonds: 500,
  goldenApple: 5000,
};

const lootTables = {
  woodenaxe: { wood: [8,4], stone: [2,2], iron: [1,1], diamonds: [0,1] },
  stonepickaxe: { wood: [4,4], stone: [4,2], iron: [2,1], diamonds: [0,1] },
  ironpickaxe: { wood: [1,1], stone: [4,2], iron: [4,1], diamonds: [2,2] },
  diamondpickaxe: { wood: [0,1], stone: [4,2], iron: [4,1], diamonds: [7,3] },
};

export default {
  name: "rpg",
  alias: [
    "rpgbuy", "rpginv", "rpginventory", "mine", "hunt",
    "chop", "hunt2", "register", "rpgshop", "sellitem", "sellinv",
  ],
  uniquecommands: [
    "rpgbuy", "rpginventory", "mine", "hunt",
    "hunt2", "register", "rpgshop", "sellitem",
  ],
  description: "RPG system - mine, hunt, sell items",
  start: async (Atlas, m, { pushName, prefix, inputCMD, doReact, text, args }) => {
    let pic;
    try { pic = fs.readFileSync("./Assets/Atlas.jpg"); } catch {}
    let user;

    switch (inputCMD) {

      case "register": {
        await doReact("🔰");
        user = await player.findOne({ id: m.sender });
        if (user) return m.reply("⚠️ Already registered in RPG!");
        await player.create({ id: m.sender, name: pushName || "Player" });
        m.reply(`✅ Registered in RPG!\n\nNow buy a tool with *${prefix}rpgshop* and start mining with *${prefix}mine woodenaxe*`);
        break;
      }

      case "rpgshop":
      case "store": {
        await doReact("🛒");
        const list = Object.entries(rpgItems).map(([k,v]) => `▪️ *${v.name}* — $${v.cost}\n   Buy: *${prefix}rpgbuy ${k}*`).join("\n\n");
        m.reply(`🛍️ *RPG Shop*\n\n${list}`);
        break;
      }

      case "rpgbuy": {
        await doReact("💰");
        user = await player.findOne({ id: m.sender });
        if (!user) return m.reply(`Register first with *${prefix}register*`);
        if (!text) return m.reply(`Usage: *${prefix}rpgbuy <item>*\n\nSee items: *${prefix}rpgshop*`);
        const selectedItem = rpgItems[text.toLowerCase().trim()];
        if (!selectedItem) return m.reply(`❌ Invalid item! See *${prefix}rpgshop*`);
        const ecoUser = await getEcoUser(m.sender);
        if (!ecoUser) return m.reply("❌ Economy not available!");
        if (ecoUser.wallet < selectedItem.cost) return m.reply(`❌ Need $${selectedItem.cost}! You have $${ecoUser.wallet}`);
        await mongoose.models.EcoUser.findOneAndUpdate({ id: m.sender }, { wallet: ecoUser.wallet - selectedItem.cost });
        user.inventory[selectedItem.field] += 1;
        await user.save();
        m.reply(`✅ Bought *${selectedItem.name}* for *$${selectedItem.cost}*!\n💰 Wallet: $${ecoUser.wallet - selectedItem.cost}`);
        break;
      }

      case "rpginv":
      case "rpginventory": {
        await doReact("🎒");
        user = await player.findOne({ id: m.sender });
        if (!user) return m.reply(`Register first with *${prefix}register*`);
        const inv = user.inventory;
        m.reply(
          `[🐺 RPG INVENTORY 🐺]\n\n` +
          `🍎 Golden Apple: ${inv.goldenApple}\n\n` +
          `🔥 Wood: ${inv.wood}\n` +
          `🔮 Stone: ${inv.stone}\n` +
          `⚒️ Iron: ${inv.iron}\n` +
          `💎 Diamonds: ${inv.diamonds}\n\n` +
          `🔨 *TOOLS*\n` +
          `🪓 Wooden Axe: ${inv.woodenaxe}\n` +
          `⛏️ Stone Pickaxe: ${inv.stonepickaxe}\n` +
          `⛏️ Iron Pickaxe: ${inv.ironpickaxe}\n` +
          `💠 Diamond Pickaxe: ${inv.diamondpickaxe}\n\n` +
          `Sell items: *${prefix}sellitem <item> [amount]*`
        );
        break;
      }

      case "mine":
      case "hunt":
      case "chop": {
        await doReact("⛏️");
        user = await player.findOne({ id: m.sender });
        if (!user) return m.reply(`Register first with *${prefix}register*`);

        const lastUsed = cooldowns.get(m.sender);
        if (lastUsed && Date.now() - lastUsed < COOLDOWN_TIME) {
          const timeLeft = Math.ceil((COOLDOWN_TIME - (Date.now() - lastUsed)) / 1000);
          return m.reply(`⏳ Wait *${timeLeft}s* before mining again.`);
        }

        const axeUsed = args[0]?.toLowerCase();
        if (!axeUsed) {
          return m.reply(
            `⛏️ *Choose a tool:*\n\n` +
            `1. *${prefix}mine woodenaxe*\n` +
            `2. *${prefix}mine stonepickaxe*\n` +
            `3. *${prefix}mine ironpickaxe*\n` +
            `4. *${prefix}mine diamondpickaxe*`
          );
        }

        if (!lootTables[axeUsed]) return m.reply(`❌ Invalid tool! Use woodenaxe, stonepickaxe, ironpickaxe or diamondpickaxe`);
        if (!user.inventory[axeUsed] || user.inventory[axeUsed] < 1) return m.reply(`❌ You don't have a ${axeUsed}!\nBuy one with *${prefix}rpgbuy ${axeUsed}*`);

        const table = lootTables[axeUsed];
        const loot = {
          wood: Math.floor(Math.random() * table.wood[1]) + table.wood[0],
          stone: Math.floor(Math.random() * table.stone[1]) + table.stone[0],
          iron: Math.floor(Math.random() * table.iron[1]) + table.iron[0],
          diamonds: Math.floor(Math.random() * table.diamonds[1]) + table.diamonds[0],
        };

        user.inventory.wood += loot.wood;
        user.inventory.stone += loot.stone;
        user.inventory.iron += loot.iron;
        user.inventory.diamonds += loot.diamonds;

        let lootMsg = `⛏️ *MINE RESULT*\n\nTool: ${axeUsed}\n\n🔥 Wood: +${loot.wood}\n🔮 Stone: +${loot.stone}\n⚒️ Iron: +${loot.iron}\n💎 Diamonds: +${loot.diamonds}`;

        if (axeUsed === "diamondpickaxe" && Math.random() <= 0.05) {
          user.inventory.goldenApple += 1;
          lootMsg += `\n\n🍎 *BONUS: Found a Golden Apple!*`;
        }

        cooldowns.set(m.sender, Date.now());
        await user.save();
        m.reply(lootMsg + `\n\nSell items with *${prefix}sellitem <item>*`);
        break;
      }

      case "hunt2": {
        await doReact("⚔️");
        user = await player.findOne({ id: m.sender });
        if (!user) return m.reply(`Register first with *${prefix}register*`);

        const axe = args[0]?.toLowerCase();
        if (!axe || !lootTables[axe]) return m.reply(`Usage: *${prefix}hunt2 <tool>*`);
        if (!user.inventory[axe] || user.inventory[axe] < 1) return m.reply(`❌ You don't have a ${axe}!`);

        const table = lootTables[axe];
        const loot = {
          wood: Math.floor(Math.random() * table.wood[1]) + table.wood[0],
          stone: Math.floor(Math.random() * table.stone[1]) + table.stone[0],
          iron: Math.floor(Math.random() * table.iron[1]) + table.iron[0],
          diamonds: Math.floor(Math.random() * table.diamonds[1]) + table.diamonds[0],
        };

        user.inventory[axe] -= 1;
        user.inventory.wood += loot.wood;
        user.inventory.stone += loot.stone;
        user.inventory.iron += loot.iron;
        user.inventory.diamonds += loot.diamonds;

        await user.save();
        m.reply(`⚔️ *HUNT RESULT*\n\nTool: ${axe} (consumed)\n\n🔥 Wood: +${loot.wood}\n🔮 Stone: +${loot.stone}\n⚒️ Iron: +${loot.iron}\n💎 Diamonds: +${loot.diamonds}`);
        break;
      }

      case "sellitem":
      case "sellinv": {
        await doReact("💰");
        if (!text) {
          const prices = Object.entries(rpgSellPrices).map(([k,v]) => `${k}: $${v}`).join("\n");
          return m.reply(`💰 *RPG Sell Prices:*\n\n${prices}\n\nUsage: *${prefix}sellitem <item> [amount]*`);
        }
        const parts = text.split(" ");
        const itemName = parts[0].toLowerCase();
        const amount = parseInt(parts[1]) || 1;
        user = await player.findOne({ id: m.sender });
        if (!user) return m.reply(`Register first with *${prefix}register*`);
        if (!rpgSellPrices[itemName]) return m.reply(`❌ Can't sell that! Valid items: ${Object.keys(rpgSellPrices).join(", ")}`);
        const owned = user.inventory[itemName] || 0;
        if (owned < amount) return m.reply(`❌ You only have ${owned}x ${itemName}!`);
        const earnings = rpgSellPrices[itemName] * amount;
        user.inventory[itemName] -= amount;
        await user.save();
        const ecoUser = await getEcoUser(m.sender);
        if (ecoUser) {
          await mongoose.models.EcoUser.findOneAndUpdate({ id: m.sender }, { wallet: ecoUser.wallet + earnings });
        }
        m.reply(`✅ Sold *${amount}x ${itemName}* for *$${earnings}*!\n💰 Wallet: $${ecoUser ? ecoUser.wallet + earnings : "N/A"}`);
        break;
      }

      default:
        break;
    }
  },
};