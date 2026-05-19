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
  const diff = Date.now() - new Date(lastTime).getTime();
  return diff < minutes * 60 * 1000;
};

const cooldownLeft = (lastTime, minutes) => {
  const diff = minutes * 60 * 1000 - (Date.now() - new Date(lastTime).getTime());
  const m = Math.floor(diff / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${m}m ${s}s`;
};

const formatNum = (n) => {
  if (n >= 1e9) return `${(n/1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n/1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n/1e3).toFixed(1)}K`;
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

// ─── SHOP ITEMS ─────────────────────────────────────────────
const shopItems = {
  fishingrod: { name: "🎣 Fishing Rod", price: 500, description: "Catch more fish" },
  pickaxe: { name: "⛏️ Pickaxe", price: 800, description: "Dig for better loot" },
  laptop: { name: "💻 Laptop", price: 2000, description: "Work from home" },
  shield: { name: "🛡️ Shield", price: 1500, description: "Protect from robbery" },
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

// ─── MONEY WARS HOOKS ───────────────────────────────────────
// MWUser defined here so this works regardless of plugin load order.
// Mongoose deduplicates — no conflict with moneywars.js.
const MWUserSchema = new mongoose.Schema({
  id:                { type: String, unique: true },
  tier:              { type: String,  default: "free"  },
  tierExpiry:        { type: Date,    default: null     },
  goldenAppleBuff:   { type: Boolean, default: false    },
  goldenAppleShield: { type: Number,  default: 0        },
  seasonEarned:      { type: Number,  default: 0        },
});
const MWUser = mongoose.models.MWUser || mongoose.model("MWUser", MWUserSchema);

const safeApplyDailyBonus = async (id, baseAmount) => {
  try {
    const mwu = await MWUser.findOne({ id });
    if (!mwu) return { amount: baseAmount, appleNote: "", mult: 1 };
    const TIER_MULT = { free: 1, silver: 1, gold: 2, diamond: 3 };
    const mult = TIER_MULT[mwu.tier] ?? 1;
    let amount = baseAmount * mult;
    let appleNote = "";
    if (mwu.goldenAppleBuff) {
      amount *= 2;
      mwu.goldenAppleBuff = false;
      await mwu.save();
      appleNote = "\n🍎 *Golden Apple doubled your daily!*";
    }
    return { amount: Math.floor(amount), appleNote, mult };
  } catch {
    return { amount: baseAmount, appleNote: "", mult: 1 };
  }
};

const safeCheckRobShield = async (targetId, attackerId, Atlas, m) => {
  try {
    const mwTarget = await MWUser.findOne({ id: targetId });
    if (!mwTarget || mwTarget.goldenAppleShield <= 0) return false;
    mwTarget.goldenAppleShield--;
    await mwTarget.save();
    await Atlas.sendMessage(m.from, {
      text:
        `🍎 *Robbery blocked!*\n` +
        `@${targetId.split("@")[0]} had a *Golden Apple shield*!\n` +
        `Shields remaining: ${mwTarget.goldenAppleShield}`,
      mentions: [attackerId, targetId],
    }, { quoted: m });
    return true;
  } catch {
    return false;
  }
};

// ────────────────────────────────────────────────────────────
// Everything below this line is 100% original — unchanged
// ────────────────────────────────────────────────────────────

export default {
  name: "economy",
  alias: [
    "wallet", "bank", "bal", "balance", "daily", "deposit", "dep",
    "withdraw", "wd", "gamble", "slot", "slots", "rob", "leaderboard",
    "lb", "rich", "transfer", "give", "fish", "dig", "beg", "work",
    "shop", "buy", "sell", "inventory", "inv", "capacity", "bankupgrade",
    "flip", "cf",
  ],
  uniquecommands: [
    "wallet", "bank", "daily", "deposit", "withdraw", "gamble",
    "slot", "rob", "leaderboard", "rich", "transfer", "fish",
    "dig", "beg", "work", "shop", "buy", "sell", "inventory",
    "capacity", "flip",
  ],
  description: "Full Economy System",
  start: async (Atlas, m, { prefix, inputCMD, doReact, text, args, mentionByTag, pushName }) => {
    const sender = m.sender;
    const user = await getUser(sender);

    switch (inputCMD) {

      // ─── WALLET ───────────────────────────────────────────
      case "wallet":
      case "bal":
      case "balance": {
        await doReact("💰");
        await sendImg(Atlas, m,
          `💳 *${pushName}'s Balance*\n\n` +
          `💰 Wallet: $${formatNum(user.wallet)}\n` +
          `🏦 Bank: $${formatNum(user.bank)}/$${formatNum(user.bankCapacity)}\n` +
          `💠 Total: $${formatNum(user.wallet + user.bank)}`
        );
        break;
      }

      // ─── BANK ─────────────────────────────────────────────
      case "bank": {
        await doReact("🏦");
        let role = "Broke 😭";
        const total = user.wallet + user.bank;
        if (total >= 1e9) role = "Billionaire 🤑🤑";
        else if (total >= 1e6) role = "Millionaire 🤑";
        else if (total >= 100000) role = "Rich 💰";
        else if (total >= 10000) role = "Average 💸";
        else if (total >= 1000) role = "Poor 😢";
        await sendImg(Atlas, m,
          `🏦 *${pushName}'s Bank*\n\n` +
          `💳 Balance: $${formatNum(user.bank)}/$${formatNum(user.bankCapacity)}\n` +
          `💰 Wallet: $${formatNum(user.wallet)}\n` +
          `👑 Status: ${role}`
        );
        break;
      }

      // ─── DAILY (PATCHED — MW tier multiplier + golden apple) ──
      case "daily": {
        await doReact("📅");
        if (cooldown(user.lastDaily, 24 * 60)) {
          return m.reply(`⏳ Already claimed! Come back in *${cooldownLeft(user.lastDaily, 24 * 60)}*`);
        }
        const lastDate = user.lastDaily ? new Date(user.lastDaily) : null;
        const now = new Date();
        const isStreak = lastDate && (now - lastDate) < 48 * 60 * 60 * 1000;
        const streak = isStreak ? user.streak + 1 : 1;
        const bonus = Math.min(streak * 100, 1000);
        const base = 1000 + bonus;
        // ✅ MW patch: apply tier multiplier + golden apple buff
        const { amount, appleNote, mult } = await safeApplyDailyBonus(sender, base);
        await User.findOneAndUpdate({ id: sender }, { wallet: user.wallet + amount, lastDaily: now, streak });
        m.reply(
          `🎉 *Daily Claimed!*\n\n` +
          `💰 +$${formatNum(amount)}\n` +
          `🔥 Streak: ${streak} day(s)\n` +
          `⭐ Streak Bonus: +$${bonus}` +
          (mult > 1 ? `\n🎖️ Tier multiplier: ×${mult}` : "") +
          appleNote
        );
        break;
      }

      // ─── DEPOSIT ──────────────────────────────────────────
      case "deposit":
      case "dep": {
        await doReact("💵");
        if (!text) return m.reply(`Usage: *${prefix}deposit <amount|all>*`);
        const amt = text.toLowerCase() === "all" ? user.wallet : parseInt(text);
        if (isNaN(amt) || amt <= 0) return m.reply("❌ Invalid amount!");
        if (amt > user.wallet) return m.reply("❌ Not enough in wallet!");
        const space = user.bankCapacity - user.bank;
        if (space <= 0) return m.reply("❌ Bank is full! Upgrade your capacity with `-capacity`");
        const deposit = Math.min(amt, space);
        await User.findOneAndUpdate({ id: sender }, { wallet: user.wallet - deposit, bank: user.bank + deposit });
        await sendImg(Atlas, m, `✅ Deposited *$${formatNum(deposit)}* to bank!\n\n🏦 Bank: $${formatNum(user.bank + deposit)}/$${formatNum(user.bankCapacity)}`);
        break;
      }

      // ─── WITHDRAW ─────────────────────────────────────────
      case "withdraw":
      case "wd": {
        await doReact("💳");
        if (!text) return m.reply(`Usage: *${prefix}withdraw <amount|all>*`);
        const amt = text.toLowerCase() === "all" ? user.bank : parseInt(text);
        if (isNaN(amt) || amt <= 0) return m.reply("❌ Invalid amount!");
        if (amt > user.bank) return m.reply("❌ Not enough in bank!");
        await User.findOneAndUpdate({ id: sender }, { wallet: user.wallet + amt, bank: user.bank - amt });
        await sendImg(Atlas, m, `✅ Withdrew *$${formatNum(amt)}* from bank!\n\n💰 Wallet: $${formatNum(user.wallet + amt)}`);
        break;
      }

      // ─── CAPACITY ─────────────────────────────────────────
      case "capacity":
      case "bankupgrade": {
        await doReact("🏦");
        const upgrades = [
          { level: 1, cost: 5000, increase: 50000, label: "Small ($50K)" },
          { level: 2, cost: 20000, increase: 250000, label: "Medium ($250K)" },
          { level: 3, cost: 100000, increase: 1000000, label: "Large ($1M)" },
          { level: 4, cost: 500000, increase: 5000000, label: "Mega ($5M)" },
        ];
        if (!text) {
          const list = upgrades.map(u => `*Level ${u.level}* — ${u.label} | Cost: $${formatNum(u.cost)}`).join("\n");
          return m.reply(`🏦 *Bank Upgrade*\n\nCurrent Capacity: $${formatNum(user.bankCapacity)}\n\n${list}\n\nUsage: *${prefix}capacity <1-4>*`);
        }
        const level = parseInt(text);
        const upgrade = upgrades.find(u => u.level === level);
        if (!upgrade) return m.reply("❌ Invalid level! Choose 1-4");
        if (user.wallet < upgrade.cost) return m.reply(`❌ Need $${formatNum(upgrade.cost)} in wallet! You have $${formatNum(user.wallet)}`);
        await User.findOneAndUpdate({ id: sender }, { wallet: user.wallet - upgrade.cost, bankCapacity: user.bankCapacity + upgrade.increase });
        m.reply(`✅ Bank upgraded!\n\n🏦 New Capacity: $${formatNum(user.bankCapacity + upgrade.increase)}\n💰 Cost: -$${formatNum(upgrade.cost)}`);
        break;
      }

      // ─── GAMBLE ───────────────────────────────────────────
      case "gamble": {
        await doReact("🎰");
        if (!text) return m.reply(`Usage: *${prefix}gamble <amount> <left/right/up/down>*`);
        const parts = text.split(" ");
        const amt = parseInt(parts[0]);
        const dir = parts[1]?.toLowerCase();
        if (isNaN(amt) || amt < 50) return m.reply("❌ Minimum gamble is $50!");
        if (!dir || !["left","right","up","down"].includes(dir)) return m.reply("❌ Choose: left, right, up, down");
        if (user.wallet < amt) return m.reply("❌ Not enough in wallet!");
        const directions = ["left","right","up","down"];
        const result = directions[Math.floor(Math.random() * directions.length)];
        if (result === dir) {
          await User.findOneAndUpdate({ id: sender }, { wallet: user.wallet + amt });
          await sendImg(Atlas, m, `📈 *You WON!*\n\n+$${formatNum(amt)}\nDirection: ${result}\n💰 Wallet: $${formatNum(user.wallet + amt)}`);
        } else {
          await User.findOneAndUpdate({ id: sender }, { wallet: user.wallet - amt });
          await sendImg(Atlas, m, `📉 *You LOST!*\n\n-$${formatNum(amt)}\nCorrect: ${result}\n💰 Wallet: $${formatNum(user.wallet - amt)}`);
        }
        break;
      }
