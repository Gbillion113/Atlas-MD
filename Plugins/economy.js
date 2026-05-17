import mongoose from "mongoose";
import fs from "fs";

// ─── SCHEMA ─────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  wallet: { type: Number, default: 0 },
  bank: { type: Number, default: 1000 },
  bankCapacity: { type: Number, default: 50000 },
  lastDaily: { type: Date, default: null },
  lastFish: { type: Date, default: null },
  lastDig: { type: Date, default: null },
  lastBeg: { type: Date, default: null },
  lastWork: { type: Date, default: null },
  streak: { type: Number, default: 0 },
  inventory: { type: Object, default: {} },
});

const User = mongoose.models.EcoUser || mongoose.model("EcoUser", userSchema);

const getUser = async (id) => {
  let user = await User.findOne({ id });
  if (!user) user = await User.create({ id });
  if (!user.inventory) user.inventory = {};
  return user;
};

const cooldown = (lastTime, minutes) => {
  if (!lastTime) return false;
  return Date.now() - new Date(lastTime).getTime() < minutes * 60000;
};

const cooldownLeft = (lastTime, minutes) => {
  const diff = minutes * 60000 - (Date.now() - new Date(lastTime).getTime());
  const m = Math.floor(diff / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${m}m ${s}s`;
};

const formatNum = (n) => {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toString();
};

let debitCard;
try {
  debitCard = fs.readFileSync("./Assets/card.png");
} catch {
  debitCard = null;
}

const sendImg = async (Atlas, m, caption) => {
  if (debitCard) {
    await Atlas.sendMessage(
      m.from,
      { image: debitCard, caption },
      { quoted: m }
    );
  } else {
    await m.reply(caption);
  }
};

// ─── SHOP ITEMS ─────────────────────────────────────────────
const shopItems = {
  fishingrod: {
    name: "🎣 Fishing Rod",
    price: 500,
    description: "Catch more fish",
  },
  pickaxe: {
    name: "⛏️ Pickaxe",
    price: 800,
    description: "Dig for better loot",
  },
  laptop: {
    name: "💻 Laptop",
    price: 2000,
    description: "Work from home",
  },
  shield: {
    name: "🛡️ Shield",
    price: 1500,
    description: "Protect from robbery",
  },
};

const sellPrices = {
  fish: 200,
  rarefish: 800,
  legendaryfish: 2500,
  stone: 50,
  iron: 150,
  gold: 500,
  diamond: 2000,
  wood: 30,

  // RPG ITEMS
  diamonds: 500,
  goldenApple: 5000,
};

// ─── RANDOM HELPERS ─────────────────────────────────────────
const addItem = (inventory, item, amount = 1) => {
  inventory[item] = (inventory[item] || 0) + amount;
  return inventory;
};

const removeItem = (inventory, item, amount = 1) => {
  inventory[item] = Math.max(0, (inventory[item] || 0) - amount);
  return inventory;
};

export default {
  name: "economy",

  alias: [
    "wallet", "bank", "bal", "balance", "daily",
    "deposit", "dep", "withdraw", "wd",
    "gamble", "slot", "slots", "rob",
    "leaderboard", "lb", "rich",
    "transfer", "give",
    "fish", "dig", "beg", "work",
    "shop", "buy", "sell",
    "sellitem", "sellinv",
    "inventory", "inv",
    "capacity", "bankupgrade",
    "flip", "cf",
  ],

  uniquecommands: [
    "wallet", "bank", "daily",
    "deposit", "withdraw",
    "gamble", "slot",
    "rob", "leaderboard",
    "transfer", "fish",
    "dig", "beg", "work",
    "shop", "buy", "sell",
    "inventory", "capacity",
    "flip",
  ],

  description: "Full Economy System",

  start: async (
    Atlas,
    m,
    {
      prefix,
      inputCMD,
      doReact,
      text,
      mentionByTag,
      pushName,
    }
  ) => {

    const sender = m.sender;
    const user = await getUser(sender);

    switch (inputCMD) {

      // ─── WALLET ───────────────────────────────────────────
      case "wallet":
      case "bal":
      case "balance": {

        await doReact("💰");

        await sendImg(
          Atlas,
          m,
          `💳 *${pushName}'s Balance*\n\n` +
          `💰 Wallet: $${formatNum(user.wallet)}\n` +
          `🏦 Bank: $${formatNum(user.bank)}/${formatNum(user.bankCapacity)}\n` +
          `💠 Total: $${formatNum(user.wallet + user.bank)}`
        );

        break;
      }

      // ─── DAILY ────────────────────────────────────────────
      case "daily": {

        await doReact("📅");

        if (cooldown(user.lastDaily, 1440)) {
          return m.reply(
            `⏳ Already claimed!\nCome back in *${cooldownLeft(user.lastDaily, 1440)}*`
          );
        }

        const lastDate = user.lastDaily
          ? new Date(user.lastDaily)
          : null;

        const now = new Date();

        const streak =
          lastDate &&
          now - lastDate < 48 * 60 * 60 * 1000
            ? user.streak + 1
            : 1;

        const bonus = Math.min(streak * 100, 1000);
        const amount = 1000 + bonus;

        await User.findOneAndUpdate(
          { id: sender },
          {
            wallet: user.wallet + amount,
            lastDaily: now,
            streak,
          }
        );

        m.reply(
          `🎉 *Daily Claimed!*\n\n` +
          `💰 +$${formatNum(amount)}\n` +
          `🔥 Streak: ${streak}\n` +
          `⭐ Bonus: +$${bonus}`
        );

        break;
      }

      // ─── BUY ──────────────────────────────────────────────
      case "buy": {

        await doReact("🛒");

        if (!text) {
          return m.reply(
            `Usage: *${prefix}buy <item> [amount]*`
          );
        }

        const parts = text.split(" ");
        const itemKey = parts[0].toLowerCase();
        const amount = parseInt(parts[1]) || 1;

        const item = shopItems[itemKey];

        if (!item) {
          return m.reply(`❌ Item not found!`);
        }

        if (amount < 1) {
          return m.reply(`❌ Invalid amount!`);
        }

        const totalPrice = item.price * amount;

        if (user.wallet < totalPrice) {
          return m.reply(
            `❌ Need $${formatNum(totalPrice)}!\nYou have $${formatNum(user.wallet)}`
          );
        }

        const newInventory = addItem(
          { ...user.inventory },
          itemKey,
          amount
        );

        await User.findOneAndUpdate(
          { id: sender },
          {
            wallet: user.wallet - totalPrice,
            inventory: newInventory,
          }
        );

        m.reply(
          `✅ Bought *${amount}x ${item.name}*\n` +
          `💸 Cost: $${formatNum(totalPrice)}`
        );

        break;
      }

      // ─── SELL ─────────────────────────────────────────────
      case "sell":
      case "sellitem":
      case "sellinv": {

        await doReact("💰");

        if (!text) {

          const prices = Object.entries(sellPrices)
            .map(([k, v]) => `${k}: $${formatNum(v)}`)
            .join("\n");

          return m.reply(
            `💰 *Sell Prices*\n\n${prices}\n\n` +
            `Usage: *${prefix}sell <item> [amount]*`
          );
        }

        const parts = text.split(" ");
        const itemName = parts[0];
        const amount = parseInt(parts[1]) || 1;

        if (!sellPrices[itemName]) {
          return m.reply(`❌ Can't sell that item!`);
        }

        const owned = user.inventory?.[itemName] || 0;

        if (owned < amount) {
          return m.reply(
            `❌ You only have ${owned}x ${itemName}`
          );
        }

        const earnings = sellPrices[itemName] * amount;

        const newInventory = removeItem(
          { ...user.inventory },
          itemName,
          amount
        );

        await User.findOneAndUpdate(
          { id: sender },
          {
            wallet: user.wallet + earnings,
            inventory: newInventory,
          }
        );

        m.reply(
          `✅ Sold *${amount}x ${itemName}*\n` +
          `💰 Earned: $${formatNum(earnings)}`
        );

        break;
      }

      // ─── SHOP ─────────────────────────────────────────────
      case "shop": {

        await doReact("🛍️");

        const list = Object.entries(shopItems)
          .map(([k, v]) =>
            `▪️ *${v.name}*\n` +
            `💰 Price: $${formatNum(v.price)}\n` +
            `📦 ${v.description}\n` +
            `🛒 ${prefix}buy ${k}`
          )
          .join("\n\n");

        m.reply(`🛍️ *Economy Shop*\n\n${list}`);

        break;
      }

      // ─── INVENTORY ────────────────────────────────────────
      case "inventory":
      case "inv": {

        await doReact("🎒");

        const inv = user.inventory || {};

        const items = Object.entries(inv)
          .filter(([, v]) => v > 0);

        if (!items.length) {
          return m.reply("🎒 Inventory is empty!");
        }

        const list = items
          .map(([k, v]) =>
            `▪️ ${k}: ${v}x`
          )
          .join("\n");

        m.reply(
          `🎒 *${pushName}'s Inventory*\n\n${list}`
        );

        break;
      }

      // ─── LEADERBOARD ──────────────────────────────────────
      case "leaderboard":
      case "lb":
      case "rich": {

        await doReact("📊");

        const users = await User.find();

        const sorted = users.sort(
          (a, b) =>
            (b.wallet + b.bank) -
            (a.wallet + a.bank)
        );

        const top = sorted.slice(0, 10);

        if (!top.length) {
          return m.reply("No users yet!");
        }

        let str = `💰 *Economy Leaderboard*\n\n`;

        for (let i = 0; i < top.length; i++) {

          str +=
            `*${i + 1}.* ${top[i].id.split("@")[0]}\n` +
            `💵 $${formatNum(top[i].wallet + top[i].bank)}\n\n`;
        }

        m.reply(str);

        break;
      }

      default:
        break;
    }
  },
};