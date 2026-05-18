import mongoose from "mongoose";

const StockSchema = new mongoose.Schema(
  {
    stockSymbol: {
      type: String,
      required: true,
      unique: true,
      index: true,
      maxlength: 5,
    },
    companyName: {
      type: String,
      required: true,
    },
    currentPrice: {
      type: Number,
      required: true,
      default: 100,
    },
    previousPrice: {
      type: Number,
      default: 100,
    },
    priceHistory: [
      {
        price: Number,
        timestamp: Date,
      },
    ],
    volatility: {
      type: Number,
      default: 5,
      description: "Percentage volatility",
    },
    trend: {
      type: String,
      enum: ["up", "down", "stable"],
      default: "stable",
    },
  },
  {
    timestamps: true,
    collection: "economy_stocks",
  }
);

export default mongoose.model("Stock", StockSchema);
