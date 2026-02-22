import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IGameRound extends Document {
  gameId: string;
  roundNonce: number;
  crashPoint: number;
  serverSeed: string;
  seedHash: string;
  clientSeed: string;
  totalBets: number;
  totalWagered: number;
  totalPayout: number;
  playerCount: number;
  timestamp: Date;
}

const GameRoundSchema = new Schema<IGameRound>(
  {
    gameId: { type: String, required: true, index: true },
    roundNonce: { type: Number, required: true },
    crashPoint: { type: Number, required: true },
    serverSeed: { type: String, required: true },
    seedHash: { type: String, required: true },
    clientSeed: { type: String, required: true },
    totalBets: { type: Number, default: 0 },
    totalWagered: { type: Number, default: 0 },
    totalPayout: { type: Number, default: 0 },
    playerCount: { type: Number, default: 0 },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { collection: "game_history" }
);

GameRoundSchema.index({ gameId: 1, roundNonce: 1 }, { unique: true });

const GameRound: Model<IGameRound> =
  mongoose.models.GameRound || mongoose.model<IGameRound>("GameRound", GameRoundSchema);

export default GameRound;
