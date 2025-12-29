import mongoose from "mongoose";

const options = {
  maxPoolSize: 20,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000,
};

const connections: {
  main?: mongoose.Connection;
  accounts?: mongoose.Connection;
} = {};
console.log("🌐 DB Connect Module Loaded");

export const connectMainDB = async (): Promise<mongoose.Connection> => {
  if (connections.main) {
    console.log("ℹ️ Using existing Main DB connection");
    return connections.main;
  }

  const uri = process.env.DATABASE as string;
  if (!uri) throw new Error("❌ Missing DATABASE environment variable");

  console.log("🔌 Connecting to Main DB...");

  const conn = await mongoose.createConnection(uri, options);

  conn.on("connected", () => console.log("✅ Main DB: Connection Successful"));
  conn.on("error", (err) => console.error("❌ Main DB: Connection Error", err));
  conn.on("disconnected", () => console.warn("⚠️ Main DB: Disconnected"));

  connections.main = conn;
  return conn;
};

export const connectAccountsDB = async (): Promise<mongoose.Connection> => {
  if (connections.accounts) {
    console.log("ℹ️ Using existing Accounts DB connection");
    return connections.accounts;
  }

  const uri = process.env.DATABASE2 as string;
  if (!uri) throw new Error("❌ Missing DATABASE2 environment variable");

  console.log("🔌 Connecting to Accounts DB...");

  const conn = await mongoose.createConnection(uri, options);

  conn.on("connected", () => console.log("✅ Accounts DB: Connection Successful"));
  conn.on("error", (err) => console.error("❌ Accounts DB: Connection Error", err));
  conn.on("disconnected", () => console.warn("⚠️ Accounts DB: Disconnected"));

  connections.accounts = conn;
  return conn;
};
