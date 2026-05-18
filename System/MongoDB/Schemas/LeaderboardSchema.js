import mongoose from "mongoose";

const LeaderboardSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    username: {
      type: String,
      default: "Unknown",
    },
    balance: {
      type: Number,
      default: 0,
    },
    tier: {
      type: String,
      enum: ["free", "silver", "gold", "diamond"],
      default: "free",
    },
    totalEarned: {
      type: Number,
      default: 0,
    },
    rank: {
      type: Number,
      default: 0,
    },
    level: {
      type: Number,
      default: 1,
    },
    streak: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: "economy_leaderboard",
  }
);

// Index for ranking
LeaderboardSchema.index({ balance: -1 });
LeaderboardSchema.index({ tier: 1, balance: -1 });
LeaderboardSchema.index({ level: -1 });

export default mongoose.model("Leaderboard", LeaderboardSchema);