// ─── COINFLIP ─────────────────────────────────────────
      case "flip":
      case "cf": {
        await doReact("🪙");
        if (!text) return m.reply(`Usage: *${prefix}cf <heads/tails> <amount>*`);
        const parts = text.split(" ");
        const choice = parts[0]?.toLowerCase();
        const amt = parseInt(parts[1]);
        if (!["heads","tails"].includes(choice)) return m.reply("❌ Choose heads or tails!");
        if (isNaN(amt) || amt < 10) return m.reply("❌ Minimum bet is $10!");
        if (user.wallet < amt) return m.reply("❌ Not enough in wallet!");
        const result = Math.random() < 0.5 ? "heads" : "tails";
        if (result === choice) {
          await User.findOneAndUpdate({ id: sender }, { wallet: user.wallet + amt });
          m.reply(`🪙 *${result.toUpperCase()}!*\n\n✅ You won $${formatNum(amt)}!\n💰 Wallet: $${formatNum(user.wallet + amt)}`);
        } else {
          await User.findOneAndUpdate({ id: sender }, { wallet: user.wallet - amt });
          m.reply(`🪙 *${result.toUpperCase()}!*\n\n❌ You lost $${formatNum(amt)}!\n💰 Wallet: $${formatNum(user.wallet - amt)}`);
        }
        break;
      }

      // ─── SLOTS ────────────────────────────────────────────
      case "slot":
      case "slots": {
        await doReact("🎰");
        if (!text || isNaN(parseInt(text))) return m.reply(`Usage: *${prefix}slots <amount>*`);
        const amt = parseInt(text);
        if (amt < 50) return m.reply("❌ Minimum bet is $50!");
        if (user.wallet < amt) return m.reply("❌ Not enough in wallet!");
        const symbols = ["🍎","🍇","🥥","🍍","🍊","💎","7️⃣","⭐"];
        const s1 = symbols[Math.floor(Math.random() * symbols.length)];
        const s2 = symbols[Math.floor(Math.random() * symbols.length)];
        const s3 = symbols[Math.floor(Math.random() * symbols.length)];
        let win = 0, msg = "";
        if (s1 === s2 && s2 === s3) {
          if (s1 === "💎") { win = amt * 10; msg = "💎 *DIAMOND JACKPOT!*"; }
          else if (s1 === "7️⃣") { win = amt * 7; msg = "7️⃣ *LUCKY SEVENS!*"; }
          else if (s1 === "⭐") { win = amt * 5; msg = "⭐ *STAR JACKPOT!*"; }
          else { win = amt * 3; msg = "🎉 *JACKPOT!*"; }
        } else if (s1 === s2 || s2 === s3 || s1 === s3) {
          win = Math.floor(amt * 0.5);
          msg = "✅ *Small Win!*";
        } else {
          win = -amt;
          msg = "❌ *No Match!*";
        }
        await User.findOneAndUpdate({ id: sender }, { wallet: user.wallet + win });
        m.reply(`🎰 [ ${s1} | ${s2} | ${s3} ]\n\n${msg}\n${win > 0 ? `+$${formatNum(win)}` : `-$${formatNum(Math.abs(win))}`}\n💰 Wallet: $${formatNum(user.wallet + win)}`);
        break;
      }

      // ─── ROB (PATCHED — MW golden apple shield check) ─────
      case "rob": {
        await doReact("🦹");
        const target = m.quoted ? m.quoted.sender : mentionByTag?.[0];
        if (!target) return m.reply(`Usage: *${prefix}rob @user*`);
        if (target === sender) return m.reply("❌ You can't rob yourself!");
        const targetUser = await getUser(target);
        // ✅ MW patch: check golden apple shield before anything else
        const blocked = await safeCheckRobShield(target, sender, Atlas, m);
        if (blocked) break;
        const hasShield = targetUser.inventory?.shield > 0;
        if (hasShield) {
          targetUser.inventory.shield -= 1;
          await User.findOneAndUpdate({ id: target }, { inventory: targetUser.inventory });
          return await Atlas.sendMessage(m.from, { text: `🛡️ @${target.split("@")[0]} had a shield! Your robbery failed!`, mentions: [sender, target] }, { quoted: m });
        }
        if (targetUser.wallet < 100) return m.reply("❌ Target is too broke to rob!");
        if (user.wallet < 100) return m.reply("❌ You need at least $100 to attempt a robbery!");
        const chance = Math.random();
        const amount = Math.floor(Math.random() * Math.min(targetUser.wallet * 0.3, 5000)) + 100;
        if (chance < 0.4) {
          await User.findOneAndUpdate({ id: sender }, { wallet: user.wallet - 200 });
          await Atlas.sendMessage(m.from, { text: `👮 You got caught! Paid $200 fine.\n💰 Wallet: $${formatNum(user.wallet - 200)}`, mentions: [sender] }, { quoted: m });
        } else if (chance < 0.7) {
          return await Atlas.sendMessage(m.from, { text: `😅 You chickened out!`, mentions: [sender] }, { quoted: m });
        } else {
          await User.findOneAndUpdate({ id: sender }, { wallet: user.wallet + amount });
          await User.findOneAndUpdate({ id: target }, { wallet: targetUser.wallet - amount });
          await Atlas.sendMessage(m.from, { text: `🤑 Robbed @${target.split("@")[0]} for $${formatNum(amount)}!\n💰 Wallet: $${formatNum(user.wallet + amount)}`, mentions: [sender, target] }, { quoted: m });
        }
        break;
      }

      // ─── TRANSFER ─────────────────────────────────────────
      case "transfer":
      case "give": {
        await doReact("💸");
        const target = m.quoted ? m.quoted.sender : mentionByTag?.[0];
        if (!target || !text) return m.reply(`Usage: *${prefix}transfer <amount> @user*`);
        if (target === sender) return m.reply("❌ Can't transfer to yourself!");
        const amt = parseInt(text.split(" ")[0]);
        if (isNaN(amt) || amt <= 0) return m.reply("❌ Invalid amount!");
        if (user.wallet < amt) return m.reply("❌ Not enough in wallet!");
        await User.findOneAndUpdate({ id: sender }, { wallet: user.wallet - amt });
        const targetUser = await getUser(target);
        await User.findOneAndUpdate({ id: target }, { wallet: targetUser.wallet + amt });
        await Atlas.sendMessage(m.from, { text: `💸 Transferred *$${formatNum(amt)}* to @${target.split("@")[0]}!`, mentions: [sender, target] }, { quoted: m });
        break;
      }

      // ─── FISH ─────────────────────────────────────────────
      case "fish": {
        await doReact("🎣");
        if (cooldown(user.lastFish, 5)) return m.reply(`⏳ Fishing cooldown! Wait *${cooldownLeft(user.lastFish, 5)}*`);
        const catches = [
          { item: "fish", name: "🐟 Fish", chance: 0.5 },
          { item: "rarefish", name: "🐠 Rare Fish", chance: 0.3 },
          { item: "legendaryfish", name: "🐉 Legendary Fish", chance: 0.1 },
          { item: null, name: "👢 Old Boot", chance: 0.1 },
        ];
        const roll = Math.random();
        let cumulative = 0;
        let caught = catches[0];
        for (const c of catches) { cumulative += c.chance; if (roll < cumulative) { caught = c; break; } }
        await User.findOneAndUpdate({ id: sender }, { lastFish: new Date(), inventory: { ...user.inventory, [caught.item]: (user.inventory?.[caught.item] || 0) + (caught.item ? 1 : 0) } });
        if (caught.item) {
          m.reply(`🎣 You caught a *${caught.name}*!\n\nSell it with *${prefix}sell ${caught.item}*\n💰 Sell price: $${formatNum(sellPrices[caught.item])}`);
        } else {
          m.reply(`🎣 You caught an *${caught.name}*... better luck next time!`);
        }
        break;
      }

      // ─── DIG ──────────────────────────────────────────────
      case "dig": {
        await doReact("⛏️");
        if (cooldown(user.lastDig, 10)) return m.reply(`⏳ Digging cooldown! Wait *${cooldownLeft(user.lastDig, 10)}*`);
        const finds = [
          { item: "stone", name: "🪨 Stone", chance: 0.4 },
          { item: "iron", name: "⚙️ Iron", chance: 0.3 },
          { item: "gold", name: "🥇 Gold", chance: 0.2 },
          { item: "diamond", name: "💎 Diamond", chance: 0.1 },
        ];
        const roll = Math.random();
        let cumulative = 0;
        let found = finds[0];
        for (const f of finds) { cumulative += f.chance; if (roll < cumulative) { found = f; break; } }
        await User.findOneAndUpdate({ id: sender }, { lastDig: new Date(), inventory: { ...user.inventory, [found.item]: (user.inventory?.[found.item] || 0) + 1 } });
        m.reply(`⛏️ You found *${found.name}*!\n\nSell it with *${prefix}sell ${found.item}*\n💰 Sell price: $${formatNum(sellPrices[found.item])}`);
        break;
      }

      // ─── BEG ──────────────────────────────────────────────
      case "beg": {
        await doReact("🙏");
        if (cooldown(user.lastBeg, 2)) return m.reply(`⏳ Begging cooldown! Wait *${cooldownLeft(user.lastBeg, 2)}*`);
        const responses = [
          { text: "A kind stranger gave you", amt: true },
          { text: "Grandma felt sorry and gave you", amt: true },
          { text: "Someone threw coins at you worth", amt: true },
          { text: "Nobody cared. You got nothing.", amt: false },
          { text: "A child gave you their lunch money worth", amt: true },
        ];
        const response = responses[Math.floor(Math.random() * responses.length)];
        if (response.amt) {
          const amount = Math.floor(Math.random() * 200) + 10;
          await User.findOneAndUpdate({ id: sender }, { wallet: user.wallet + amount, lastBeg: new Date() });
          m.reply(`🙏 ${response.text} *$${amount}*!\n💰 Wallet: $${formatNum(user.wallet + amount)}`);
        } else {
          await User.findOneAndUpdate({ id: sender }, { lastBeg: new Date() });
          m.reply(`🙏 ${response.text}`);
        }
        break;
      }

      // ─── WORK ─────────────────────────────────────────────
      case "work": {
        await doReact("💼");
        if (cooldown(user.lastWork, 60)) return m.reply(`⏳ Work cooldown! Wait *${cooldownLeft(user.lastWork, 60)}*`);
        const jobs = [
          "You worked as a *Developer* and earned",
          "You delivered *Pizza* and earned",
          "You drove *Uber* and earned",
          "You worked as a *Teacher* and earned",
          "You fixed *computers* and earned",
          "You sold *lemonade* and earned",
        ];
        const job = jobs[Math.floor(Math.random() * jobs.length)];
        const hasLaptop = user.inventory?.laptop > 0;
        const amount = Math.floor(Math.random() * 500) + 200 + (hasLaptop ? 300 : 0);
        await User.findOneAndUpdate({ id: sender }, { wallet: user.wallet + amount, lastWork: new Date() });
        m.reply(`💼 ${job} *$${formatNum(amount)}*!${hasLaptop ? "\n💻 Laptop bonus applied!" : ""}\n💰 Wallet: $${formatNum(user.wallet + amount)}`);
        break;
      }

      // ─── SELL ─────────────────────────────────────────────
      case "sell": {
        await doReact("💰");
        if (!text) {
          const prices = Object.entries(sellPrices).map(([k,v]) => `${k}: $${formatNum(v)}`).join("\n");
          return m.reply(`💰 *Sell Prices:*\n\n${prices}\n\nUsage: *${prefix}sell <item> [amount]*`);
        }
        const parts = text.split(" ");
        const itemName = parts[0].toLowerCase();
        const amount = parseInt(parts[1]) || 1;
        if (!sellPrices[itemName]) return m.reply(`❌ Can't sell that! Use *${prefix}sell* to see sellable items`);
        const owned = user.inventory?.[itemName] || 0;
        if (owned < amount) return m.reply(`❌ You only have ${owned}x ${itemName}!`);
        const earnings = sellPrices[itemName] * amount;
        const newInventory = { ...user.inventory, [itemName]: owned - amount };
        await User.findOneAndUpdate({ id: sender }, { wallet: user.wallet + earnings, inventory: newInventory });
        m.reply(`✅ Sold *${amount}x ${itemName}* for *$${formatNum(earnings)}*!\n💰 Wallet: $${formatNum(user.wallet + earnings)}`);
        break;
      }

      // ─── SHOP ─────────────────────────────────────────────
      case "shop": {
        await doReact("🛍️");
        const list = Object.entries(shopItems).map(([k,v]) => `▪️ *${v.name}* — $${formatNum(v.price)}\n   ${v.description}\n   Buy: *${prefix}buy ${k}*`).join("\n\n");
        m.reply(`🛍️ *Economy Shop*\n\n${list}`);
        break;
      }

      // ─── BUY ──────────────────────────────────────────────
      case "buy": {
        await doReact("🛒");
        if (!text) return m.reply(`Usage: *${prefix}buy <item>*\n\nSee items: *${prefix}shop*`);
        const itemKey = text.toLowerCase().trim();
        const item = shopItems[itemKey];
        if (!item) return m.reply(`❌ Item not found! See *${prefix}shop*`);
        if (user.wallet < item.price) return m.reply(`❌ Need $${formatNum(item.price)}! You have $${formatNum(user.wallet)}`);
        const newInventory = { ...user.inventory, [itemKey]: (user.inventory?.[itemKey] || 0) + 1 };
        await User.findOneAndUpdate({ id: sender }, { wallet: user.wallet - item.price, inventory: newInventory });
        m.reply(`✅ Bought *${item.name}* for *$${formatNum(item.price)}*!\n💰 Wallet: $${formatNum(user.wallet - item.price)}`);
        break;
      }

      // ─── INVENTORY ────────────────────────────────────────
      case "inventory":
      case "inv": {
        await doReact("🎒");
        const inv = user.inventory || {};
        const items = Object.entries(inv).filter(([,v]) => v > 0);
        if (!items.length) return m.reply("🎒 Your inventory is empty!\n\nUse `-fish`, `-dig`, or `-buy` to get items");
        const list = items.map(([k,v]) => `▪️ ${k}: ${v}x${sellPrices[k] ? ` (worth $${formatNum(sellPrices[k])} each)` : ""}`).join("\n");
        m.reply(`🎒 *${pushName}'s Inventory*\n\n${list}`);
        break;
      }

      // ─── LEADERBOARD ──────────────────────────────────────
      case "leaderboard":
      case "lb":
      case "rich": {
        await doReact("📊");
        const top = await User.find().sort({ bank: -1 }).limit(10);
        if (!top.length) return m.reply("No users yet!");
        let str = `💰 *Economy Leaderboard*\n\n`;
        for (let i = 0; i < top.length; i++) {
          str += `*${i+1}.* ${top[i].id.split("@")[0]}\n   💰 $${formatNum(top[i].wallet + top[i].bank)}\n`;
        }
        m.reply(str);
        break;
      }

      default:
        break;
    }
  },
};