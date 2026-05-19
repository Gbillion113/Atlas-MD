/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║            🐾 PETS — Atlas MD Plugin                    ║
 * ║  Adopt · Feed · Train · Battle · Evolve · Leaderboard   ║
 * ╠══════════════════════════════════════════════════════════╣
 * ║  Compatible with: economy.js · rpg.js · moneywars.js    ║
 * ║  No command clashes. Uses wallet from EcoUser.          ║
 * ╚══════════════════════════════════════════════════════════╝
 *
 * COMMANDS (all unique — verified against economy, rpg, moneywars):
 *   -adopt <name>     → Adopt a random pet (costs $2,000)
 *   -mypet            → View your pet's stats
 *   -feedpet          → Feed your pet (free, 1h cooldown)
 *   -trainpet         → Train your pet's attack/defense (2h cooldown)
 *   -petbattle @user  → Battle another player's pet
 *   -petshop          → Browse pet items
 *   -buypetitem <id>  → Buy a pet item
 *   -usepetitem <id>  → Use an item on your pet
 *   -petevolve        → Evolve your pet (if ready)
 *   -petleader        → Top 10 strongest pets
 *   -releasepet       → Release your pet (irreversible)
 *   -renamepet <name> → Rename your pet
 */

import mongoose from "mongoose";

// ─────────────────────────────────────────────────────────────────────────────
// SCHEMA
// ─────────────────────────────────────────────────────────────────────────────

const PetSchema = new mongoose.Schema({
  ownerId:   { type: String, unique: true },
  ownerName: { type: String, default: "Trainer" },

  name:      { type: String, default: "Buddy" },
  species:   { type: String, default: "dog" },
  emoji:     { type: String, default: "🐶" },
  stage:     { type: Number, default: 1 },      // 1 = baby, 2 = adult, 3 = legendary

  // Stats
  hp:        { type: Number, default: 100 },
  maxHp:     { type: Number, default: 100 },
  attack:    { type: Number, default: 10 },
  defense:   { type: Number, default: 5 },
  speed:     { type: Number, default: 8 },
  level:     { type: Number, default: 1 },
  xp:        { type: Number, default: 0 },
  wins:      { type: Number, default: 0 },
  losses:    { type: Number, default: 0 },

  // Happiness & hunger (0–100)
  happiness: { type: Number, default: 80 },
  hunger:    { type: Number, default: 80 },

  // Cooldowns
  lastFed:      { type: Date, default: null },
  lastTrained:  { type: Date, default: null },
  lastBattle:   { type: Date, default: null },

  // Items equipped
  equippedArmor:  { type: String, default: null },
  equippedWeapon: { type: String, default: null },

  // Inventory of pet items
  items: { type: Object, default: {} },

  createdAt: { type: Date, default: Date.now },
});

const Pet = mongoose.models.AtlasPet || mongoose.model("AtlasPet", PetSchema);

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

// All available species per stage
const SPECIES = {
  // Stage 1 — Baby
  dog:     { emoji: "🐶", name: "Dog",     stage: 1, evolvesTo: "wolf"    },
  cat:     { emoji: "🐱", name: "Cat",     stage: 1, evolvesTo: "panther" },
  bird:    { emoji: "🐦", name: "Bird",    stage: 1, evolvesTo: "eagle"   },
  rabbit:  { emoji: "🐰", name: "Rabbit",  stage: 1, evolvesTo: "fox"     },
  turtle:  { emoji: "🐢", name: "Turtle",  stage: 1, evolvesTo: "dragon"  },
  penguin: { emoji: "🐧", name: "Penguin", stage: 1, evolvesTo: "icebear" },

  // Stage 2 — Adult
  wolf:    { emoji: "🐺", name: "Wolf",     stage: 2, evolvesTo: "dire_wolf"   },
  panther: { emoji: "🐆", name: "Panther",  stage: 2, evolvesTo: "shadowcat"   },
  eagle:   { emoji: "🦅", name: "Eagle",    stage: 2, evolvesTo: "thunderbird" },
  fox:     { emoji: "🦊", name: "Fox",      stage: 2, evolvesTo: "nine_tail"   },
  dragon:  { emoji: "🐲", name: "Dragon",   stage: 2, evolvesTo: "elder_dragon"},
  icebear: { emoji: "🐻‍❄️", name: "Ice Bear", stage: 2, evolvesTo: "frost_titan" },

  // Stage 3 — Legendary (can't evolve further)
  dire_wolf:    { emoji: "🐉", name: "Dire Wolf",    stage: 3, evolvesTo: null },
  shadowcat:    { emoji: "🌑", name: "Shadow Cat",   stage: 3, evolvesTo: null },
  thunderbird:  { emoji: "⚡", name: "Thunderbird",  stage: 3, evolvesTo: null },
  nine_tail:    { emoji: "🦊", name: "Nine-Tail",    stage: 3, evolvesTo: null },
  elder_dragon: { emoji: "🔥", name: "Elder Dragon", stage: 3, evolvesTo: null },
  frost_titan:  { emoji: "❄️", name: "Frost Titan",  stage: 3, evolvesTo: null },
};

