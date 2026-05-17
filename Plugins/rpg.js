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
          const prices = Object.entries(rpgSellPrices).map(([k,v]) => `${k}: $${v}`).join("\n");
          return m.reply(`💰 *RPG Sell Prices:*\n\n${prices}\n\nUsage: *${prefix}sellitem <item> [amount]*`);
        }
        const parts = text.split(" ");
        const itemName = parts[0].toLowerCase();
        const amount = parseInt(parts[1]) || 1;
        const user = await player.findOne({ id: m.sender });
        if (!user) return m.reply(`Register first with *${prefix}register*`);
        if (!rpgSellPrices[itemName]) return m.reply(`❌ Can't sell that item!`);
        const owned = user.inventory[itemName] || 0;
        if (owned < amount) return m.reply(`❌ You only have ${owned}x ${itemName}!`);
        const earnings = rpgSellPrices[itemName] * amount;
        user.inventory[itemName] -= amount;
        await user.save();
        // Add to economy wallet
        const EcoUser = mongoose.models.EcoUser;
        if (EcoUser) {
          const ecoUser = await EcoUser.findOne({ id: m.sender });
          if (ecoUser) await EcoUser.findOneAndUpdate({ id: m.sender }, { wallet: ecoUser.wallet + earnings });
          else await EcoUser.create({ id: m.sender, wallet: earnings });
        }
        m.reply(`✅ Sold *${amount}x ${itemName}* for *$${earnings}*!\nCheck your wallet with *${prefix}wallet*`);
        break;
      }