/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║        💰 MONEY WARS — Atlas MD Extension Plugin        ║
 * ║  Adds: tiers · golden apple · heist · stocks · premium  ║
 * ╠══════════════════════════════════════════════════════════╣
 * ║  SAFE TO USE ALONGSIDE economy.js — no command clashes  ║
 * ║  Uses the SAME EcoUser model (extended via patch)        ║
 * ╚══════════════════════════════════════════════════════════╝
 *
 * NEW COMMANDS (none clash with economy.js):
 *   -mw          → Money Wars info / help
 *   -tier        → View your tier & benefits
 *   -richlist    → Premium leaderboard with tier badges
 *   -setpremium  → [Owner] Set a player's tier
 *   -resetseason → [Owner] End season, crown winner
 *   -mwapple     → Buy/use a Money Wars Golden Apple buff
 *   -heist       → Start a group bank heist (Gold+)
 *   -joinheist   → Join an active heist (Gold+)
 *   -stocks      → View the stock market
 *   -buystock    → Buy shares (Gold+)
 *   -sellstock   → Sell shares (Gold+)
 *   -portfolio   → View your stock holdings
 */

import mongoose from "mongoose";

// ─────────────────────────────────────────────────────────────────────────────
// ECOUSER MODEL
// Defined here so moneywars.js works regardless of plugin load order.
// Mongoose deduplicates — whichever plugin loads first registers it,
// the second just retrieves it. No conflict with economy.js.
// ─────────────────────────────────────────────────────────────────────────────

const EcoUserSchema = new mongoose.Schema({
  id:           { type: String, required: true, unique: true },
  wallet:       { type: Number, default: 0 },
  bank:         { type: Number, default: 1000 },
  bankCapacity: { type: Number, default: 50000 },
  lastDaily:    { type: Date,   default: null },
  lastFish:     { type: Date,   default: null },
  lastDig:      { type: Date,   default: null },
  lastBeg:      { type: Date,   default: null },
  lastWork:     { type: Date,   default: null },
  streak:       { type: Number, default: 0 },
  inventory:    { type: Object, default: {} },
});
const EcoUser = mongoose.models.EcoUser || mongoose.model("EcoUser", EcoUserSchema);

// ─────────────────────────────────────────────────────────────────────────────
// MWUSER MODEL
// ─────────────────────────────────────────────────────────────────────────────

const MWUserSchema = new mongoose.Schema({
  id:                { type: String, unique: true },
  tier:              { type: String,  default: "free"  },
  tierExpiry:        { type: Date,    default: null     },
  goldenAppleBuff:   { type: Boolean, default: false    },
  goldenAppleShield: { type: Number,  default: 0        },
  seasonEarned:      { type: Number,  default: 0        },
});

const HeistSchema = new mongoose.Schema({
  groupId:   { type: String, unique: true },
  leader:    String,
  members:   [String],
  startTime: { type: Number, default: () => Date.now() },
  active:    { type: Boolean, default: false },
});

const StockSchema = new mongoose.Schema({
  symbol:     { type: String, unique: true },
  name:       String,
  price:      Number,
  change:     { type: Number, default: 0 },
  history:    [Number],
  lastUpdate: Number,
});

const PortfolioSchema = new mongoose.Schema({
  id:     String,
  symbol: String,
  shares: { type: Number, default: 0 },
  avgBuy: { type: Number, default: 0 },
});

const MWUser      = mongoose.models.MWUser      || mongoose.model("MWUser",      MWUserSchema);
const MWHeist     = mongoose.models.MWHeist     || mongoose.model("MWHeist",     HeistSchema);
const MWStock     = mongoose.models.MWStock     || mongoose.model("MWStock",     StockSchema);
const MWPortfolio = mongoose.models.MWPortfolio || mongoose.model("MWPortfolio", PortfolioSchema);

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const TIERS = {
  free:    { label: "🥉 Free",    badge: "",    dailyMult: 1, startBonus: 0,       monthlyNGN: 0     },
  silver:  { label: "🥈 Silver",  badge: "🥈",  dailyMult: 1, startBonus: 10_000,  monthlyNGN: 500   },
  gold:    { label: "🥇 Gold",    badge: "🥇",  dailyMult: 2, startBonus: 50_000,  monthlyNGN: 1_000 },
  diamond: { label: "💎 Diamond", badge: "💎",  dailyMult: 3, startBonus: 200_000, monthlyNGN: 2_500 },
};

