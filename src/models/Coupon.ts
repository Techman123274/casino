import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface ICoupon extends Document {
  code: string;
  reward: number;
  maxUses: number;
  currentUses: number;
  usedBy: mongoose.Types.ObjectId[];
  expiresAt?: Date;
  isActive: boolean;
  createdAt: Date;
}

const CouponSchema = new Schema<ICoupon>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    reward: { type: Number, required: true, min: 1 },
    maxUses: { type: Number, required: true, default: 100 },
    currentUses: { type: Number, default: 0 },
    usedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    expiresAt: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: "coupons" }
);

const Coupon: Model<ICoupon> =
  mongoose.models.Coupon || mongoose.model<ICoupon>("Coupon", CouponSchema);

export default Coupon;
