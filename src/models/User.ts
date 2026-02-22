import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IVault {
  bonusCredits: mongoose.Types.Decimal128;
  wageredCredits: mongoose.Types.Decimal128;
  lifetimeEarnings: mongoose.Types.Decimal128;
}

export interface IDepositLimits {
  daily: string;
  weekly: string;
  monthly: string;
}

export interface IUser extends Document {
  // Identity
  username: string;
  email: string;
  hashedPassword: string;
  image?: string;
  emailVerified?: Date;
  avatar: string;

  // Rapid Credits economy
  credits: mongoose.Types.Decimal128;
  vault: IVault;
  lastClaimed?: Date;

  // Legacy (kept for migration compatibility)
  balance: mongoose.Types.Decimal128;
  totalWagered: mongoose.Types.Decimal128;
  totalProfit: mongoose.Types.Decimal128;

  // Leveling
  vipLevel: number;
  xpProgress: number;

  // Security
  lastLoginIp?: string;
  lastLoginAt?: Date;
  lastLoginDevice?: string;
  twoFactorEnabled: boolean;
  passkeyEnabled: boolean;
  isSelfExcluded: boolean;
  selfExcludeUntil?: Date;

  // Responsible Gaming
  depositLimits: IDepositLimits;
  sessionTimeout: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const VaultSchema = new Schema<IVault>(
  {
    bonusCredits: {
      type: Schema.Types.Decimal128,
      default: mongoose.Types.Decimal128.fromString("0.00"),
    },
    wageredCredits: {
      type: Schema.Types.Decimal128,
      default: mongoose.Types.Decimal128.fromString("0.00"),
    },
    lifetimeEarnings: {
      type: Schema.Types.Decimal128,
      default: mongoose.Types.Decimal128.fromString("0.00"),
    },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
      match: /^[a-zA-Z0-9_]+$/,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    hashedPassword: {
      type: String,
      required: true,
    },
    image: { type: String },
    emailVerified: { type: Date },
    avatar: { type: String, default: "👻" },

    credits: {
      type: Schema.Types.Decimal128,
      default: mongoose.Types.Decimal128.fromString("100.00"),
    },
    vault: {
      type: VaultSchema,
      default: () => ({}),
    },
    lastClaimed: { type: Date },

    balance: {
      type: Schema.Types.Decimal128,
      default: mongoose.Types.Decimal128.fromString("0.00"),
    },
    totalWagered: {
      type: Schema.Types.Decimal128,
      default: mongoose.Types.Decimal128.fromString("0.00"),
    },
    totalProfit: {
      type: Schema.Types.Decimal128,
      default: mongoose.Types.Decimal128.fromString("0.00"),
    },

    vipLevel: { type: Number, default: 0, min: 0, max: 100 },
    xpProgress: { type: Number, default: 0, min: 0 },

    lastLoginIp: { type: String },
    lastLoginAt: { type: Date },
    lastLoginDevice: { type: String },
    twoFactorEnabled: { type: Boolean, default: false },
    passkeyEnabled: { type: Boolean, default: false },
    isSelfExcluded: { type: Boolean, default: false },
    selfExcludeUntil: { type: Date },

    depositLimits: {
      type: new Schema(
        {
          daily: { type: String, default: "None" },
          weekly: { type: String, default: "None" },
          monthly: { type: String, default: "None" },
        },
        { _id: false }
      ),
      default: () => ({}),
    },
    sessionTimeout: { type: String, default: "None" },
  },
  {
    timestamps: true,
    collection: "users",
    toJSON: {
      transform(_doc: any, ret: any) {
        if (ret.credits) ret.credits = ret.credits.toString();
        if (ret.balance) ret.balance = ret.balance.toString();
        if (ret.totalWagered) ret.totalWagered = ret.totalWagered.toString();
        if (ret.totalProfit) ret.totalProfit = ret.totalProfit.toString();
        if (ret.vault) {
          if (ret.vault.bonusCredits) ret.vault.bonusCredits = ret.vault.bonusCredits.toString();
          if (ret.vault.wageredCredits) ret.vault.wageredCredits = ret.vault.wageredCredits.toString();
          if (ret.vault.lifetimeEarnings) ret.vault.lifetimeEarnings = ret.vault.lifetimeEarnings.toString();
        }
        delete ret.hashedPassword;
        return ret;
      },
    },
  }
);

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