const TIER_GATES = {
  heist:     "gold",
  joinheist: "gold",
  buystock:  "gold",
  sellstock: "gold",
};

const GOLDEN_APPLE_PRICE = 5_000;

const INITIAL_STOCKS = [
  { symbol: "NAIJ", name: "NaijaBank Corp",    price: 1_200 },
  { symbol: "KRYP", name: "KryptoCoin Ltd",     price: 8_500 },
  { symbol: "AGRO", name: "AgroFirst Holdings", price: 450   },
  { symbol: "TECH", name: "TechLagos Inc",      price: 3_200 },
  { symbol: "FUEL", name: "PetroNG Resources",  price: 920   },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const fmt = (n) => {
  if (n >= 1e9) return `$${(n/1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n/1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n/1e3).toFixed(1)}K`;
  return `$${n}`;
};

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const tierLevel = (t) => ["free","silver","gold","diamond"].indexOf(t ?? "free");

async function getMWUser(id) {
  let u = await MWUser.findOne({ id });
  if (!u) u = await MWUser.create({ id });
  if (u.tier !== "free" && u.tierExpiry && new Date() > u.tierExpiry) {
    u.tier = "free";
    u.tierExpiry = null;
    await u.save();
  }
  return u;
}

async function getWallet(id) {
  const eco = await EcoUser.findOne({ id });
  return eco?.wallet ?? 0;
}

async function deductWallet(id, amount) {
  await EcoUser.findOneAndUpdate({ id }, { $inc: { wallet: -amount } });
}

async function addWallet(id, amount) {
  await EcoUser.findOneAndUpdate({ id }, { $inc: { wallet: amount } });
}

// ─────────────────────────────────────────────────────────────────────────────
// STOCK MARKET SETUP
// ─────────────────────────────────────────────────────────────────────────────

async function seedStocks() {
  for (const s of INITIAL_STOCKS) {
    if (!await MWStock.findOne({ symbol: s.symbol })) {
      await MWStock.create({ ...s, history: [s.price], lastUpdate: Date.now() });
    }
  }
}

async function tickStocks() {
  for (const stock of await MWStock.find()) {
    const pct      = parseFloat((Math.random() * 20 - 10).toFixed(2));
    const newPrice = Math.max(10, Math.round(stock.price * (1 + pct / 100)));
    stock.change     = pct;
    stock.price      = newPrice;
    stock.history    = [...stock.history.slice(-9), newPrice];
    stock.lastUpdate = Date.now();
    await stock.save();
  }
}

seedStocks().catch(() => {});
setInterval(() => tickStocks().catch(() => {}), 30 * 60 * 1000);

// ─────────────────────────────────────────────────────────────────────────────
// HEIST EXECUTION
// ─────────────────────────────────────────────────────────────────────────────

async function executeHeist(groupId, Atlas, m) {
  const heist = await MWHeist.findOne({ groupId, active: true });
  if (!heist) return;
  heist.active = false;
  await heist.save();

  if (heist.members.length < 2) {
    return Atlas.sendMessage(m.from, {
      text: "🏦 *Heist cancelled!* Need at least 2 crew members. Vault Keys not refunded (lesson learned 😅)"
    });
  }

  const vault      = rand(20_000, 100_000);
  const successPct = Math.min(0.8, 0.3 + heist.members.length * 0.1);
  const success    = Math.random() < successPct;

  if (!success) {
    const fine = rand(500, 2_000);
    for (const id of heist.members) await deductWallet(id, fine);
    return Atlas.sendMessage(m.from, {
      text:
        `🚔 *HEIST BUSTED!*\n` +
        `The cops were waiting... everyone pays *${fmt(fine)}* in fines.\n` +
        `Crew: ${heist.members.length} people. Better plan next time! 😭`
    });
  }

  const share = Math.floor(vault / heist.members.length);
  for (const id of heist.members) {
    await addWallet(id, share);
    const mwu = await getMWUser(id);
    mwu.seasonEarned += share;
    await mwu.save();
  }

  Atlas.sendMessage(m.from, {
    text:
      `💰 *HEIST SUCCESSFUL!* 🎉\n` +
      `${"═".repeat(22)}\n` +
      `🏦 Vault looted: ${fmt(vault)}\n` +
      `👥 Crew: ${heist.members.length} members\n` +
      `💵 Each member gets: *${fmt(share)}*\n` +
      `${"═".repeat(22)}\n` +
      `Wallets updated!`
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// PLUGIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export default {
  name: "moneywars",
  alias: [
    "mw", "tier", "mytier", "richlist", "rl",
    "setpremium", "resetseason",
    "mwapple",
    "heist", "joinheist",
    "stocks", "buystock", "sellstock", "portfolio",
  ],
  uniquecommands: [
    "mw", "tier", "richlist",
    "setpremium", "resetseason",
    "mwapple",
    "heist", "joinheist",
    "stocks", "buystock", "sellstock", "portfolio",
  ],
  description: "💰 Money Wars — Tiers, Heist, Stocks & Golden Apple",

  // ✅ uses isCreator not isOwner — matches Core.js
  start: async (Atlas, m, { prefix, inputCMD, text, args, mentionByTag, pushName, isCreator }) => {
    const sender = m.sender;

    switch (inputCMD) {

      case "mw": {
        await m.reply(
          `💰 *MONEY WARS*\n${"═".repeat(24)}\n\n` +
          `🥉 *Free*   → play & earn for free\n` +
          `🥈 *Silver* → ₦500/mo — ×1 daily\n` +
          `🥇 *Gold*   → ₦1,000/mo — ×2 daily, rob, heist, stocks\n` +
          `💎 *Diamond*→ ₦2,500/mo — ×3 daily, exclusive board\n\n` +
          `*Commands:*\n` +
          `▪️ \`${prefix}tier\` — your tier & benefits\n` +
          `▪️ \`${prefix}richlist\` — top players with badges\n` +
          `▪️ \`${prefix}mwapple\` — buy MW Golden Apple buff\n` +
          `▪️ \`${prefix}heist\` — group bank heist (Gold+)\n` +
          `▪️ \`${prefix}stocks\` — stock market\n` +
          `▪️ \`${prefix}buystock <SYM> <qty>\` — buy shares\n` +
          `▪️ \`${prefix}sellstock <SYM> <qty>\` — sell shares\n` +
          `▪️ \`${prefix}portfolio\` — your holdings\n\n` +
          `_Pay via Opay/Palmpay → send proof → owner upgrades you_`
        );
        break;
      }
case "tier":
      case "mytier": {
        const mwu    = await getMWUser(sender);
        const wallet = await getWallet(sender);
        const t      = TIERS[mwu.tier];
        const expiry = mwu.tierExpiry ? mwu.tierExpiry.toDateString() : "—";
        m.reply(
          `🎖️ *${pushName}'s Tier*\n${"─".repeat(20)}\n` +
          `Tier:   *${t.label}*\n` +
          `Daily:  ×${t.dailyMult} multiplier\n` +
          `Price:  ${t.monthlyNGN ? `₦${t.monthlyNGN}/month` : "Free"}\n` +
          `Expiry: ${expiry}\n\n` +
          (mwu.goldenAppleBuff   ? `🍎 Golden Apple buff: *ACTIVE* (next daily doubled)\n` : "") +
          (mwu.goldenAppleShield ? `🛡️ Golden Apple shield: *${mwu.goldenAppleShield} turn(s)*\n` : "") +
          `\n💰 Wallet: ${fmt(wallet)}\n` +
          `\nType \`${prefix}mw\` to see all Money Wars commands.`
        );
        break;
      }

      case "richlist":
      case "rl": {
        const top = await EcoUser.find().sort({ bank: -1, wallet: -1 }).limit(10);
        if (!top.length) return m.reply("📊 No players yet!");
        const medals = ["🥇","🥈","🥉"];
        let board = `👑 *Money Wars Rich List*\n${"═".repeat(24)}\n`;
        for (let i = 0; i < top.length; i++) {
          const mwu   = await MWUser.findOne({ id: top[i].id });
          const badge = TIERS[mwu?.tier ?? "free"]?.badge || "";
          const total = (top[i].wallet ?? 0) + (top[i].bank ?? 0);
          const medal = medals[i] ?? `${i+1}.`;
          const name  = top[i].id.split("@")[0];
          board += `${medal} ${badge} ${name}\n   💰 ${fmt(total)}\n`;
        }
        m.reply(board);
        break;
      }

      case "mwapple": {
        const mwu    = await getMWUser(sender);
        const wallet = await getWallet(sender);

        if (!text) {
          return m.reply(
            `🍎 *MW Golden Apple* _(not the RPG item)_\n${"─".repeat(20)}\n` +
            `Cost:    ${fmt(GOLDEN_APPLE_PRICE)}\n` +
            `Effects:\n` +
            `  • Doubles your next \`${prefix}daily\` reward\n` +
            `  • Gives 3-turn rob protection shield\n\n` +
            (mwu.goldenAppleBuff   ? `✅ Buff: ACTIVE (daily doubled)\n` : "") +
            (mwu.goldenAppleShield ? `🛡️ Shield: ${mwu.goldenAppleShield} turn(s) left\n` : "") +
            `\n💰 Your wallet: ${fmt(wallet)}\n` +
            `\nUsage: \`${prefix}mwapple buy\` to purchase & activate\n` +
            `_RPG golden apple: \`${prefix}rpgbuy goldenapple\`_`
          );
        }

        if (text.toLowerCase() === "buy") {
          if (mwu.goldenAppleBuff || mwu.goldenAppleShield > 0)
            return m.reply("🍎 You already have a Golden Apple buff active!");
          if (wallet < GOLDEN_APPLE_PRICE)
            return m.reply(`❌ Need ${fmt(GOLDEN_APPLE_PRICE)}, you have ${fmt(wallet)}.`);

          await deductWallet(sender, GOLDEN_APPLE_PRICE);
          mwu.goldenAppleBuff   = true;
          mwu.goldenAppleShield = 3;
          await mwu.save();

          return m.reply(
            `🍎 *MW Golden Apple activated!*\n` +
            `${"─".repeat(20)}\n` +
            `├ 💵 Cost: ${fmt(GOLDEN_APPLE_PRICE)} deducted\n` +
            `├ ✨ Next \`${prefix}daily\` is *DOUBLED*\n` +
            `└ 🛡️ 3-turn rob protection active\n\n` +
            `💰 Wallet: ${fmt(wallet - GOLDEN_APPLE_PRICE)}`
          );
        }

        m.reply(`Usage: \`${prefix}mwapple\` to check, \`${prefix}mwapple buy\` to purchase`);
        break;
      }

      case "heist": {
        const mwu = await getMWUser(sender);
        if (tierLevel(mwu.tier) < tierLevel("gold"))
          return m.reply(`🔒 *-heist* requires *🥇 Gold* tier.\nType \`${prefix}mw\` to see how to upgrade.`);
        if (!m.isGroup)
          return m.reply("❌ Heists can only be started in group chats!");

        const groupId  = m.from;
        const existing = await MWHeist.findOne({ groupId, active: true });
        if (existing) return m.reply("🏦 A heist is already running! Use `-joinheist` to join.");

        await MWHeist.create({ groupId, leader: sender, members: [sender], active: true });

        m.reply(
          `🏦 *BANK HEIST INITIATED!*\n${"═".repeat(22)}\n` +
          `👑 Leader: ${pushName}\n` +
          `⏳ You have *60 seconds* to join.\n` +
          `💰 Bank vault: $20K–$100K to split\n` +
          `${"═".repeat(22)}\n` +
          `Type \`${prefix}joinheist\` to join the crew!\n` +
          `_Minimum 2 players required._`
        );

        setTimeout(() => executeHeist(groupId, Atlas, m).catch(() => {}), 60_000);
        break;
      }

      case "joinheist": {
        const mwu = await getMWUser(sender);
        if (tierLevel(mwu.tier) < tierLevel("gold"))
          return m.reply(`🔒 *-joinheist* requires *🥇 Gold* tier.`);
        if (!m.isGroup) return m.reply("❌ Group only!");

        const heist = await MWHeist.findOne({ groupId: m.from, active: true });
        if (!heist) return m.reply("🏦 No active heist! Start one with `-heist`");
        if (heist.members.includes(sender)) return m.reply("✅ You're already in the crew!");

        heist.members.push(sender);
        await heist.save();
        m.reply(`🦹 *${pushName}* joined the crew! (${heist.members.length} members)`);
        break;
      }

      case "stocks": {
        const list = await MWStock.find();
        if (!list.length) return m.reply("📊 Market loading... try again in a moment.");
        let board = `📈 *Money Wars Stock Market*\n${"═".repeat(26)}\n`;
        for (const s of list) {
          const arrow = s.change >= 0 ? "📈" : "📉";
          const sign  = s.change >= 0 ? "+" : "";
          board += `*${s.symbol}* ${fmt(s.price)}  ${arrow} ${sign}${s.change}%\n  ${s.name}\n`;
        }
        board += `\n_Ticks every 30 min_\nBuy: \`${prefix}buystock NAIJ 5\``;
        m.reply(board);
        break;
      }

      case "buystock": {
        const mwu = await getMWUser(sender);
        if (tierLevel(mwu.tier) < tierLevel("gold"))
          return m.reply(`🔒 *-buystock* requires *🥇 Gold* tier.`);

        const [sym, qtyStr] = (text || "").split(" ");
        const qty = parseInt(qtyStr);
        if (!sym || !qty || qty < 1) return m.reply(`Usage: \`${prefix}buystock NAIJ 5\``);

        const stock = await MWStock.findOne({ symbol: sym.toUpperCase() });
        if (!stock) return m.reply(`❌ Unknown symbol. Check \`${prefix}stocks\``);

        const cost   = stock.price * qty;
        const wallet = await getWallet(sender);
        if (wallet < cost) return m.reply(`❌ Need ${fmt(cost)}, you have ${fmt(wallet)}.`);

        await deductWallet(sender, cost);

        const port = await MWPortfolio.findOne({ id: sender, symbol: stock.symbol });
        if (port) {
          port.avgBuy = ((port.avgBuy * port.shares) + cost) / (port.shares + qty);
          port.shares += qty;
          await port.save();
        } else {
          await MWPortfolio.create({ id: sender, symbol: stock.symbol, shares: qty, avgBuy: stock.price });
        }

        m.reply(
          `✅ Bought *${qty}x ${stock.symbol}* @ ${fmt(stock.price)}/share\n` +
          `Total: ${fmt(cost)}\n💰 Wallet: ${fmt(wallet - cost)}`
        );
        break;
      }

      case "sellstock": {
        const [sym, qtyStr] = (text || "").split(" ");
        const qty = parseInt(qtyStr);
        if (!sym || !qty || qty < 1) return m.reply(`Usage: \`${prefix}sellstock NAIJ 3\``);

        const stock = await MWStock.findOne({ symbol: sym.toUpperCase() });
        if (!stock) return m.reply(`❌ Unknown symbol. Check \`${prefix}stocks\``);

        const port = await MWPortfolio.findOne({ id: sender, symbol: stock.symbol });
        if (!port || port.shares < qty)
          return m.reply(`❌ You don't have ${qty}x ${sym.toUpperCase()}.`);

        const earned = stock.price * qty;
        const pl     = earned - (port.avgBuy * qty);
        const plSign = pl >= 0 ? "+" : "";

        await addWallet(sender, earned);
        port.shares -= qty;
        if (port.shares <= 0) await port.deleteOne();
        else await port.save();

        const mwu = await getMWUser(sender);
        mwu.seasonEarned += Math.max(0, pl);
        await mwu.save();

        m.reply(
          `💹 Sold *${qty}x ${stock.symbol}* @ ${fmt(stock.price)}/share\n` +
          `├ Earned: ${fmt(earned)}\n` +
          `├ P/L: ${plSign}${fmt(pl)}\n` +
          `└ 💰 Wallet: ${fmt(await getWallet(sender))}`
        );
        break;
  }

      case "portfolio": {
        const holdings = await MWPortfolio.find({ id: sender });
        if (!holdings.length) return m.reply(`📊 No stocks yet. Check \`${prefix}stocks\` to invest!`);
        let total = 0;
        let board = `📊 *${pushName}'s Portfolio*\n${"─".repeat(22)}\n`;
        for (const h of holdings) {
          const stock = await MWStock.findOne({ symbol: h.symbol });
          if (!stock) continue;
          const value = stock.price * h.shares;
          const pl    = value - (h.avgBuy * h.shares);
          total += value;
          board += `*${h.symbol}* ×${h.shares}  ${fmt(value)}  P/L: ${pl>=0?"+":""}${fmt(pl)}\n`;
        }
        board += `\n💼 Portfolio value: *${fmt(total)}*`;
        m.reply(board);
        break;
      }

      case "setpremium": {
        if (!isCreator) return m.reply("❌ Owner only.");
        const target = mentionByTag?.[0] || m.quoted?.sender;
        const tier   = args[0]?.toLowerCase();
        const days   = parseInt(args[1]) || 30;

        if (!target || !tier) return m.reply(`Usage: \`${prefix}setpremium @user silver 30\``);
        if (!TIERS[tier])     return m.reply("Valid tiers: free, silver, gold, diamond");

        const mwTarget = await getMWUser(target);
        const wasNew   = mwTarget.tier === "free";
        const bonus    = (wasNew && tier !== "free") ? TIERS[tier].startBonus : 0;

        mwTarget.tier       = tier;
        mwTarget.tierExpiry = tier === "free" ? null : new Date(Date.now() + days * 86_400_000);
        await mwTarget.save();

        if (bonus > 0) await addWallet(target, bonus);

        await Atlas.sendMessage(m.from, {
          text:
            `✅ *@${target.split("@")[0]}* upgraded to *${TIERS[tier].label}*!\n` +
            `├ 🎁 Start bonus: +${fmt(bonus)}\n` +
            `└ ⏳ Expires: ${mwTarget.tierExpiry?.toDateString() ?? "Never"}`,
          mentions: [target],
        }, { quoted: m });
        break;
      }

      case "resetseason": {
        if (!isCreator) return m.reply("❌ Owner only.");

        const top    = await EcoUser.find().sort({ bank: -1, wallet: -1 }).limit(1);
        const winner = top[0];

        await EcoUser.updateMany({}, {
          $set: {
            wallet: 0, bank: 1000, bankCapacity: 50000, streak: 0,
            lastDaily: null, lastFish: null, lastDig: null,
            lastBeg: null, lastWork: null, inventory: {}
          }
        });

        await MWUser.updateMany({}, {
          $set: { goldenAppleBuff: false, goldenAppleShield: 0, seasonEarned: 0 }
        });

        await MWPortfolio.deleteMany({});

        const winnerName = winner ? winner.id.split("@")[0] : "Nobody";
        const winnerAmt  = winner ? (winner.wallet + winner.bank) : 0;

        m.reply(
          `🏆 *SEASON RESET!*\n${"═".repeat(24)}\n` +
          `👑 Champion: *${winnerName}*\n` +
          `💰 Final balance: ${fmt(winnerAmt)}\n` +
          `${"═".repeat(24)}\n` +
          `Everyone starts fresh!\n` +
          `_Contact the winner to send their prize._`
        );
        break;
      }

      default:
        break;
    }
  },
};