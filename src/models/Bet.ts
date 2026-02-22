import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IBet extends Document {
  userId: mongoose.Types.ObjectId;
  gameId: string;
  wager: number;
  multiplier: number;
  payout: number;
  result: "win" | "loss";
  meta?: Record<string, unknown>;
  timestamp: Date;
}

const BetSchema = new Schema<IBet>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    gameId: { type: String, required: true, index: true },
    wager: { type: Number, required: true, min: 0 },
    multiplier: { type: Number, required: true, default: 0 },
    payout: { type: Number, required: true, default: 0 },
    result: { type: String, enum: ["win", "loss"], required: true },
    meta: { type: Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { collection: "bets" }
);

BetSchema.index({ userId: 1, timestamp: -1 });

const Bet: Model<IBet> =
  mongoose.models.Bet || mongoose.model<IBet>("Bet", BetSchema);

export default Bet;
