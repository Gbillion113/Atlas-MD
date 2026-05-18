import mongoose from "mongoose";

const HeistSchema = new mongoose.Schema(
  {
    heistId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    groupId: {
      type: String,
      required: true,
      index: true,
    },
    leader: {
      type: String,
      required: true,
    },
    members: [
      {
        userId: String,
        contribution: Number,
        share: Number,
      },
    ],
    bankBalance: {
      type: Number,
      default: 10000,
    },
    totalStolen: {
      type: Number,
      default: 0,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "easy",
    },
    successChance: {
      type: Number,
      default: 50,
    },
    status: {
      type: String,
      enum: ["planning", "in-progress", "completed", "failed"],
      default: "planning",
    },
    startTime: {
      type: Date,
      default: null,
    },
    endTime: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "economy_heists",
  }
);

export default mongoose.model("Heist", HeistSchema);
