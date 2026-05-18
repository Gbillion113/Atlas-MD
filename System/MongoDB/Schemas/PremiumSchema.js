import mongoose from "mongoose";

const PremiumSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    tier: {
      type: String,
      enum: ["silver", "gold", "diamond"],
      required: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    autoRenew: {
      type: Boolean,
      default: false,
    },
    paymentMethod: {
      type: String,
      enum: ["opay", "palmpay", "transfer", "manual"],
      default: "manual",
    },
    paymentProof: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    starterBonus: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: "premium_subscriptions",
  }
);

// Index for active subscriptions
PremiumSchema.index({ expiryDate: 1, isActive: 1 });

export default mongoose.model("Premium", PremiumSchema);