const STAGE1_SPECIES = Object.entries(SPECIES).filter(([,v]) => v.stage === 1).map(([k]) => k);

// XP needed to level up
const xpToLevel = (level) => level * 100;

// XP needed to evolve (stage thresholds)
const EVOLVE_LEVEL = { 1: 10, 2: 25 }; // evolve at level 10 (baby→adult), 25 (adult→legendary)

// Stat boosts on evolve
const EVOLVE_BOOSTS = {
  2: { hp: 50, attack: 15, defense: 10, speed: 5 },
  3: { hp: 100, attack: 30, defense: 20, speed: 10 },
};

// Adoption cost
const ADOPT_COST = 2_000;

// Pet shop items
const PET_ITEMS = {
  pet_food:    { name: "🍖 Premium Food",   price: 500,   desc: "Instantly restores hunger to 100",       slot: "consumable" },
  pet_toy:     { name: "🎾 Toy Ball",        price: 800,   desc: "Boosts happiness by 40",                 slot: "consumable" },
  pet_potion:  { name: "💊 HP Potion",       price: 1_200, desc: "Restores pet HP to max",                 slot: "consumable" },
  pet_armor:   { name: "🛡️ Pet Armor",       price: 5_000, desc: "Equip: +20 defense in battles",          slot: "armor"      },
  pet_sword:   { name: "⚔️ Pet Sword",       price: 5_000, desc: "Equip: +25 attack in battles",           slot: "weapon"     },
  xp_boost:    { name: "⭐ XP Boost",        price: 3_000, desc: "Next training gives 3× XP",              slot: "consumable" },
  revive:      { name: "💉 Revive",          price: 2_500, desc: "Revive a fainted pet (0 HP → full HP)",  slot: "consumable" },
};

const COOLDOWNS = {
  feed:    60 * 60 * 1000,       // 1 hour
  train:   2 * 60 * 60 * 1000,  // 2 hours
  battle:  30 * 60 * 1000,      // 30 minutes
};

const cd = (ms) => {
  const s = Math.ceil(ms / 1000);
  if (s < 60)   return `${s}s`;
  if (s < 3600) return `${Math.ceil(s / 60)}m`;
  return `${Math.ceil(s / 3600)}h`;
};

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

async function getWallet(id) {
  const EcoUser = mongoose.models.EcoUser;
  if (!EcoUser) return 0;
  const u = await EcoUser.findOne({ id });
  return u?.wallet ?? 0;
}

async function deductWallet(id, amount) {
  const EcoUser = mongoose.models.EcoUser;
  if (!EcoUser) return;
  await EcoUser.findOneAndUpdate({ id }, { $inc: { wallet: -amount } });
}

async function addWallet(id, amount) {
  const EcoUser = mongoose.models.EcoUser;
  if (!EcoUser) return;
  await EcoUser.findOneAndUpdate({ id }, { $inc: { wallet: amount } });
}

