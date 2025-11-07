import mongoose, { Schema, Document } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { connectMainDB } from "@/lib/db/connect";
import {
  IUserAccount,
  IOtherData,
  IUserNotification,
  IUserToken,
} from "@/types/user";

export interface IUser extends Document {
  uniqueId: string;
  fullName: string;
  email: string;
  phone: number;
  countryCode: string;
  country: string;
  bio?: string;
  profilePicture?: string;
  isEmailVerified: boolean;
  signUpVerificationToken?: string;
  password: string;
  cpassword: string;
  date: Date;
  accountValue: number;
  tokens: IUserToken[];
  accounts: IUserAccount[];
  otherData: IOtherData;
  notifications: IUserNotification[];
  generateAuthToken(): Promise<string>;
}

const userSchema = new Schema<IUser>({
    
  uniqueId: { type: String, required: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: Number, required: true },
  countryCode: { type: String, required: true },
  country: { type: String, required: true },
  bio: String,
  profilePicture: String,
  isEmailVerified: { type: Boolean, required: true, default: false },
  signUpVerificationToken: String,
  password: { type: String, required: true },
  cpassword: { type: String, required: true },
  date: { type: Date, default: Date.now },
  accountValue: { type: Number, default: 0 },
  tokens: [
    {
      token: { type: String, required: true },
      createdAt: { type: Date, default: Date.now, required: true },
    },
  ],
  accounts: [Schema.Types.Mixed],
  otherData: Schema.Types.Mixed,
  notifications: [
    {
      notify: { type: String, required: true },
      date: String,
    },
  ],
});

// 🔒 Hash passwords before save
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 12);
    this.cpassword = await bcrypt.hash(this.cpassword, 12);
  }
  next();
});

// 🔑 JWT Generator
userSchema.methods.generateAuthToken = async function (): Promise<string> {
  const token = jwt.sign(
    { _id: this._id.toString() },
    process.env.SECRET_KEY as string,
    { expiresIn: "5d" }
  );

  this.tokens.push({ token, createdAt: new Date() });

  // Keep only last 2 tokens
  if (this.tokens.length > 2) {
    this.tokens = this.tokens.slice(-2);
  }

  await this.save();
  return token;
};

// ✅ Export function to get model (important for serverless)
export const getUserModel = async () => {
  const conn = await connectMainDB();
  return conn.models.USERS || conn.model<IUser>("USERS", userSchema);
};
