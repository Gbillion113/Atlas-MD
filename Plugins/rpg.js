import mongoose from "mongoose";

const User = mongoose.models.EcoUser;

const mineCooldowns = new Map();

const MINE_COOLDOWN = 30000;

export default {
  name: "rpg",

  alias: [
    "mine",
    "hunt",
    "digmine",
    "chop",
  ],

  uniquecommands: [
    "mine",
  ],

  description: "RPG Mining System",

  start: async (
    Atlas,
    m,
    {
      prefix,
      inputCMD,
      doReact,
      args,
    }
  ) => {

    const user = await User.findOne({
      id: m.sender,
    });

    if (!user) {
      return m.reply(
        `Register first by using economy commands.`
      );
    }

    switch (inputCMD) {

      case "mine":
      case "hunt":
      case "digmine":
      case "chop": {

        await doReact("⛏️");

        const lastMine =
          mineCooldowns.get(m.sender);

        if (
          lastMine &&
          Date.now() - lastMine <
            MINE_COOLDOWN
        ) {
          const left = Math.ceil(
            (
              MINE_COOLDOWN -
              (Date.now() - lastMine)
            ) / 1000
          );

          return m.reply(
            `⏳ Wait ${left}s before mining again.`
          );
        }

        const tool = args[0];

        if (!tool) {
          return m.reply(
            `⛏️ Choose a tool:

${prefix}mine woodenaxe
${prefix}mine stonepickaxe
${prefix}mine ironpickaxe
${prefix}mine diamondpickaxe`
          );
        }

        const validTools = [
          "woodenaxe",
          "stonepickaxe",
          "ironpickaxe",
          "diamondpickaxe",
        ];

        if (!validTools.includes(tool)) {
          return m.reply(
            `❌ Invalid tool!`
          );
        }

        const owned =
          user.inventory.get(tool) || 0;

        if (owned < 1) {
          return m.reply(
            `❌ You don't own a ${tool}!\nBuy one using ${prefix}buy ${tool}`
          );
        }

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

        const table =
          lootTables[tool];

        const loot = {
          wood:
            Math.floor(
              Math.random() *
                table.wood[1]
            ) + table.wood[0],

          stone:
            Math.floor(
              Math.random() *
                table.stone[1]
            ) + table.stone[0],

          iron:
            Math.floor(
              Math.random() *
                table.iron[1]
            ) + table.iron[0],

          diamonds:
            Math.floor(
              Math.random() *
                table.diamonds[1]
            ) + table.diamonds[0],
        };

        user.inventory.set(
          "wood",
          (
            user.inventory.get("wood") || 0
          ) + loot.wood
        );

        user.inventory.set(
          "stone",
          (
            user.inventory.get("stone") || 0
          ) + loot.stone
        );

        user.inventory.set(
          "iron",
          (
            user.inventory.get("iron") || 0
          ) + loot.iron
        );

        user.inventory.set(
          "diamonds",
          (
            user.inventory.get(
              "diamonds"
            ) || 0
          ) + loot.diamonds
        );

        let msg =
`⛏️ MINE RESULT

🔨 Tool: ${tool}

🔥 Wood: ${loot.wood}
🪨 Stone: ${loot.stone}
⚙️ Iron: ${loot.iron}
💎 Diamonds: ${loot.diamonds}`;

        if (
          tool ===
            "diamondpickaxe" &&
          Math.random() <= 0.05
        ) {
          user.inventory.set(
            "goldenapple",
            (
              user.inventory.get(
                "goldenapple"
              ) || 0
            ) + 1
          );

          msg +=
`\n\n🍎 BONUS:
You found a Golden Apple!`;
        }

        user.xp += 20;

        const needed =
          user.level * 100;

        if (user.xp >= needed) {
          user.level += 1;
          user.xp = 0;

          msg +=
`\n\n⭐ LEVEL UP!
You are now level ${user.level}!`;
        }

        await user.save();

        mineCooldowns.set(
          m.sender,
          Date.now()
        );

        m.reply(msg);

        break;
      }

      default:
        break;
    }
  },
};