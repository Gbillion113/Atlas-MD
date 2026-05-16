import fs from "fs";
import eco from "discord-mongoose-economy";
import { userData } from "../System/MongoDB/MongoDb_Schema.js";

const ty = eco.connect(global.mongodb);
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
    const debitCard = fs.readFileSync("./Assets/card.png");
    const pushname = pushName || `${global.botName} User`;
    let user, balance, value, k, a, twice, num, balance1, balance2, user1, user2;

    switch (inputCMD) {
      case "bank":
        await doReact("🏦");
        user = m.sender;
        balance = await eco.balance(user, cara);
        var role = "brokie😭";
        if (balance.bank <= 1000) role = "broke😭";
        else if (balance.bank <= 10000) role = "Poor😢";
        else if (balance.bank <= 50000) role = "Average💸";
        else if (balance.bank <= 1000000) role = "Rich💸💰";
        else if (balance.bank <= 10000000) role = "Millionaire🤑";
        else if (balance.bank <= 90000000) role = "Billionaire🤑🤑";
        await Atlas.sendMessage(m.from, {
          image: debitCard,
          caption: `\n🏦 *${pushname}'s Bank*:\n\n🪙 Balance: ${balance.bank}/${balance.bankCapacity}\n\n\n*Wealth: ${role}*\n`,
        }, { quoted: m });
        break;

      case "daily":
        await doReact("📊");
        if (!m.isGroup) return m.reply("This command can only be used in groups!");
        user = m.sender;
        const daily = await eco.daily(user, cara, 1000);
        if (daily.cd) {
          await m.reply(`🧧 You already claimed your daily revenue today, Come back in ${daily.cdL} to claim again 🫡`);
        } else {
          await m.reply(`You have Successfully claimed your daily revenue ${daily.amount} 💴 today 🎉.`);
        }
        break;

      case "deposit":
        await doReact("💵");
        if (!text) return m.reply(`Please provide an amount to deposit !\n\nExample: *${prefix}deposit 1000*`);
        user = m.sender;
        num = parseInt(text);
        const deposit = await eco.deposit(user, cara, num);
        if (deposit.noten) return m.reply(`*Your Deposit amount should be less than or equal to your wallet balance!*`);
        await Atlas.sendMessage(m.from, {
          image: debitCard,
          caption: `\n⛩️ Sender: ${m.pushName}\n\n🍀Successfully Deposited 💴 ${deposit.amount} to your bank.\n`,
        }, { quoted: m });
        break;

      case "gamble":
        await doReact("🎰");
        user = m.sender;
        if (!text) return m.reply(`Usage: *${prefix}gamble 100 left/right/up/down*`);
        var texts = text.split(" ");
        var opp = texts[1];
        value = texts[0].toLowerCase();
        var gg = parseInt(value);
        balance = await eco.balance(user, cara);
        twice = gg * 2;
        const directions = ["up", "right", "left", "down"];
        const r = directions[Math.floor(Math.random() * directions.length)];
        if (!opp) return m.reply("*Specify the direction you are betting on!*");
        if (balance.wallet < gg) return m.reply(`*You don't have sufficient 🪙 to gamble with*`);
        if (gg < 50) return m.reply(`*Sorry, you can only gamble with more than 🪙50.*`);
        if (r == opp) {
          await eco.give(user, cara, twice);
          await Atlas.sendMessage(m.from, { image: debitCard, caption: `*📈 You won 💴 ${twice}*` }, { quoted: m });
        } else {
          await eco.deduct(user, cara, gg);
          await m.reply(`*📉 You lost 💴 ${gg}*`);
        }
        break;

      case "leaderboard":
      case "lb":
        await doReact("📊");
        try {
          let h = await eco.lb("cara", 10);
          if (h.length === 0) return Atlas.sendMessage(m.from, { text: "No users found on leaderboard." }, { quoted: m });
          let str = `*[ ${global.botName} Leaderboard ]*\n\n`;
          let arr = [];
          for (let i = 0; i < h.length; i++) {
            str += `*${i + 1}*\n╭─────────────◆\n│ *💳 Wallet:-* _${h[i].wallet}_\n│ *📄 Bank:-* _${h[i].bank}_\n╰─────────────◆\n\n`;
            arr.push(h[i].userID);
          }
          await Atlas.sendMessage(m.from, { text: str, mentions: arr }, { quoted: m });
        } catch (err) {
          return Atlas.sendMessage(m.from, { text: `An error occurred while fetching the leaderboard.` }, { quoted: m });
        }
        break;

      case "rob":
        await doReact("💶");
        if (!text) return m.reply(`Please specify the user you want to rob!\n\nExample: *${prefix}rob @user*`);
        var mentionedUser = m.quoted ? m.quoted.sender : mentionByTag[0];
        user1 = m.sender;
        user2 = mentionedUser;
        k = 100;
        const amount = Math.floor(Math.random() * 200) + 1;
        balance1 = await eco.balance(user1, cara);
        balance2 = await eco.balance(user2, cara);
        if (balance1.wallet < k) return m.reply(`*☹️ You don't have enough money to pay fine incase you get caught*`);
        if (balance2.wallet < k) return m.reply(`*☹️ Your target doesn't have enough money to rob*`);
        const robResult = Math.random();
        if (robResult < 0.33) {
          return m.reply(`*Lets leave this poor soul alone.*`);
        } else if (robResult < 0.66) {
          await eco.deduct(user2, cara, amount);
          await eco.give(user1, cara, amount);
          return m.reply(`*🤑 You robbed and got away with 💴 ${amount}*`);
        } else {
          await eco.deduct(user1, cara, balance1.wallet);
          return m.reply(`*☹️ You got caught and paid a fine of 💴 ${balance1.wallet}*`);
        }

      case "slot":
        await doReact("🎰");
        user = m.sender;
        balance1 = await eco.balance(user, cara);
        if (balance1.wallet < 100) return m.reply(`You need at least 🪙100 in your wallet to play!`);
        const fruits = ["🍎", "🍇", "🥥", "🍍"];
        const f1 = fruits[Math.floor(Math.random() * fruits.length)];
        const f2 = fruits[Math.floor(Math.random() * fruits.length)];
        const f3 = fruits[Math.floor(Math.random() * fruits.length)];
        if (f1 == f2 && f2 == f3) {
          await eco.give(user, cara, 100);
          m.reply(`🎰 ${f1}+${f2}+${f3}\n\n*Big Win --> 🪙100*`);
        } else if (f1 == f2 || f2 == f3) {
          await eco.give(user, cara, 20);
          m.reply(`🎰 ${f1}-${f2}-${f3}\n\n*Small Win --> 🪙20*`);
        } else {
          await eco.deduct(user, cara, 50);
          m.reply(`🎰 ${f1}-${f2}-${f3}\n\n*You Lost --> 🪙50*`);
        }
        break;

      case "wallet":
        await doReact("💲");
        user = m.sender;
        balance = await eco.balance(user, cara);
        await Atlas.sendMessage(m.from, {
          image: debitCard,
          caption: `\n💳 *${m.pushName}'s Wallet:*\n\n_💴 ${balance.wallet}_`,
        }, { quoted: m });
        break;

      case "withdraw":
        await doReact("💳");
        if (!text) return m.reply(`*Provide the amount you want to withdraw!*`);
        user = m.sender;
        const withdraw = await eco.withdraw(user, cara, text.trim());
        if (withdraw.noten) return m.reply("*🏧 Insufficient fund in bank*");
        await eco.give(user, cara, text.trim());
        Atlas.sendMessage(m.from, {
          image: debitCard,
          caption: `*🏧 ALERT* _💶 ${withdraw.amount} has been added in your wallet._`,
        }, { quoted: m });
        break;

      case "transfer":
        await doReact("💴");
        if (!text) return m.reply(`Use ${prefix}transfer 100 @user`);
        var mentionedUser2 = m.quoted ? m.quoted.sender : mentionByTag[0];
        user1 = m.sender;
        user2 = mentionedUser2;
        const transferAmount = parseInt(text.split(" ")[0]);
        if (!transferAmount) return m.reply("Please provide a valid amount!");
        balance = await eco.balance(user1, cara);
        if (balance.wallet < transferAmount) return m.reply("You don't have sufficient money to transfer👎");
        await eco.deduct(user1, cara, transferAmount);
        await eco.give(user2, cara, transferAmount);
        await Atlas.sendMessage(m.from, {
          image: debitCard,
          caption: `*📠 Transaction successful of ${transferAmount} 💷*`,
        }, { quoted: m });
        break;

      default:
        break;
    }
  },
};