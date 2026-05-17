import mongoose from "mongoose";

const petSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  name: { type: String, default: "Unnamed Pet" },
  type: { type: String, default: "cat" },
  hunger: { type: Number, default: 100 },
  happiness: { type: Number, default: 100 },
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  lastActive: { type: Date, default: Date.now },
});

const Pet = mongoose.models.Pet || mongoose.model("Pet", petSchema);

// ─── FOOD ITEMS (REAL ECONOMY LINKED) ───────────────
const foodShop = {
  meat: { price: 200, hunger: 40, xp: 10 },
  premium: { price: 500, hunger: 70, xp: 25 },
  candy: { price: 150, hunger: 20, xp: 5 },
};

// ─── PET TYPES ───────────────────────────────────────
const petEmojis = {
  cat: "🐱",
  dog: "🐶",
  fox: "🦊",
  rabbit: "🐰",
  dragon: "🐉",
};

// ─── HELPERS ─────────────────────────────────────────
const getPet = async (id) => {
  let pet = await Pet.findOne({ id });
  if (!pet) pet = await Pet.create({ id });
  return pet;
};

const levelUp = (pet) => {
  while (pet.xp >= 100) {
    pet.level += 1;
    pet.xp -= 100;
  }
};

const applyDecay = (pet) => {
  const now = Date.now();
  const diffHours = (now - new Date(pet.lastActive)) / (1000 * 60 * 60);

  if (diffHours >= 1) {
    const decay = Math.floor(diffHours);

    pet.hunger = Math.max(0, pet.hunger - decay * 6);
    pet.happiness = Math.max(0, pet.happiness - decay * 4);
    pet.lastActive = now;
  }
};

