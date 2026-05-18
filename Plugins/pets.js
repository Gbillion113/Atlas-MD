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

const petEmojis = { cat: "🐱", dog: "🐶", fox: "🦊", rabbit: "🐰", dragon: "🐉" };

const foodShop = {
  meat: { price: 200, hunger: 40, xp: 10 },
  premium: { price: 500, hunger: 70, xp: 25 },
  candy: { price: 150, hunger: 20, xp: 5 },
};

const levelUp = (pet) => {
  while (pet.xp >= 100) { pet.level += 1; pet.xp -= 100; }
};

const applyDecay = (pet) => {
  const diffHours = (Date.now() - new Date(pet.lastActive)) / (1000 * 60 * 60);
  if (diffHours >= 1) {
    pet.hunger = Math.max(0, pet.hunger - Math.floor(diffHours) * 6);
    pet.happiness = Math.max(0, pet.happiness - Math.floor(diffHours) * 4);
    pet.lastActive = new Date();
  }
};

const getEcoUser = async (id) => {
  const EcoUser = mongoose.models.EcoUser;
  if (!EcoUser) return null;
  let user = await EcoUser.findOne({ id });
  if (!user) user = await EcoUser.create({ id });
  return user;
};

const renderBar = (value) => "█".repeat(Math.floor(value/10)) + "░".repeat(10 - Math.floor(value/10));

