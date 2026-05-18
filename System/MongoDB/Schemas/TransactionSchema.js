import mongoose from "mongoose";

const TransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "daily",
        "work",
        "fish",
        "dig",
        "gamble",
        "rob",
        "heist",
        "buy",
        "sell",
        "transfer",
        "admin",
      ],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    relatedUser: {
      type: String,
      default: null,
      description: "For transactions involving another user (rob, transfer)",
    },
    success: {
      type: Boolean,
      default: true,
    },
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: new Map(),
    },
  },
  {
    timestamps: true,
    collection: "economy_transactions",
  }
);

// Index for user transaction history
TransactionSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model("Transaction", TransactionSchema);