function petStatus(pet) {
  const speciesData = SPECIES[pet.species] || {};
  const stageName   = ["", "Baby", "Adult", "Legendary"][pet.stage] || "Unknown";
  const hpBar       = hpBarStr(pet.hp, pet.maxHp);
  const happyEmoji  = pet.happiness >= 70 ? "😊" : pet.happiness >= 40 ? "😐" : "😢";
  const hungerEmoji = pet.hunger    >= 70 ? "🍖" : pet.hunger    >= 40 ? "😮" : "😫";

  return (
    `${pet.emoji} *${pet.name}* [${speciesData.name || pet.species}] — ${stageName}\n` +
    `${"─".repeat(24)}\n` +
    `❤️ HP:      ${hpBar} ${pet.hp}/${pet.maxHp}\n` +
    `⚔️ ATK:    ${pet.attack}${pet.equippedWeapon ? " (+25⚔️)" : ""}\n` +
    `🛡️ DEF:    ${pet.defense}${pet.equippedArmor ? " (+20🛡️)" : ""}\n` +
    `💨 SPD:    ${pet.speed}\n` +
    `⭐ LV:     ${pet.level}  XP: ${pet.xp}/${xpToLevel(pet.level)}\n` +
    `${happyEmoji} Happy:  ${pet.happiness}/100\n` +
    `${hungerEmoji} Hunger: ${pet.hunger}/100\n` +
    `🏆 Record: ${pet.wins}W / ${pet.losses}L\n` +
    (pet.equippedArmor  ? `🛡️ Armor:  ${PET_ITEMS[pet.equippedArmor]?.name || pet.equippedArmor}\n` : "") +
    (pet.equippedWeapon ? `⚔️ Weapon: ${PET_ITEMS[pet.equippedWeapon]?.name || pet.equippedWeapon}\n` : "")
  );
}

function hpBarStr(hp, maxHp) {
  const filled = Math.round((hp / maxHp) * 10);
  return "█".repeat(filled) + "░".repeat(10 - filled);
}

async function levelUp(pet) {
  let leveled = false;
  while (pet.xp >= xpToLevel(pet.level)) {
    pet.xp    -= xpToLevel(pet.level);
    pet.level += 1;
    pet.attack  += rand(2, 5);
    pet.defense += rand(1, 3);
    pet.speed   += rand(1, 2);
    pet.maxHp   += rand(10, 20);
    pet.hp       = pet.maxHp; // heal on level up
    leveled = true;
  }
  return leveled;
}

// ─────────────────────────────────────────────────────────────────────────────
// PLUGIN
// ─────────────────────────────────────────────────────────────────────────────

