import fs from "fs";
import eco from "discord-mongoose-economy";

eco.connect(global.mongodb);
const cara = "cara";

let mergedCommands = [
  "bank", "capacity", "daily", "deposit", "gamble",
  "leaderboard", "lb", "rob", "slot", "transfer", "wallet", "withdraw",
];

export default {
  name: "economy",
  alias: [...mergedCommands],
  uniquecommands: [
    "bank", "capacity", "daily", "deposit", "gamble",
    "leaderboard", "rob", "slot", "transfer", "wallet", "withdraw",
  ],
  description: "All Economy / Gambling related commands",
  start: async (Atlas, m, { pushName, prefix, inputCMD, doReact, text, args, mentionByTag }) => {
    let debitCard;
    try { debitCard = fs.readFileSync("./Assets/card.png"); } catch { debitCard = null; }
    const pushname = pushName || "User";
    let user, balance, value, k, twice, num, balance1, balance2, user1, user2;

    const sendImg = async (caption) => {
      if (debitCard) {
        await Atlas.sendMessage(m.from, { image: debitCard, caption }, { quoted: m });
      } else {
        await m.reply(caption);
      }
    };

    switch (inputCMD) {
      case "bank":
        await doReact("🏦");
        user = m.sender;
        balance = await eco.balance(user, cara);
        var role = "Brokie😭";
        if (balance.bank <= 1000) role = "Broke😭";
        else if (balance.bank <= 10000) role = "Poor😢";
        else if (balance.bank <= 50000) role = "Average💸";
        else if (balance.bank <= 1000000) role = "Rich💰";
        else if (balance.bank <= 10000000) role = "Millionaire🤑";
        else role = "Billionaire🤑🤑";
        await sendImg(`\n🏦 *${pushname}'s Bank*\n\n🪙 Balance: ${balance.bank}/${balance.bankCapacity}\n\n*Wealth: ${role}*`);
        break;

      case "wallet":
        await doReact("💲");
        user = m.sender;
        balance = await eco.balance(user, cara);
        await sendImg(`\n💳 *${pushname}'s Wallet*\n\n💴 ${balance.wallet} coins`);
        break;

      case "daily":
        await doReact("📊");
        user = m.sender;
        const daily = await eco.daily(user, cara, 1000);
        if (daily.cd) {
          await m.reply(`🧧 Already claimed today! Come back in *${daily.cdL}* 🫡`);
        } else {
          await m.reply(`🎉 You claimed your daily reward of *${daily.amount}* coins!`);
        }
        break;

      case "deposit":
        await doReact("💵");
        if (!text) return m.reply(`Please provide an amount!\n\nExample: *${prefix}deposit 1000*`);
        user = m.sender;
        num = parseInt(text);
        if (isNaN(num)) return m.reply("Please provide a valid number!");
        const deposit = await eco.deposit(user, cara, num);
        if (deposit.noten) return m.reply(`*Your deposit amount exceeds your wallet balance!*`);
        await sendImg(`✅ Successfully deposited *${deposit.amount}* coins to your bank!`);
        break;

      case "withdraw":
        await doReact("💳");
        if (!text) return m.reply(`Please provide an amount!\n\nExample: *${prefix}withdraw 1000*`);
        user = m.sender;
        const withdraw = await eco.withdraw(user, cara, text.trim());
        if (withdraw.noten) return m.reply("*🏧 Insufficient funds in bank!*");
        await eco.give(user, cara, parseInt(text.trim()));
        await sendImg(`*🏧 ${withdraw.amount} coins* added to your wallet!`);
        break;

      case "gamble":
        await doReact("🎰");
        user = m.sender;
        if (!text) return m.reply(`Usage: *${prefix}gamble 100 left/right/up/down*`);
        var gTexts = text.split(" ");
        var opp = gTexts[1];
        var gg = parseInt(gTexts[0]);
        if (isNaN(gg)) return m.reply("Please provide a valid amount!");
        if (!opp) return m.reply("*Specify direction: left/right/up/down*");
        if (gg < 50) return m.reply(`*Minimum gamble amount is 🪙50*`);
        balance = await eco.balance(user, cara);
        if (balance.wallet < gg) return m.reply(`*You don't have enough coins!*`);
        twice = gg * 2;
        const directions = ["up", "right", "left", "down"];
        const r = directions[Math.floor(Math.random() * directions.length)];
        if (r === opp) {
          await eco.give(user, cara, twice);
          await sendImg(`*📈 You won 💴 ${twice} coins!*`);
        } else {
          await eco.deduct(user, cara, gg);
          await m.reply(`*📉 You lost 💴 ${gg} coins! The direction was ${r}*`);
        }
        break;

      case "slot":
        await doReact("🎰");
        user = m.sender;
        balance1 = await eco.balance(user, cara);
        if (balance1.wallet < 100) return m.reply(`You need at least 🪙100 to play slots!`);
        const fruits = ["🍎", "🍇", "🥥", "🍍", "🍊"];
        const s1 = fruits[Math.floor(Math.random() * fruits.length)];
        const s2 = fruits[Math.floor(Math.random() * fruits.length)];
        const s3 = fruits[Math.floor(Math.random() * fruits.length)];
        if (s1 === s2 && s2 === s3) {
          await eco.give(user, cara, 500);
          m.reply(`🎰 [ ${s1} | ${s2} | ${s3} ]\n\n🎉 *JACKPOT! +🪙500*`);
        } else if (s1 === s2 || s2 === s3 || s1 === s3) {
          await eco.give(user, cara, 20);
          m.reply(`🎰 [ ${s1} | ${s2} | ${s3} ]\n\n✅ *Small Win! +🪙20*`);
        } else {
          await eco.deduct(user, cara, 50);
          m.reply(`🎰 [ ${s1} | ${s2} | ${s3} ]\n\n❌ *You Lost -🪙50*`);
        }
        break;

      case "rob":
        await doReact("💶");
        if (!text && !m.quoted) return m.reply(`Please tag someone to rob!\n\nExample: *${prefix}rob @user*`);
        var robTarget = m.quoted ? m.quoted.sender : (mentionByTag ? mentionByTag[0] : null);
        if (!robTarget) return m.reply("Please tag someone to rob!");
        user1 = m.sender;
        user2 = robTarget;
        balance1 = await eco.balance(user1, cara);
        balance2 = await eco.balance(user2, cara);
        if (balance1.wallet < 100) return m.reply(`*You need at least 🪙100 to attempt a robbery!*`);
        if (balance2.wallet < 100) return m.reply(`*Your target is too broke to rob!*`);
        const robAmount = Math.floor(Math.random() * 200) + 1;
        const robChance = Math.random();
        if (robChance < 0.33) {
          return m.reply(`*😅 You chickened out!*`);
        } else if (robChance < 0.66) {
          await eco.deduct(user2, cara, robAmount);
          await eco.give(user1, cara, robAmount);
          return m.reply(`*🤑 You robbed and got away with 💴 ${robAmount} coins!*`);
        } else {
          await eco.deduct(user1, cara, 100);
          return m.reply(`*☹️ You got caught and paid a fine of 💴 100 coins!*`);
        }

      case "transfer":
        await doReact("💴");
        if (!text) return m.reply(`Usage: *${prefix}transfer 100 @user*`);
        var transTarget = m.quoted ? m.quoted.sender : (mentionByTag ? mentionByTag[0] : null);
        if (!transTarget) return m.reply("Please tag someone to transfer to!");
        user1 = m.sender;
        user2 = transTarget;
        const transAmount = parseInt(text.split(" ")[0]);
        if (isNaN(transAmount)) return m.reply("Please provide a valid amount!");
        balance = await eco.balance(user1, cara);
        if (balance.wallet < transAmount) return m.reply("*You don't have enough coins!*");
        await eco.deduct(user1, cara, transAmount);
        await eco.give(user2, cara, transAmount);
        await sendImg(`*📠 Successfully transferred ${transAmount} coins!*`);
        break;

      case "leaderboard":
      case "lb":
        await doReact("📊");
        try {
          let h = await eco.lb("cara", 10);
          if (!h || h.length === 0) return m.reply("No users on leaderboard yet!");
          let str = `*💰 Economy Leaderboard 💰*\n\n`;
          for (let i = 0; i < h.length; i++) {
            str += `*${i + 1}.* Wallet: ${h[i].wallet} | Bank: ${h[i].bank}\n`;
          }
          await Atlas.sendMessage(m.from, { text: str }, { quoted: m });
        } catch (err) {
          return m.reply(`Error fetching leaderboard: ${err.message}`);
        }
        break;

      default:
        break;
    }
  },
};