export default {
  name: "pets",
  alias: [
    "pet", "petfeed", "petplay", "petname",
    "petadopt", "petshop", "petbuy",
    "petbattle", "petbreed"
  ],

  uniquecommands: [
    "pet", "petfeed", "petplay", "petname",
    "petadopt", "petshop", "petbuy",
    "petbattle", "petbreed"
  ],

  description: "Full RPG Pet System",

  start: async (Atlas, m, { prefix, inputCMD, doReact, text }) => {
    const user = m.sender;

    const pet = await getPet(user);
    applyDecay(pet);

    const emoji = petEmojis[pet.type] || "🐾";

    // ─────────────────────────────────────────────
    // ADOPT + VIEW
    // ─────────────────────────────────────────────
    switch (inputCMD) {

      case "petadopt":
      case "pet": {
        await doReact("🐾");

        if (inputCMD === "petadopt") {
          const exists = await Pet.findOne({ id: user });
          if (exists) return m.reply(`You already have a pet! Use *${prefix}pet*`);

          const type = text?.toLowerCase();
          if (!petEmojis[type]) {
            return m.reply(`Choose: cat, dog, fox, rabbit, dragon`);
          }

          await Pet.create({ id: user, type });
          return m.reply(`🎉 Adopted ${petEmojis[type]} *${type}*`);
        }

        const hungerBar = "█".repeat(pet.hunger / 10) + "░".repeat(10 - pet.hunger / 10);
        const happyBar = "█".repeat(pet.happiness / 10) + "░".repeat(10 - pet.happiness / 10);

        m.reply(
          `${emoji} *${pet.name}*\n\n` +
          `⭐ Level: ${pet.level}\n✨ XP: ${pet.xp}/100\n\n` +
          `🍖 Hunger: ${hungerBar} ${pet.hunger}%\n` +
          `😊 Happiness: ${happyBar} ${pet.happiness}%`
        );
        break;
      }

      // ─────────────────────────────────────────────
      // FEED (LINKED TO ECONOMY)
      // ─────────────────────────────────────────────
      case "petfeed": {
        await doReact("🍖");

        const food = foodShop[text?.toLowerCase()] || foodShop.meat;

        // ECONOMY INTEGRATION
        const EcoUser = mongoose.models.EcoUser;
        if (EcoUser) {
          const userEco = await EcoUser.findOne({ id: user });
          if (!userEco || userEco.wallet < food.price)
            return m.reply(`❌ Need $${food.price} to buy ${text || "meat"}!`);

          await EcoUser.findOneAndUpdate(
            { id: user },
            { wallet: userEco.wallet - food.price }
          );
        }

        pet.hunger = Math.min(100, pet.hunger + food.hunger);
        pet.xp += food.xp;

        levelUp(pet);
        pet.lastActive = Date.now();

        await pet.save();

        m.reply(
          `🍖 Fed *${pet.name}*\n` +
          `- $${food.price}\n+${food.hunger}% Hunger\n+${food.xp} XP`
        );
        break;
      }

      // ─────────────────────────────────────────────
      // PLAY
      // ─────────────────────────────────────────────
      case "petplay": {
        await doReact("🎾");

        pet.happiness = Math.min(100, pet.happiness + 25);
        pet.hunger = Math.max(0, pet.hunger - 10);
        pet.xp += 15;

        levelUp(pet);
        pet.lastActive = Date.now();

        await pet.save();

        m.reply(`🎾 Played with *${pet.name}*`);
        break;
      }

      // ─────────────────────────────────────────────
      // NAME
      // ─────────────────────────────────────────────
      case "petname": {
        await doReact("✏️");
        if (!text) return m.reply("Give a name");

        pet.name = text.trim();
        await pet.save();

        m.reply(`Named pet *${pet.name}*`);
        break;
      }

      // ─────────────────────────────────────────────
      // SHOP
      // ─────────────────────────────────────────────
      case "petshop": {
        await doReact("🛍️");

        const list = Object.entries(foodShop)
          .map(([k, v]) => `${k} - $${v.price}`)
          .join("\n");

        m.reply(`🐾 Pet Food Shop\n\n${list}`);
        break;
      }

      // ─────────────────────────────────────────────
      // BUY FOOD (REAL ECONOMY)
      // ─────────────────────────────────────────────
      case "petbuy": {
        await doReact("🛒");

        if (!text || !foodShop[text]) {
          return m.reply("Invalid item. Use *petshop*");
        }

        const item = foodShop[text];

        const EcoUser = mongoose.models.EcoUser;
        if (!EcoUser) return m.reply("Economy not available");

        const userEco = await EcoUser.findOne({ id: user });
        if (!userEco || userEco.wallet < item.price)
          return m.reply(`❌ You need $${item.price}`);

        await EcoUser.findOneAndUpdate(
          { id: user },
          { wallet: userEco.wallet - item.price }
        );

        pet.hunger = Math.min(100, pet.hunger + item.hunger);
        pet.xp += item.xp;

        levelUp(pet);
        await pet.save();

        m.reply(
          `🛒 Bought ${text}\n` +
          `- $${item.price}\n+${item.hunger}% Hunger`
        );
        break;
      }

      // ─────────────────────────────────────────────
      // BATTLE SYSTEM
      // ─────────────────────────────────────────────
      case "petbattle": {
        await doReact("⚔️");

        const opponent = await getPet(user);

        const myPower = pet.level * 10 + pet.happiness;
        const oppPower = opponent.level * 10 + opponent.happiness;

        if (myPower > oppPower) {
          pet.xp += 30;
          await pet.save();
          return m.reply("🏆 You won the battle!");
        } else {
          pet.happiness = Math.max(0, pet.happiness - 20);
          await pet.save();
          return m.reply("💀 You lost the battle!");
        }
      }

      // ─────────────────────────────────────────────
      // BREEDING SYSTEM
      // ─────────────────────────────────────────────
      case "petbreed": {
        await doReact("🧬");

        const mate = await getPet(user);

        const babyType =
          Math.random() > 0.5 ? pet.type : mate.type;

        await Pet.create({
          id: user + "_baby_" + Date.now(),
          type: babyType,
          name: "Baby " + babyType,
        });

        m.reply(`🧬 A baby ${babyType} was born!`);
        break;
      }

      default:
        break;
    }
  },
};