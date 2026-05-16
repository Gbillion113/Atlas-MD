import fs from "fs";
import mongoose from "mongoose";
import eco from "discord-mongoose-economy";

eco.connect(global.mongodb);

const playerSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  name: { type: String },
  inventory: {
    wood: { type: Number, required: true },
    stone: { type: Number, required: true },
    iron: { type: Number, required: true },
    diamonds: { type: Number, required: true },
    goldenApple: { type: Number, required: true },
    diamondpickaxe: { type: Number, required: true },
    ironpickaxe: { type: Number, required: true },
    stonepickaxe: { type: Number, required: true },
    woodenaxe: { type: Number, required: true },
  },
});

const player = mongoose.models.Player || mongoose.model("Player", playerSchema);
const cara = "cara";

let mergedCommands = [
  "buy", "purchase", "inventory", "inv", "mine",
  "hunt", "dig", "chop", "hunt2", "reg-inv",
  "register-inv", "register", "shop", "store",
];

export default {
  name: "others",
  alias: [...mergedCommands],
  uniquecommands: ["buy", "inventory", "mine", "hunt", "hunt2", "register", "shop"],
  description: "All miscellaneous commands",
  start: async (Atlas, m, { pushName, prefix, inputCMD, doReact, text, args }) => {
    let pic = fs.readFileSync("./Assets/Atlas.jpg");
    let user, inventory;

    switch (inputCMD) {
      case "buy":
      case "purchase":
        await doReact("💰");
        user = await player.findOne({ id: m.sender });
        if (!user) return m.reply(`You have not registered in RPG yet!\n\nPlease register first by typing *${prefix}register*`);
        const balance = await eco.balance(m.sender, cara);
        let item = text;
        if (!item) return m.reply(`Please provide an item to buy!\n\nExample: *${prefix}buy woodenaxe*`);
        const items = {
          woodenaxe: { cost: 250, field: "woodenaxe", name: "Wooden Axe" },
          stonepickaxe: { cost: 500, field: "stonepickaxe", name: "Stone Pickaxe" },
          ironpickaxe: { cost: 2000, field: "ironpickaxe", name: "Iron Pickaxe" },
          diamondpickaxe: { cost: 5000, field: "diamondpickaxe", name: "Diamond Pickaxe" },
          goldenapple: { cost: 1000, field: "goldenApple", name: "Golden Apple" },
          gold: { cost: 1000, field: "goldenApple", name: "Golden Apple" },
        };
        const selectedItem = items[item.toLowerCase()];
        if (!selectedItem) return m.reply(`😕 Invalid item. Please use ${prefix}shop to see available items.`);
        if (balance.wallet < selectedItem.cost) return m.reply(`You don't have enough money!\n\nYou need *${selectedItem.cost}* coins to buy *${selectedItem.name}*!`);
        await eco.deduct(m.sender, cara, selectedItem.cost);
        user.inventory[selectedItem.field] += 1;
        await user.save();
        m.reply(`You have successfully bought *1* ${selectedItem.name}!`);
        break;

      case "inventory":
      case "inv":
        await doReact("🔰");
        user = await player.findOne({ id: m.sender });
        if (!user) return m.reply("You don't have any items yet. Use *register* to get started.");
        inventory = user.inventory;
        m.reply(`[🐺 INVENTORY 🐺]\n\n*🍎 Golden Apple*: ${inventory.goldenApple}\n*🔥 Wood*: ${inventory.wood}\n*🔮 Stone*: ${inventory.stone}\n*⚒ Iron*: ${inventory.iron}\n*💎 Diamonds*: ${inventory.diamonds}\n\n*🔨 Tools 🔨*\n\n*Wooden Axe*: ${inventory.woodenaxe}\n*Iron Pickaxe*: ${inventory.ironpickaxe}\n*Stone Pickaxe*: ${inventory.stonepickaxe}\n*Diamond Pickaxe*: ${inventory.diamondpickaxe}`);
        break;

      case "mine":
      case "hunt":
      case "dig":
      case "chop":
        await doReact("🔨");
        user = await player.findOne({ id: m.sender });
        if (!user) return m.reply(`You have not registered in RPG yet!\n\nPlease register first by typing *${prefix}register*`);
        m.reply(`[🐺 Go Hunt 🐺]\n\n_Please select a tool to hunt with_\n\n_*1. ${prefix}hunt2 woodenaxe*_\n_*2. ${prefix}hunt2 ironpickaxe*_\n_*3. ${prefix}hunt2 stonepickaxe*_\n_*4. ${prefix}hunt2 diamondpickaxe*_`);
        break;

      case "hunt2":
        await doReact("🔨");
        user = await player.findOne({ id: m.sender });
        if (!user) return m.reply(`You have not registered in RPG yet!\n\nPlease register first by typing *${prefix}register*`);
        inventory = user.inventory;
        const axeUsed = args[0];
        if (!axeUsed) return m.reply(`😕 You need to specify which tool to use.`);
        if (!user.inventory[axeUsed] || user.inventory[axeUsed] < 1) return m.reply(`😕 You don't have a ${axeUsed}. Use ${prefix}buy to purchase one.`);
        let loot;
        const lootTables = {
          woodenaxe: { wood: [8,4], stone: [2,2], iron: [1,1], diamonds: [0,1] },
          stonepickaxe: { wood: [4,4], stone: [4,2], iron: [2,1], diamonds: [0,1] },
          ironpickaxe: { wood: [1,1], stone: [4,2], iron: [4,1], diamonds: [2,1] },
          diamondpickaxe: { wood: [0,1], stone: [4,2], iron: [4,1], diamonds: [7000,1001] },
        };
        const table = lootTables[axeUsed];
        if (!table) return m.reply(`😕 Invalid tool specified.`);
        loot = {
          wood: Math.floor(Math.random() * table.wood[1]) + table.wood[0],
          stone: Math.floor(Math.random() * table.stone[1]) + table.stone[0],
          iron: Math.floor(Math.random() * table.iron[1]) + table.iron[0],
          diamonds: Math.floor(Math.random() * table.diamonds[1]) + table.diamonds[0],
        };
        user.inventory[axeUsed] -= 1;
        user.inventory.wood += loot.wood;
        user.inventory.stone += loot.stone;
        user.inventory.iron += loot.iron;
        user.inventory.diamonds += loot.diamonds;
        let lootMsg = `[ 🐺 MINE RESULT 🐺 ]\n\nUsed: ${axeUsed}\n\n*🔮 Stone*: ${loot.stone}\n*🔥 Wood*: ${loot.wood}\n*🔩 Iron*: ${loot.iron}\n*💎 Diamonds*: ${loot.diamonds}`;
        if (axeUsed === "diamondpickaxe" && Math.random() <= 0.05) {
          user.inventory.goldenApple += 1;
          lootMsg += `\n\n🍎 You found a Golden Apple! 🍎`;
        }
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
            inventory: { wood: 0, stone: 0, iron: 0, diamonds: 0, diamondpickaxe: 0, ironpickaxe: 0, stonepickaxe: 0, woodenaxe: 0, goldenApple: 0 },
          });
          m.reply(`You have successfully registered in RPG! 🎉`);
        } else {
          m.reply(`You have already registered in RPG!`);
        }
        break;

      case "shop":
      case "store":
        await doReact("🔰");
        m.reply(`🛍️ 💎 ${global.botName} STORE 💎 🛍️\n\n#1\n💡 Wooden Axe\n💰 Cost: 250 coins\n💻 ${prefix}buy woodenaxe\n\n#2\n💡 Stone Pickaxe\n💰 Cost: 500 coins\n💻 ${prefix}buy stonepickaxe\n\n#3\n💡 Iron Pickaxe\n💰 Cost: 2000 coins\n💻 ${prefix}buy ironpickaxe\n\n#4\n💡 Diamond Pickaxe\n💰 Cost: 5000 coins\n💻 ${prefix}buy diamondpickaxe\n\n#5\n💡 Golden Apple\n💰 Cost: 1000 coins\n💻 ${prefix}buy goldenapple`);
        break;

      default:
        break;
    }
  },
};