export default {
  name: "pets",
  alias: ["pet", "petfeed", "petplay", "petname", "petadopt", "petshop", "petbuy", "petbattle", "petbreed", "petstatus"],
  uniquecommands: ["pet", "petfeed", "petplay", "petname", "petadopt", "petshop", "petbuy", "petbattle", "petbreed"],
  description: "Full RPG Pet System",
  start: async (Atlas, m, { prefix, inputCMD, doReact, text, mentionByTag }) => {
    const userId = m.sender;

    switch (inputCMD) {

      case "petadopt": {
        await doReact("🐾");
        const exists = await Pet.findOne({ id: userId });
        if (exists) return m.reply(`You already have a pet! Use *${prefix}pet* to see it.`);
        const type = text?.toLowerCase();
        if (!petEmojis[type]) return m.reply(`Choose a pet type!\n\nExample: *${prefix}petadopt cat*\n\nAvailable: cat, dog, fox, rabbit, dragon`);
        await Pet.create({ id: userId, type });
        m.reply(`🎉 You adopted a ${petEmojis[type]} *${type}*!\n\nName it with *${prefix}petname <name>*`);
        break;
      }

      case "pet":
      case "petstatus": {
        await doReact("🐾");
        const pet = await Pet.findOne({ id: userId });
        if (!pet) return m.reply(`No pet yet! Adopt one with *${prefix}petadopt cat/dog/fox/rabbit/dragon*`);
        applyDecay(pet);
        await pet.save();
        const emoji = petEmojis[pet.type] || "🐾";
        m.reply(
          `${emoji} *${pet.name}*\n\n` +
          `🐾 Type: ${pet.type}\n` +
          `⭐ Level: ${pet.level}\n` +
          `✨ XP: ${pet.xp}/100\n\n` +
          `🍖 Hunger: [${renderBar(pet.hunger)}] ${pet.hunger}%\n` +
          `😊 Happiness: [${renderBar(pet.happiness)}] ${pet.happiness}%\n\n` +
          `Use *${prefix}petfeed* to feed and *${prefix}petplay* to play!`
        );
        break;
      }

      case "petfeed": {
        await doReact("🍖");
        const pet = await Pet.findOne({ id: userId });
        if (!pet) return m.reply(`No pet! Use *${prefix}petadopt* first.`);
        applyDecay(pet);

        const foodKey = text?.toLowerCase();
        const food = foodShop[foodKey] || foodShop.meat;
        const foodName = foodKey && foodShop[foodKey] ? foodKey : "meat";

        const ecoUser = await getEcoUser(userId);
        if (!ecoUser || ecoUser.wallet < food.price) return m.reply(`❌ Need $${food.price} to buy ${foodName}!\nCheck *${prefix}wallet*`);

        await mongoose.models.EcoUser.findOneAndUpdate({ id: userId }, { wallet: ecoUser.wallet - food.price });

        pet.hunger = Math.min(100, pet.hunger + food.hunger);
        pet.xp += food.xp;
        pet.lastActive = new Date();
        levelUp(pet);
        await pet.save();

        const leveled = pet.xp === 0 ? `\n\n🎉 *LEVEL UP! Now Level ${pet.level}!*` : "";
        m.reply(`🍖 Fed *${pet.name}* with ${foodName}!\n\n-$${food.price}\n+${food.hunger}% Hunger\n+${food.xp} XP${leveled}`);
        break;
      }

      case "petplay": {
        await doReact("🎾");
        const pet = await Pet.findOne({ id: userId });
        if (!pet) return m.reply(`No pet! Use *${prefix}petadopt* first.`);
        applyDecay(pet);

        if (pet.hunger < 20) return m.reply(`🍖 Your pet is too hungry to play! Feed it first with *${prefix}petfeed*`);

        pet.happiness = Math.min(100, pet.happiness + 25);
        pet.hunger = Math.max(0, pet.hunger - 10);
        pet.xp += 15;
        pet.lastActive = new Date();
        levelUp(pet);
        await pet.save();

        const leveled = pet.xp === 0 ? `\n\n🎉 *LEVEL UP! Now Level ${pet.level}!*` : "";
        m.reply(`🎾 Played with *${pet.name}*!\n\n+25% Happiness\n-10% Hunger\n+15 XP${leveled}`);
        break;
      }

      case "petname": {
        await doReact("✏️");
        const pet = await Pet.findOne({ id: userId });
        if (!pet) return m.reply(`No pet! Use *${prefix}petadopt* first.`);
        if (!text) return m.reply(`Usage: *${prefix}petname <name>*`);
        const oldName = pet.name;
        pet.name = text.trim();
        await pet.save();
        m.reply(`✅ Renamed *${oldName}* to *${pet.name}*! ${petEmojis[pet.type] || "🐾"}`);
        break;
      }

      case "petshop": {
        await doReact("🛍️");
        const list = Object.entries(foodShop).map(([k,v]) => `▪️ *${k}* — $${v.price}\n   +${v.hunger}% Hunger, +${v.xp} XP`).join("\n\n");
        m.reply(`🐾 *Pet Food Shop*\n\n${list}\n\nFeed your pet: *${prefix}petfeed <food>*\nExample: *${prefix}petfeed premium*`);
        break;
      }

      case "petbuy": {
        await doReact("🛒");
        if (!text || !foodShop[text.toLowerCase()]) return m.reply(`Invalid food! Use *${prefix}petshop* to see options`);
        const food = foodShop[text.toLowerCase()];
        const pet = await Pet.findOne({ id: userId });
        if (!pet) return m.reply(`No pet! Use *${prefix}petadopt* first.`);
        const ecoUser = await getEcoUser(userId);
        if (!ecoUser || ecoUser.wallet < food.price) return m.reply(`❌ Need $${food.price}!`);
        await mongoose.models.EcoUser.findOneAndUpdate({ id: userId }, { wallet: ecoUser.wallet - food.price });
        applyDecay(pet);
        pet.hunger = Math.min(100, pet.hunger + food.hunger);
        pet.xp += food.xp;
        levelUp(pet);
        pet.lastActive = new Date();
        await pet.save();
        m.reply(`✅ Bought and fed *${text}* to ${pet.name}!\n-$${food.price}\n+${food.hunger}% Hunger`);
        break;
      }

      case "petbattle": {
        await doReact("⚔️");
        const myPet = await Pet.findOne({ id: userId });
        if (!myPet) return m.reply(`No pet! Use *${prefix}petadopt* first.`);

        const opponent = mentionByTag?.[0];
        if (!opponent) return m.reply(`Tag someone to battle!\n\nUsage: *${prefix}petbattle @user*`);
        if (opponent === userId) return m.reply("❌ You can't battle yourself!");

        const oppPet = await Pet.findOne({ id: opponent });
        if (!oppPet) return m.reply(`@${opponent.split("@")[0]} doesn't have a pet!`);

        const myPower = myPet.level * 10 + myPet.happiness + myPet.hunger;
        const oppPower = oppPet.level * 10 + oppPet.happiness + oppPet.hunger;

        if (myPower >= oppPower) {
          myPet.xp += 30;
          levelUp(myPet);
          await myPet.save();
          await Atlas.sendMessage(m.from, {
            text: `⚔️ *PET BATTLE*\n\n${petEmojis[myPet.type]} ${myPet.name} vs ${petEmojis[oppPet.type]} ${oppPet.name}\n\n🏆 @${userId.split("@")[0]}'s ${myPet.name} wins!\n+30 XP`,
            mentions: [userId, opponent],
          }, { quoted: m });
        } else {
          myPet.happiness = Math.max(0, myPet.happiness - 20);
          await myPet.save();
          await Atlas.sendMessage(m.from, {
            text: `⚔️ *PET BATTLE*\n\n${petEmojis[myPet.type]} ${myPet.name} vs ${petEmojis[oppPet.type]} ${oppPet.name}\n\n💀 @${userId.split("@")[0]}'s ${myPet.name} lost!\n-20% Happiness`,
            mentions: [userId, opponent],
          }, { quoted: m });
        }
        break;
      }

      case "petbreed": {
        await doReact("🧬");
        const myPet = await Pet.findOne({ id: userId });
        if (!myPet) return m.reply(`No pet! Use *${prefix}petadopt* first.`);

        const partner = mentionByTag?.[0];
        if (!partner) return m.reply(`Tag someone to breed with!\n\nUsage: *${prefix}petbreed @user*`);
        if (partner === userId) return m.reply("❌ You can't breed with yourself!");

        const partnerPet = await Pet.findOne({ id: partner });
        if (!partnerPet) return m.reply(`@${partner.split("@")[0]} doesn't have a pet!`);

        if (myPet.level < 5) return m.reply(`❌ Your pet needs to be at least *Level 5* to breed! Current: Level ${myPet.level}`);

        const babyTypes = [myPet.type, partnerPet.type];
        const babyType = babyTypes[Math.floor(Math.random() * babyTypes.length)];
        const babyId = `${userId}_baby_${Date.now()}`;

        await Pet.create({ id: babyId, type: babyType, name: `Baby ${babyType}` });

        await Atlas.sendMessage(m.from, {
          text: `🧬 *PET BREEDING*\n\n${petEmojis[myPet.type]} ${myPet.name} + ${petEmojis[partnerPet.type]} ${partnerPet.name}\n\n🍼 A baby *${babyType}* ${petEmojis[babyType]} was born!\n\nBaby ID: ${babyId}`,
          mentions: [userId, partner],
        }, { quoted: m });
        break;
      }

      default:
        break;
    }
  },
};