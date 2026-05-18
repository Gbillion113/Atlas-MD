import mongoose from "mongoose";

const UserPortfolioSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    stocks: [
      {
        symbol: String,
        shares: Number,
        buyPrice: Number,
        purchaseDate: Date,
        currentValue: Number,
      },
    ],
    totalInvested: {
      type: Number,
      default: 0,
    },
    totalValue: {
      type: Number,
      default: 0,
    },
    profitLoss: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: "user_portfolios",
  }
);

export default mongoose.model("UserPortfolio", UserPortfolioSchema);
