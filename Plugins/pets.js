import mongoose from "mongoose";

const petSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  name: { type: String, default: "Unnamed Pet" },
  type: { type: String, default: "cat" },
  hunger: { type: Number, default: 100 },
  happiness: { type: Number, default: 100 },
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
});

const Pet = mongoose.models.Pet || mongoose.model("Pet", petSchema);

const petEmojis = { cat: "🐱", dog: "🐶", fox: "🦊", rabbit: "🐰", dragon: "🐉" };

export default {
  name: "pets",
  alias: ["pet", "petfeed", "petplay", "petname", "petadopt", "petstatus"],
  uniquecommands: ["pet", "petfeed", "petplay", "petname", "petadopt"],
  description: "Pet system",
  start: async (Atlas, m, { prefix, inputCMD, doReact, text }) => {
    const user = m.sender;

    switch (inputCMD) {
      case "petadopt":
      case "pet": {
        if (inputCMD === "petadopt") {
          await doReact("🐾");
          const existing = await Pet.findOne({ id: user });
          if (existing) return m.reply(`You already have a pet! Use *${prefix}pet* to see it.`);
          const type = text?.toLowerCase();
          const valid = ["cat", "dog", "fox", "rabbit", "dragon"];
          if (!type || !valid.includes(type)) return m.reply(`Choose a pet type!\n\nExample: *${prefix}petadopt cat*\n\nAvailable: cat, dog, fox, rabbit, dragon`);
          await Pet.create({ id: user, type });
          return m.reply(`🎉 You adopted a ${petEmojis[type]} *${type}*!\n\nName it with *${prefix}petname <name>*`);
        }
        await doReact("🐾");
        const pet = await Pet.findOne({ id: user });
        if (!pet) return m.reply(`You don't have a pet yet!\n\nAdopt one with *${prefix}petadopt cat/dog/fox/rabbit/dragon*`);
        const emoji = petEmojis[pet.type] || "🐾";
        const hungerBar = "█".repeat(Math.floor(pet.hunger / 10)) + "░".repeat(10 - Math.floor(pet.hunger / 10));
        const happyBar = "█".repeat(Math.floor(pet.happiness / 10)) + "░".repeat(10 - Math.floor(pet.happiness / 10));
        m.reply(`${emoji} *${pet.name}*\n\n🐾 Type: ${pet.type}\n⭐ Level: ${pet.level}\n✨ XP: ${pet.xp}/100\n\n🍖 Hunger: [${hungerBar}] ${pet.hunger}%\n😊 Happiness: [${happyBar}] ${pet.happiness}%\n\nUse *${prefix}petfeed* to feed and *${prefix}petplay* to play!`);
        break;
      }

      case "petstatus":
        await doReact("🐾");
        const petS = await Pet.findOne({ id: user });
        if (!petS) return m.reply(`You don't have a pet yet! Use *${prefix}petadopt*`);
        const emojiS = petEmojis[petS.type] || "🐾";
        m.reply(`${emojiS} *${petS.name}* Status\n\n🍖 Hunger: ${petS.hunger}%\n😊 Happiness: ${petS.happiness}%\n⭐ Level: ${petS.level}\n✨ XP: ${petS.xp}/100`);
        break;

      case "petfeed": {
        await doReact("🍖");
        const pet = await Pet.findOne({ id: user });
        if (!pet) return m.reply(`You don't have a pet! Use *${prefix}petadopt*`);
        if (pet.hunger >= 100) return m.reply(`${petEmojis[pet.type]} *${pet.name}* is already full! 🍖`);
        pet.hunger = Math.min(100, pet.hunger + 30);
        pet.xp += 10;
        if (pet.xp >= 100) { pet.level += 1; pet.xp = 0; }
        await pet.save();
        m.reply(`🍖 You fed *${pet.name}*!\n\nHunger: ${pet.hunger}%\n✨ XP: ${pet.xp}/100${pet.xp === 0 ? `\n\n🎉 *Level Up! Now Level ${pet.level}!*` : ""}`);
        break;
      }

      case "petplay": {
        await doReact("🎾");
        const pet = await Pet.findOne({ id: user });
        if (!pet) return m.reply(`You don't have a pet! Use *${prefix}petadopt*`);
        if (pet.happiness >= 100) return m.reply(`${petEmojis[pet.type]} *${pet.name}* is already super happy! 😊`);
        pet.happiness = Math.min(100, pet.happiness + 25);
        pet.hunger = Math.max(0, pet.hunger - 10);
        pet.xp += 15;
        if (pet.xp >= 100) { pet.level += 1; pet.xp = 0; }
        await pet.save();
        m.reply(`🎾 You played with *${pet.name}*!\n\nHappiness: ${pet.happiness}%\nHunger: ${pet.hunger}%\n✨ XP: ${pet.xp}/100${pet.xp === 0 ? `\n\n🎉 *Level Up! Now Level ${pet.level}!*` : ""}`);
        break;
      }

      case "petname": {
        await doReact("✏️");
        if (!text) return m.reply(`Please provide a name!\n\nExample: *${prefix}petname Fluffy*`);
        const pet = await Pet.findOne({ id: user });
        if (!pet) return m.reply(`You don't have a pet! Use *${prefix}petadopt*`);
        const oldName = pet.name;
        pet.name = text.trim();
        await pet.save();
        m.reply(`✅ Renamed *${oldName}* to *${pet.name}*! ${petEmojis[pet.type]}`);
        break;
      }

      default:
        break;
    }
  },
};