export default {
  name: "pets",
  alias: [
    "adopt", "mypet", "feedpet", "trainpet", "petbattle",
    "petshop", "buypetitem", "usepetitem", "petevolve",
    "petleader", "releasepet", "renamepet",
  ],
  uniquecommands: [
    "adopt", "mypet", "feedpet", "trainpet", "petbattle",
    "petshop", "buypetitem", "usepetitem", "petevolve",
    "petleader", "releasepet", "renamepet",
  ],
  description: "🐾 Pet system — adopt, train, battle & evolve",

  start: async (Atlas, m, { prefix, inputCMD, doReact, text, args, mentionByTag, pushName, isOwner }) => {
    const sender = m.sender;

    switch (inputCMD) {

      // ── ADOPT ───────────────────────────────────────────────────────────
      case "adopt": {
        await doReact("🐾");
        const existing = await Pet.findOne({ ownerId: sender });
        if (existing) {
          return m.reply(
            `❌ You already have *${existing.emoji} ${existing.name}*!\n` +
            `Use \`${prefix}mypet\` to view it, or \`${prefix}releasepet\` to release it first.`
          );
        }

        const wallet = await getWallet(sender);
        if (wallet < ADOPT_COST) {
          return m.reply(`❌ Adopting costs *$${ADOPT_COST.toLocaleString()}*. You have $${wallet.toLocaleString()}.`);
        }

        const petName    = text?.trim() || "Buddy";
        const speciesKey = STAGE1_SPECIES[rand(0, STAGE1_SPECIES.length - 1)];
        const speciesData = SPECIES[speciesKey];

        await deductWallet(sender, ADOPT_COST);
        await Pet.create({
          ownerId:   sender,
          ownerName: pushName,
          name:      petName,
          species:   speciesKey,
          emoji:     speciesData.emoji,
          stage:     1,
        });

        m.reply(
          `🎉 *You adopted a pet!*\n` +
          `${"═".repeat(22)}\n` +
          `${speciesData.emoji} *${petName}* the ${speciesData.name}\n` +
          `├ ❤️ HP: 100\n` +
          `├ ⚔️ ATK: 10 | 🛡️ DEF: 5 | 💨 SPD: 8\n` +
          `├ 💰 Cost: -$${ADOPT_COST.toLocaleString()}\n` +
          `└ 💰 Wallet: $${(wallet - ADOPT_COST).toLocaleString()}\n\n` +
          `_Feed it with \`${prefix}feedpet\` and train with \`${prefix}trainpet\`_`
        );
        break;
      }

      // ── MY PET ──────────────────────────────────────────────────────────
      case "mypet": {
        await doReact("🐾");
        const pet = await Pet.findOne({ ownerId: sender });
        if (!pet) return m.reply(`❌ You don't have a pet! Adopt one with \`${prefix}adopt <name>\` (costs $${ADOPT_COST.toLocaleString()})`);

        // Passive stat decay over time
        const hoursSinceFed    = pet.lastFed    ? (Date.now() - new Date(pet.lastFed).getTime())    / 3_600_000 : 0;
        const decayHunger      = Math.min(pet.hunger,    Math.floor(hoursSinceFed * 3));
        const decayHappiness   = Math.min(pet.happiness, Math.floor(hoursSinceFed * 2));
        pet.hunger    = Math.max(0, pet.hunger    - decayHunger);
        pet.happiness = Math.max(0, pet.happiness - decayHappiness);
        await pet.save();

        const evolveLevel = EVOLVE_LEVEL[pet.stage];
        const canEvolve   = evolveLevel && pet.level >= evolveLevel && SPECIES[pet.species]?.evolvesTo;

        m.reply(
          petStatus(pet) +
          (canEvolve ? `\n✨ *Ready to evolve!* Use \`${prefix}petevolve\`` : "") +
          (pet.hp <= 0 ? `\n\n💔 *Your pet has fainted!* Use \`${prefix}usepetitem revive\`` : "")
        );
        break;
      }

      // ── FEED PET ────────────────────────────────────────────────────────
      case "feedpet": {
        await doReact("🍖");
        const pet = await Pet.findOne({ ownerId: sender });
        if (!pet) return m.reply(`❌ No pet! Adopt one with \`${prefix}adopt <name>\``);

        const now  = Date.now();
        const diff = now - (pet.lastFed ? new Date(pet.lastFed).getTime() : 0);
        if (diff < COOLDOWNS.feed) {
          return m.reply(`⏳ Your pet isn't hungry yet! Come back in *${cd(COOLDOWNS.feed - diff)}*`);
        }

        const hungerGain    = rand(20, 35);
        const happinessGain = rand(5, 15);
        pet.hunger    = Math.min(100, pet.hunger    + hungerGain);
        pet.happiness = Math.min(100, pet.happiness + happinessGain);
        pet.lastFed   = new Date();
        await pet.save();

        m.reply(
          `🍖 *${pet.emoji} ${pet.name}* happily ate!\n` +
          `├ 🍖 Hunger:   +${hungerGain} → ${pet.hunger}/100\n` +
          `└ 😊 Happiness: +${happinessGain} → ${pet.happiness}/100`
        );
        break;
      }

      // ── TRAIN PET ───────────────────────────────────────────────────────
      case "trainpet": {
        await doReact("🏋️");
        const pet = await Pet.findOne({ ownerId: sender });
        if (!pet) return m.reply(`❌ No pet! Adopt one with \`${prefix}adopt <name>\``);
        if (pet.hp <= 0) return m.reply(`💔 *${pet.name}* has fainted! Use \`${prefix}usepetitem revive\` first.`);

        const now  = Date.now();
        const diff = now - (pet.lastTrained ? new Date(pet.lastTrained).getTime() : 0);
        if (diff < COOLDOWNS.train) {
          return m.reply(`⏳ *${pet.name}* is still tired! Rest for *${cd(COOLDOWNS.train - diff)}*`);
        }

        // XP boost item check
        const hasBoost = (pet.items?.xp_boost || 0) > 0;
        const xpMult   = hasBoost ? 3 : 1;
        if (hasBoost) {
          pet.items.xp_boost = Math.max(0, (pet.items.xp_boost || 1) - 1);
        }

        const xpGained  = rand(20, 50) * xpMult;
        const atkGained = rand(1, 3);
        const defGained = rand(1, 2);
        pet.xp      += xpGained;
        pet.attack  += atkGained;
        pet.defense += defGained;
        pet.happiness = Math.max(0, pet.happiness - 10);
        pet.lastTrained = new Date();

        const didLevelUp = await levelUp(pet);
        await pet.save();

        m.reply(
          `🏋️ *${pet.emoji} ${pet.name}* trained hard!\n` +
          `├ ⭐ XP: +${xpGained}${hasBoost ? " (×3 boost!)" : ""} → ${pet.xp}/${xpToLevel(pet.level)}\n` +
          `├ ⚔️ ATK: +${atkGained} → ${pet.attack}\n` +
          `├ 🛡️ DEF: +${defGained} → ${pet.defense}\n` +
          (didLevelUp ? `└ 🎉 *LEVEL UP! Now Lv.${pet.level}!*` : `└ 📊 Level: ${pet.level}`)
        );
        break;
      }

      // ── PET BATTLE ──────────────────────────────────────────────────────
      case "petbattle": {
        await doReact("⚔️");
        const target = mentionByTag?.[0] || m.quoted?.sender;
        if (!target || target === sender) return m.reply(`Usage: \`${prefix}petbattle @user\``);

        const myPet  = await Pet.findOne({ ownerId: sender });
        const foeRaw = await Pet.findOne({ ownerId: target });
        if (!myPet)  return m.reply(`❌ You don't have a pet! \`${prefix}adopt <name>\``);
        if (!foeRaw) return m.reply(`❌ That player doesn't have a pet yet!`);
        if (myPet.hp <= 0)  return m.reply(`💔 *${myPet.name}* has fainted! Revive it first.`);
        if (foeRaw.hp <= 0) return m.reply(`💔 *${foeRaw.name}* has already fainted!`);

        const now  = Date.now();
        const diff = now - (myPet.lastBattle ? new Date(myPet.lastBattle).getTime() : 0);
        if (diff < COOLDOWNS.battle) {
          return m.reply(`⏳ Battle cooldown: *${cd(COOLDOWNS.battle - diff)}* left.`);
        }

        // Effective stats (with equipment)
        const myAtk  = myPet.attack  + (myPet.equippedWeapon  ? 25 : 0);
        const myDef  = myPet.defense + (myPet.equippedArmor   ? 20 : 0);
        const foeAtk = foeRaw.attack  + (foeRaw.equippedWeapon ? 25 : 0);
        const foeDef = foeRaw.defense + (foeRaw.equippedArmor  ? 20 : 0);

        // Simulate battle — up to 10 rounds
        let myHp  = myPet.hp;
        let foeHp = foeRaw.hp;
        const log = [];
        let round = 0;

        while (myHp > 0 && foeHp > 0 && round < 10) {
          round++;
          // Determine who goes first by speed
          if (myPet.speed >= foeRaw.speed) {
            const dmgToFoe = Math.max(1, myAtk  - foeDef + rand(-3, 5));
            const dmgToMe  = Math.max(1, foeAtk - myDef  + rand(-3, 5));
            foeHp -= dmgToFoe;
            if (foeHp > 0) myHp -= dmgToMe;
            log.push(`R${round}: ${myPet.emoji} dealt ${dmgToFoe} | ${foeRaw.emoji} dealt ${foeHp > 0 ? dmgToMe : 0}`);
          } else {
            const dmgToMe  = Math.max(1, foeAtk - myDef  + rand(-3, 5));
            const dmgToFoe = Math.max(1, myAtk  - foeDef + rand(-3, 5));
            myHp -= dmgToMe;
            if (myHp > 0) foeHp -= dmgToFoe;
            log.push(`R${round}: ${foeRaw.emoji} dealt ${dmgToMe} | ${myPet.emoji} dealt ${myHp > 0 ? dmgToFoe : 0}`);
          }
        }

        const iWon = myHp > foeHp;
        const xpReward     = iWon ? rand(40, 80) : rand(10, 25);
        const moneyReward  = iWon ? rand(500, 2_000) : 0;

        myPet.hp         = Math.max(0, myHp);
        myPet.xp        += xpReward;
        myPet.lastBattle = new Date();
        foeRaw.hp        = Math.max(0, foeHp);

        if (iWon) {
          myPet.wins   += 1;
          foeRaw.losses += 1;
          await addWallet(sender, moneyReward);
        } else {
          myPet.losses  += 1;
          foeRaw.wins   += 1;
        }

        const didLevelUp = await levelUp(myPet);
        await myPet.save();
        await foeRaw.save();

        const summary = log.slice(-5).join("\n"); // show last 5 rounds
        m.reply(
          `⚔️ *PET BATTLE*\n` +
          `${"═".repeat(22)}\n` +
          `${myPet.emoji} ${myPet.name} vs ${foeRaw.emoji} ${foeRaw.name}\n` +
          `${"─".repeat(22)}\n` +
          `${summary}\n` +
          `${"─".repeat(22)}\n` +
          (iWon
            ? `🏆 *${myPet.name} WINS!*\n+${xpReward} XP | +$${moneyReward.toLocaleString()}`
            : `💔 *${myPet.name} lost...*\n+${xpReward} XP`) +
          (didLevelUp ? `\n🎉 *LEVEL UP! Now Lv.${myPet.level}!*` : "")
        );
        break;
      }

      // ── PET SHOP ────────────────────────────────────────────────────────
      case "petshop": {
        await doReact("🛍️");
        let board = `🛍️ *Pet Shop*\n${"═".repeat(22)}\n`;
        for (const [id, item] of Object.entries(PET_ITEMS)) {
          board += `*${item.name}* — $${item.price.toLocaleString()}\n  ${item.desc}\n  Buy: \`${prefix}buypetitem ${id}\`\n\n`;
        }
        board += `_Equip armor/weapon with \`${prefix}usepetitem <id>\`_`;
        m.reply(board.trim());
        break;
      }

      // ── BUY PET ITEM ────────────────────────────────────────────────────
      case "buypetitem": {
        await doReact("🛒");
        const itemId = args[0]?.toLowerCase();
        const item   = PET_ITEMS[itemId];
        if (!item) return m.reply(`❌ Unknown item. Check \`${prefix}petshop\``);

        const wallet = await getWallet(sender);
        if (wallet < item.price) return m.reply(`❌ Need $${item.price.toLocaleString()}, you have $${wallet.toLocaleString()}.`);

        const pet = await Pet.findOne({ ownerId: sender });
        if (!pet) returnm.reply(`❌ You need a pet first! \`${prefix}adopt <name>\``);

        await deductWallet(sender, item.price);
        pet.items = pet.items || {};
        pet.items[itemId] = (pet.items[itemId] || 0) + 1;
        pet.markModified("items");
        await pet.save();

        m.reply(`✅ Bought *${item.name}*!\n💰 Wallet: $${(wallet - item.price).toLocaleString()}`);
        break;
      }

      // ── USE PET ITEM ────────────────────────────────────────────────────
      case "usepetitem": {
        await doReact("✨");
        const itemId = args[0]?.toLowerCase();
        if (!itemId) return m.reply(`Usage: \`${prefix}usepetitem <item_id>\`\nCheck \`${prefix}petshop\` for IDs.`);

        const pet = await Pet.findOne({ ownerId: sender });
        if (!pet) return m.reply(`❌ No pet! \`${prefix}adopt <name>\``);

        const qty = pet.items?.[itemId] || 0;
        if (qty <= 0) return m.reply(`❌ You don't have *${PET_ITEMS[itemId]?.name || itemId}*. Buy it in \`${prefix}petshop\``);

        const item = PET_ITEMS[itemId];

        // ── CONSUMABLES ──
        if (itemId === "pet_food") {
          pet.hunger = 100;
          pet.happiness = Math.min(100, pet.happiness + 10);
          pet.items[itemId]--;
          pet.markModified("items");
          await pet.save();
          return m.reply(`🍖 Fed *${pet.name}* premium food!\n🍖 Hunger → 100 | 😊 Happiness +10`);
        }

        if (itemId === "pet_toy") {
          pet.happiness = Math.min(100, pet.happiness + 40);
          pet.items[itemId]--;
          pet.markModified("items");
          await pet.save();
          return m.reply(`🎾 *${pet.name}* played with the toy!\n😊 Happiness → ${pet.happiness}/100`);
        }

        if (itemId === "pet_potion") {
          if (pet.hp <= 0) return m.reply(`💔 Pet has fainted — use *revive* first!`);
          pet.hp = pet.maxHp;
          pet.items[itemId]--;
          pet.markModified("items");
          await pet.save();
          return m.reply(`💊 *${pet.name}* is fully healed!\n❤️ HP → ${pet.maxHp}/${pet.maxHp}`);
        }

        if (itemId === "revive") {
          if (pet.hp > 0) return m.reply(`✅ *${pet.name}* is already conscious!`);
          pet.hp = pet.maxHp;
          pet.happiness = 50;
          pet.items[itemId]--;
          pet.markModified("items");
          await pet.save();
          return m.reply(`💉 *${pet.name}* was revived!\n❤️ HP → ${pet.maxHp}/${pet.maxHp}`);
        }

        if (itemId === "xp_boost") {
          return m.reply(`⭐ XP Boost is used automatically on your next \`${prefix}trainpet\`! You have ${qty}x.`);
        }

        // ── EQUIPMENT ──
        if (itemId === "pet_armor") {
          if (pet.equippedArmor === "pet_armor") return m.reply(`🛡️ *${pet.name}* already has armor equipped!`);
          pet.equippedArmor = "pet_armor";
          await pet.save();
          return m.reply(`🛡️ *${pet.name}* equipped *${item.name}*!\n+20 DEF in battles.`);
        }

        if (itemId === "pet_sword") {
          if (pet.equippedWeapon === "pet_sword") return m.reply(`⚔️ *${pet.name}* already has a weapon equipped!`);
          pet.equippedWeapon = "pet_sword";
          await pet.save();
          return m.reply(`⚔️ *${pet.name}* equipped *${item.name}*!\n+25 ATK in battles.`);
        }

        m.reply(`❓ Unknown use for *${itemId}*.`);
        break;
      }

      // ── EVOLVE ──────────────────────────────────────────────────────────
      case "petevolve": {
        await doReact("✨");
        const pet = await Pet.findOne({ ownerId: sender });
        if (!pet) return m.reply(`❌ No pet! \`${prefix}adopt <name>\``);

        const evolveLevel = EVOLVE_LEVEL[pet.stage];
        if (!evolveLevel) return m.reply(`✨ *${pet.name}* is already at *Legendary* stage — the peak!`);
        if (pet.level < evolveLevel) {
          return m.reply(`⏳ *${pet.name}* needs to reach *Level ${evolveLevel}* to evolve.\nCurrently: Lv.${pet.level}`);
        }

        const nextSpecies = SPECIES[pet.species]?.evolvesTo;
        if (!nextSpecies || !SPECIES[nextSpecies]) {
          return m.reply(`❌ Evolution path not found for ${pet.species}.`);
        }

        const newSpeciesData = SPECIES[nextSpecies];
        const boosts         = EVOLVE_BOOSTS[pet.stage + 1] || {};
        const oldEmoji       = pet.emoji;
        const oldName        = pet.species;

        pet.species  = nextSpecies;
        pet.emoji    = newSpeciesData.emoji;
        pet.stage   += 1;
        pet.maxHp   += boosts.hp      || 0;
        pet.hp       = pet.maxHp;
        pet.attack  += boosts.attack  || 0;
        pet.defense += boosts.defense || 0;
        pet.speed   += boosts.speed   || 0;
        await pet.save();

        const stageName = ["", "Baby", "Adult", "Legendary"][pet.stage];
        m.reply(
          `✨ *EVOLUTION!*\n${"═".repeat(24)}\n` +
          `${oldEmoji} ${oldName} → ${pet.emoji} ${newSpeciesData.name}\n` +
          `Stage: *${stageName}*\n` +
          `${"─".repeat(24)}\n` +
          `❤️ Max HP:  +${boosts.hp}\n` +
          `⚔️ ATK:    +${boosts.attack}\n` +
          `🛡️ DEF:    +${boosts.defense}\n` +
          `💨 SPD:    +${boosts.speed}\n` +
          `${"═".repeat(24)}\n` +
          `*${pet.name}* is now a mighty *${newSpeciesData.name}*! ${pet.emoji}`
        );
        break;
      }

      // ── PET LEADERBOARD ─────────────────────────────────────────────────
      case "petleader": {
        await doReact("🏆");
        const top = await Pet.find({ hp: { $gt: 0 } })
          .sort({ level: -1, wins: -1 })
          .limit(10);
        if (!top.length) return m.reply("🏆 No pets yet! Be the first to adopt with `-adopt <name>`");

        const medals = ["🥇","🥈","🥉"];
        let board = `🏆 *Pet Leaderboard*\n${"═".repeat(24)}\n`;
        for (let i = 0; i < top.length; i++) {
          const medal = medals[i] || `${i+1}.`;
          board +=
            `${medal} ${top[i].emoji} *${top[i].name}* (${SPECIES[top[i].species]?.name || top[i].species})\n` +
            `   Lv.${top[i].level} | ⚔️${top[i].attack} 🛡️${top[i].defense} | ${top[i].wins}W\n`;
        }
        m.reply(board);
        break;
      }

      // ── RENAME PET ──────────────────────────────────────────────────────
      case "renamepet": {
        await doReact("✏️");
        const pet = await Pet.findOne({ ownerId: sender });
        if (!pet) return m.reply(`❌ No pet! \`${prefix}adopt <name>\``);
        const newName = text?.trim();
        if (!newName) return m.reply(`Usage: \`${prefix}renamepet <new name>\``);
        if (newName.length > 20) return m.reply("❌ Name must be 20 characters or less.");
        const oldName = pet.name;
        pet.name = newName;
        await pet.save();
        m.reply(`✅ *${oldName}* has been renamed to *${newName}*! ${pet.emoji}`);
        break;
      }

      // ── RELEASE PET ─────────────────────────────────────────────────────
      case "releasepet": {
        await doReact("💔");
        const pet = await Pet.findOne({ ownerId: sender });
        if (!pet) return m.reply(`❌ You don't have a pet.`);

        if (text?.toLowerCase() !== "confirm") {
          return m.reply(
            `⚠️ Are you sure you want to release *${pet.emoji} ${pet.name}*?\n` +
            `This is *permanent* and cannot be undone.\n\n` +
            `Type \`${prefix}releasepet confirm\` to proceed.`
          );
        }

        const name  = pet.name;
        const emoji = pet.emoji;
        await Pet.deleteOne({ ownerId: sender });
        m.reply(`💔 You released *${emoji} ${name}*... goodbye forever.`);
        break;
      }

      default:
        break;
    }
  },
};