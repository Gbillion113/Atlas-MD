import fs from "fs";
import mongoose from "mongoose";
import eco from "discord-mongoose-economy";

eco.connect(global.mongodb);

const cooldowns = new Map();
const COOLDOWN_TIME = 30000; // 30 seconds

const playerSchema = new mongoose.Schema({
  id: {
    type: String,
    unique: true,
    required: true,
  },

  name: {
    type: String,
    default: "Player",
  },

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

const player =
  mongoose.models.Player || mongoose.model("Player", playerSchema);

const cara = "cara";

let mergedCommands = [
  "buy",
  "purchase",
  "inventory",
  "inv",
  "mine",
  "hunt",
  "dig",
  "chop",
  "hunt2",
  "reg-inv",
  "register-inv",
  "register",
  "shop",
  "store",
  "sellitem",
  "sellinv",
];

export default {
  name: "others",
  alias: [...mergedCommands],

  uniquecommands: [
    "buy",
    "inventory",
    "mine",
    "hunt",
    "hunt2",
    "register",
    "shop",
    "sellitem",
  ],

  description: "All miscellaneous commands",

  start: async (
    Atlas,
    m,
    { pushName, prefix, inputCMD, doReact, text, args }
  ) => {
    let pic = fs.readFileSync("./Assets/Atlas.jpg");

    let user, inventory;

    switch (inputCMD) {
      case "buy":
      case "purchase":
        await doReact("💰");

        user = await player.findOne({ id: m.sender });

        if (!user)
          return m.reply(
            `You have not registered in RPG yet!\n\nPlease register first by typing *${prefix}register*`
          );

        const balance = await eco.balance(m.sender, cara);

        let item = text;

        if (!item)
          return m.reply(
            `Please provide an item to buy!\n\nExample: *${prefix}buy woodenaxe*`
          );

        const items = {
          woodenaxe: {
            cost: 250,
            field: "woodenaxe",
            name: "Wooden Axe",
          },

          stonepickaxe: {
            cost: 500,
            field: "stonepickaxe",
            name: "Stone Pickaxe",
          },

          ironpickaxe: {
            cost: 2000,
            field: "ironpickaxe",
            name: "Iron Pickaxe",
          },

          diamondpickaxe: {
            cost: 5000,
            field: "diamondpickaxe",
            name: "Diamond Pickaxe",
          },

          goldenapple: {
            cost: 1000,
            field: "goldenApple",
            name: "Golden Apple",
          },

          gold: {
            cost: 1000,
            field: "goldenApple",
            name: "Golden Apple",
          },
        };

        const selectedItem = items[item.toLowerCase()];

        if (!selectedItem)
          return m.reply(
            `😕 Invalid item. Please use ${prefix}shop to see available items.`
          );

        if (balance.wallet < selectedItem.cost)
          return m.reply(
            `You don't have enough money!\n\nYou need *${selectedItem.cost}* coins to buy *${selectedItem.name}*!`
          );

        await eco.deduct(m.sender, cara, selectedItem.cost);

        user.inventory[selectedItem.field] += 1;

        await user.save();

        m.reply(
          `✅ You have successfully bought *1* ${selectedItem.name}!`
        );

        break;

      case "inventory":
      case "inv":
        await doReact("🎒");

        user = await player.findOne({ id: m.sender });

        if (!user)
          return m.reply(
            "You don't have any items yet. Use *register* to get started."
          );

        inventory = user.inventory;

        m.reply(
          `[🐺 INVENTORY 🐺]

🍎 Golden Apple: ${inventory.goldenApple}

🔥 Wood: ${inventory.wood}
🔮 Stone: ${inventory.stone}
⚒ Iron: ${inventory.iron}
💎 Diamonds: ${inventory.diamonds}

🔨 TOOLS 🔨

🪓 Wooden Axe: ${inventory.woodenaxe}
⛏ Stone Pickaxe: ${inventory.stonepickaxe}
⛏ Iron Pickaxe: ${inventory.ironpickaxe}
💠 Diamond Pickaxe: ${inventory.diamondpickaxe}`
        );

        break;

      case "mine":
      case "hunt":
      case "dig":
      case "chop":
        await doReact("⛏");

        user = await player.findOne({ id: m.sender });

        if (!user)
          return m.reply(
            `You have not registered in RPG yet!\n\nPlease register first by typing *${prefix}register*`
          );

        const lastUsed = cooldowns.get(m.sender);

        if (lastUsed && Date.now() - lastUsed < COOLDOWN_TIME) {
          const timeLeft = Math.ceil(
            (COOLDOWN_TIME - (Date.now() - lastUsed)) / 1000
          );

          return m.reply(
            `⏳ Please wait *${timeLeft}s* before mining again.`
          );
        }

        const axeUsed = args[0];

        if (!axeUsed)
          return m.reply(
            `[ 🐺 GO MINE 🐺 ]

Choose a tool:

1. *${prefix}mine woodenaxe*
2. *${prefix}mine stonepickaxe*
3. *${prefix}mine ironpickaxe*
4. *${prefix}mine diamondpickaxe*`
          );

        const validTools = [
          "woodenaxe",
          "stonepickaxe",
          "ironpickaxe",
          "diamondpickaxe",
        ];

        if (!validTools.includes(axeUsed))
          return m.reply(`❌ Invalid tool specified.`);

        if (!user.inventory[axeUsed] || user.inventory[axeUsed] < 1)
          return m.reply(
            `❌ You don't own a ${axeUsed}.\nBuy one with *${prefix}buy ${axeUsed}*`
          );

        const lootTables = {
          woodenaxe: {
            wood: [8, 4],
            stone: [2, 2],
            iron: [1, 1],
            diamonds: [0, 1],
          },

          stonepickaxe: {
            wood: [4, 4],
            stone: [4, 2],
            iron: [2, 1],
            diamonds: [0, 1],
          },

          ironpickaxe: {
            wood: [1, 1],
            stone: [4, 2],
            iron: [4, 1],
            diamonds: [2, 2],
          },

          diamondpickaxe: {
            wood: [0, 1],
            stone: [4, 2],
            iron: [4, 1],
            diamonds: [7, 3],
          },
        };

        const table = lootTables[axeUsed];

        const loot = {
          wood:
            Math.floor(Math.random() * table.wood[1]) +
            table.wood[0],

          stone:
            Math.floor(Math.random() * table.stone[1]) +
            table.stone[0],

          iron:
            Math.floor(Math.random() * table.iron[1]) +
            table.iron[0],

          diamonds:
            Math.floor(Math.random() * table.diamonds[1]) +
            table.diamonds[0],
        };

        user.inventory.wood += loot.wood;
        user.inventory.stone += loot.stone;
        user.inventory.iron += loot.iron;
        user.inventory.diamonds += loot.diamonds;

        let lootMsg = `[ 🐺 MINE RESULT 🐺 ]

⛏ Tool Used: ${axeUsed}

🔥 Wood: ${loot.wood}
🔮 Stone: ${loot.stone}
⚒ Iron: ${loot.iron}
💎 Diamonds: ${loot.diamonds}`;

        if (
          axeUsed === "diamondpickaxe" &&
          Math.random() <= 0.05
        ) {
          user.inventory.goldenApple += 1;

          lootMsg += `

🍎 BONUS:
You found a *Golden Apple!*`;
        }

        cooldowns.set(m.sender, Date.now());

        await user.save();

        m.reply(lootMsg);

        break;

      case "reg-inv":
      case "register-inv":
      case "register":
        await doReact("🔰");

        user = await player.findOne({ id: m.sender });

        if (!user) {
          await player.create({
            id: m.sender,
            name: pushName || "Player",
          });

          m.reply(`✅ You have successfully registered in RPG!`);
        } else {
          m.reply(`⚠️ You are already registered in RPG!`);
        }

        break;

      case "shop":
      case "store":
        await doReact("🛒");

        m.reply(
          `🛍️ 💎 ${global.botName} STORE 💎 🛍️

#1 🪓 Wooden Axe
💰 250 coins
📌 ${prefix}buy woodenaxe

#2 ⛏ Stone Pickaxe
💰 500 coins
📌 ${prefix}buy stonepickaxe

#3 ⛏ Iron Pickaxe
💰 2000 coins
📌 ${prefix}buy ironpickaxe

#4 💠 Diamond Pickaxe
💰 5000 coins
📌 ${prefix}buy diamondpickaxe

#5 🍎 Golden Apple
💰 1000 coins
📌 ${prefix}buy goldenapple`
        );

        break;

      case "sellitem":
      case "sellinv": {
        await doReact("💰");

        const rpgSellPrices = {
          wood: 30,
          stone: 50,
          iron: 150,
          diamonds: 500,
          goldenApple: 5000,
        };

        if (!text) {
          const prices = Object.entries(rpgSellPrices)
            .map(([k, v]) => `${k}: $${v}`)
            .join("\n");

          return m.reply(
            `💰 *RPG Sell Prices:*\n\n${prices}\n\nUsage: *${prefix}sellitem <item> [amount]*`
          );
        }

        const parts = text.split(" ");

        const itemName = parts[0].toLowerCase();

        const amount = parseInt(parts[1]) || 1;

        user = await player.findOne({ id: m.sender });

        if (!user)
          return m.reply(
            `Register first with *${prefix}register*`
          );

        if (!rpgSellPrices[itemName])
          return m.reply(`❌ Can't sell that item!`);

        const owned = user.inventory[itemName] || 0;

        if (owned < amount)
          return m.reply(
            `❌ You only have ${owned}x ${itemName}!`
          );

        const earnings = rpgSellPrices[itemName] * amount;

        user.inventory[itemName] -= amount;

        await user.save();

        const EcoUser = mongoose.models.EcoUser;

        if (EcoUser) {
          const ecoUser = await EcoUser.findOne({
            id: m.sender,
          });

          if (ecoUser) {
            await EcoUser.findOneAndUpdate(
              { id: m.sender },
              {
                wallet: ecoUser.wallet + earnings,
              }
            );
          } else {
            await EcoUser.create({
              id: m.sender,
              wallet: earnings,
            });
          }
        }

        m.reply(
          `✅ Sold *${amount}x ${itemName}* for *$${earnings}*!\n\nCheck your wallet with *${prefix}wallet*`
        );

        break;
      }

      default:
        break;
    }
  },
};