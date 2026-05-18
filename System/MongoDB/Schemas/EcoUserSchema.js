import mongoose from "mongoose";

const EcoUserSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      description: "WhatsApp JID (e.g., '1234567890@s.whatsapp.net')",
    },
    balance: {
      type: Number,
      default: 1000,
      description: "Current balance in game currency",
    },
    tier: {
      type: String,
      enum: ["free", "silver", "gold", "diamond"],
      default: "free",
      description: "Subscription tier level",
    },
    totalEarned: {
      type: Number,
      default: 0,
      description: "Total money earned (all-time)",
    },
    totalSpent: {
      type: Number,
      default: 0,
      description: "Total money spent (all-time)",
    },
    dailyCommandCount: {
      type: Number,
      default: 0,
      description: "Commands used today (resets daily)",
    },
    lastDailyReset: {
      type: Date,
      default: new Date(),
      description: "Last time daily limits were reset",
    },
    level: {
      type: Number,
      default: 1,
      description: "Player level",
    },
    experience: {
      type: Number,
      default: 0,
      description: "Experience points",
    },
    streak: {
      type: Number,
      default: 0,
      description: "Daily login/activity streak",
    },
    lastActive: {
      type: Date,
      default: new Date(),
      description: "Last command usage timestamp",
    },
    stats: {
      fish: {
        type: Number,
        default: 0,
        description: "Fish caught",
      },
      dig: {
        type: Number,
        default: 0,
        description: "Holes dug",
      },
      work: {
        type: Number,
        default: 0,
        description: "Jobs completed",
      },
      gambles: {
        type: Number,
        default: 0,
        description: "Gambles played",
      },
      heists: {
        type: Number,
        default: 0,
        description: "Heists participated",
      },
      robberies: {
        type: Number,
        default: 0,
        description: "Players robbed",
      },
      robbedBy: {
        type: Number,
        default: 0,
        description: "Times robbed by others",
      },
    },
    inventory: {
      type: Map,
      of: Number,
      default: new Map(),
      description: "Items in inventory (item: quantity)",
    },
    premiumExpiry: {
      type: Date,
      default: null,
      description: "When premium subscription expires",
    },
    isBanned: {
      type: Boolean,
      default: false,
      description: "Account banned from economy system",
    },
    banReason: {
      type: String,
      default: null,
      description: "Reason for ban",
    },
  },
  {
    timestamps: true,
    collection: "economy_users",
  }
);

// Index for quick tier lookups
EcoUserSchema.index({ tier: 1 });
EcoUserSchema.index({ balance: -1 }); // For leaderboard

export default mongoose.model("EcoUser", EcoUserSchema);
