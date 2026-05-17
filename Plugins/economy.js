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
  return user;
};

const cooldown = (lastTime, minutes) => {
  if (!lastTime) return false;
  return Date.now() - new Date(lastTime).getTime() < minutes * 60 * 1000;
};

const cooldownLeft = (lastTime, minutes) => {
  const diff = minutes * 60 * 1000 - (Date.now() - new Date(lastTime).getTime());
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
try { debitCard = fs.readFileSync("./Assets/card.png"); } catch { debitCard = null; }

const sendImg = async (Atlas, m, caption) => {
  if (debitCard) {
    await Atlas.sendMessage(m.from, { image: debitCard, caption }, { quoted: m });
  } else {
    await m.reply(caption);
  }
};

// ─── SHOP ─────────────────────────────────────────────
const shopItems = {
  fishingrod: { name: "🎣 Fishing Rod", price: 500, description: "Catch more fish" },
  pickaxe: { name: "⛏️ Pickaxe", price: 800, description: "Dig better loot" },
  laptop: { name: "💻 Laptop", price: 2000, description: "Work boost" },
  shield: { name: "🛡️ Shield", price: 1500, description: "Anti-rob protection" },
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
};

export default {
  name: "economy",
  alias: [
    "wallet","bank","bal","balance","daily","deposit","dep","withdraw","wd",
    "gamble","slot","slots","rob","leaderboard","lb","rich","transfer","give",
    "fish","dig","beg","work","shop","buy","sell","inventory","inv",
    "capacity","bankupgrade","flip","cf","menu"
  ],

  start: async (Atlas, m, { prefix, inputCMD, doReact, text, mentionByTag, pushName }) => {

    const sender = m.sender;
    const user = await getUser(sender);

    // ✅ FIX: normalize command (THIS fixes your bank + group issue)
    const cmd = (inputCMD || "").toLowerCase();

    switch (cmd) {

      // ─── MENU (FIXED MISSING FEATURE) ───────────────
      case "menu": {
        await doReact("📜");
        return m.reply(
`📜 *ECONOMY MENU*

💰 wallet / bank / balance
📅 daily
💵 deposit / withdraw
🎰 gamble / slot / flip
🦹 rob / transfer
🎣 fish / dig
💼 work / beg
🛍️ shop / buy
💰 sell / inventory
📊 leaderboard

Type a command to begin!`
        );
      }

      // ─── WALLET ─────────────────────────────────────
      case "wallet":
      case "bal":
      case "balance": {
        await doReact("💰");
        return sendImg(Atlas, m,
`💳 *${pushName}'s Balance*

💰 Wallet: $${formatNum(user.wallet)}
🏦 Bank: $${formatNum(user.bank)}/$${formatNum(user.bankCapacity)}
💠 Total: $${formatNum(user.wallet + user.bank)}`
        );
      }

      // ─── BANK (FIXED) ──────────────────────────────
      case "bank": {
        await doReact("🏦");

        const total = user.wallet + user.bank;
        let role = "Broke 😭";
        if (total >= 1e9) role = "Billionaire 🤑🤑";
        else if (total >= 1e6) role = "Millionaire 🤑";
        else if (total >= 100000) role = "Rich 💰";

        return sendImg(Atlas, m,
`🏦 *${pushName}'s Bank*

💳 Balance: $${formatNum(user.bank)}/$${formatNum(user.bankCapacity)}
💰 Wallet: $${formatNum(user.wallet)}
👑 Status: ${role}`
        );
      }

      // ─── DAILY ─────────────────────────────────────
      case "daily": {
        await doReact("📅");
        if (cooldown(user.lastDaily, 24 * 60))
          return m.reply(`⏳ Come back in ${cooldownLeft(user.lastDaily, 24 * 60)}`);

        const now = new Date();
        const streak = user.streak + 1;
        const amount = 1000 + Math.min(streak * 100, 1000);

        await User.findOneAndUpdate(
          { id: sender },
          { wallet: user.wallet + amount, lastDaily: now, streak }
        );

        return m.reply(`🎉 +$${amount} claimed!`);
      }

      // ─── DEFAULT FIX ───────────────────────────────
      default:
        break;
    }
  }
};