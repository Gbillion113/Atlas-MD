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

const petEmojis = {
  cat: "🐱",
  dog: "🐶",
  fox: "🦊",
  rabbit: "🐰",
  dragon: "🐉",
};

const getPet = async (id) => {
  let pet = await Pet.findOne({ id });
  if (!pet) pet = await Pet.create({ id });
  return pet;
};

const levelUp = (pet) => {
  if (pet.xp >= 100) {
    pet.level += 1;
    pet.xp = pet.xp - 100;
  }
};

export default {
  name: "pets",
  alias: ["pet", "petfeed", "petplay", "petname", "petadopt", "petstatus"],
  uniquecommands: ["pet", "petfeed", "petplay", "petname", "petadopt"],
  description: "Pet system",

  start: async (Atlas, m, { prefix, inputCMD, doReact, text }) => {
    const user = m.sender;

    switch (inputCMD) {

      // ─── ADOPT + VIEW PET ─────────────────────────────
      case "petadopt":
      case "pet": {
        await doReact("🐾");

        if (inputCMD === "petadopt") {
          const existing = await Pet.findOne({ id: user });
          if (existing) {
            return m.reply(`You already have a pet! Use *${prefix}pet* to see it.`);
          }

          const type = text?.toLowerCase();
          const valid = ["cat", "dog", "fox", "rabbit", "dragon"];

          if (!type || !valid.includes(type)) {
            return m.reply(
              `Choose a pet type!\n\nExample: *${prefix}petadopt cat*\n\nAvailable: cat, dog, fox, rabbit, dragon`
            );
          }

          await Pet.create({ id: user, type });
          return m.reply(
            `🎉 You adopted a ${petEmojis[type]} *${type}*!\n\nName it with *${prefix}petname <name>*`
          );
        }

        const pet = await getPet(user);
        const emoji = petEmojis[pet.type] || "🐾";

        const hungerBar =
          "█".repeat(Math.floor(pet.hunger / 10)) +
          "░".repeat(10 - Math.floor(pet.hunger / 10));

        const happyBar =
          "█".repeat(Math.floor(pet.happiness / 10)) +
          "░".repeat(10 - Math.floor(pet.happiness / 10));

        m.reply(
          `${emoji} *${pet.name}*\n\n` +
          `🐾 Type: ${pet.type}\n` +
          `⭐ Level: ${pet.level}\n` +
          `✨ XP: ${pet.xp}/100\n\n` +
          `🍖 Hunger: [${hungerBar}] ${pet.hunger}%\n` +
          `😊 Happiness: [${happyBar}] ${pet.happiness}%\n\n` +
          `Use *${prefix}petfeed* to feed and *${prefix}petplay* to play!`
        );
        break;
      }

      // ─── STATUS ───────────────────────────────────────
      case "petstatus": {
        await doReact("🐾");

        const pet = await getPet(user);
        const emoji = petEmojis[pet.type] || "🐾";

        m.reply(
          `${emoji} *${pet.name}* Status\n\n` +
          `🍖 Hunger: ${pet.hunger}%\n` +
          `😊 Happiness: ${pet.happiness}%\n` +
          `⭐ Level: ${pet.level}\n` +
          `✨ XP: ${pet.xp}/100`
        );
        break;
      }

      // ─── FEED ─────────────────────────────────────────
      case "petfeed": {
        await doReact("🍖");

        const pet = await getPet(user);

        if (pet.hunger >= 100) {
          return m.reply(`${petEmojis[pet.type]} *${pet.name}* is already full! 🍖`);
        }

        pet.hunger = Math.min(100, pet.hunger + 30);
        pet.xp += 10;

        levelUp(pet);

        await pet.save();

        const leveled = pet.xp < 10; // after levelUp rollover

        m.reply(
          `🍖 You fed *${pet.name}*!\n\n` +
          `Hunger: ${pet.hunger}%\n` +
          `✨ XP: ${pet.xp}/100` +
          (leveled ? `\n\n🎉 *Level Up! Now Level ${pet.level}!*` : "")
        );
        break;
      }

      // ─── PLAY ─────────────────────────────────────────
      case "petplay": {
        await doReact("🎾");

        const pet = await getPet(user);

        if (pet.happiness >= 100) {
          return m.reply(`${petEmojis[pet.type]} *${pet.name}* is already super happy! 😊`);
        }

        pet.happiness = Math.min(100, pet.happiness + 25);
        pet.hunger = Math.max(0, pet.hunger - 10);
        pet.xp += 15;

        levelUp(pet);

        await pet.save();

        const leveled = pet.xp < 15;

        m.reply(
          `🎾 You played with *${pet.name}*!\n\n` +
          `Happiness: ${pet.happiness}%\n` +
          `Hunger: ${pet.hunger}%\n` +
          `✨ XP: ${pet.xp}/100` +
          (leveled ? `\n\n🎉 *Level Up! Now Level ${pet.level}!*` : "")
        );
        break;
      }

      // ─── NAME ─────────────────────────────────────────
      case "petname": {
        await doReact("✏️");

        if (!text) {
          return m.reply(`Please provide a name!\n\nExample: *${prefix}petname Fluffy*`);
        }

        const pet = await getPet(user);
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