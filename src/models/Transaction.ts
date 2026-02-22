import mongoose, { Schema, type Document, type Model } from "mongoose";

export type TransactionReason =
  | "GAME_WIN"
  | "GAME_LOSS"
  | "DAILY_REWARD"
  | "BONUS"
  | "DEPOSIT"
  | "WITHDRAWAL"
  | "ADMIN_ADJUSTMENT"
  | "REFERRAL";

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  reason: TransactionReason;
  description?: string;
  meta?: Record<string, unknown>;
  timestamp: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, required: true },
    balanceBefore: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    reason: {
      type: String,
      enum: [
        "GAME_WIN",
        "GAME_LOSS",
        "DAILY_REWARD",
        "BONUS",
        "DEPOSIT",
        "WITHDRAWAL",
        "ADMIN_ADJUSTMENT",
        "REFERRAL",
      ],
      required: true,
      index: true,
    },
    description: { type: String },
    meta: { type: Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { collection: "transactions" }
);

TransactionSchema.index({ userId: 1, timestamp: -1 });

const Transaction: Model<ITransaction> =
  mongoose.models.Transaction ||
  mongoose.model<ITransaction>("Transaction", TransactionSchema);

export default Transaction;
