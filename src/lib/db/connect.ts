import mongoose from "mongoose";

const options = {
  maxPoolSize: 20,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000,
};

const backtestOptions = {
  maxPoolSize: 10,
  socketTimeoutMS: 30000,
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 5000,
  retryWrites: true,
  retryReads: true,
};

const connections: {
  main?: mongoose.Connection;
  accounts?: mongoose.Connection;
  backtest?: mongoose.Connection;
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

export const connectBacktestDB = async (): Promise<mongoose.Connection> => {
  if (connections.backtest && connections.backtest.readyState === 1) {
    console.log("ℹ️ Using existing Backtest DB connection");
    return connections.backtest;
  }

  // Clear stale connection if disconnected
  if (connections.backtest && connections.backtest.readyState !== 1) {
    console.log("⚠️ Backtest DB connection stale, reconnecting...");
    try {
      await connections.backtest.close();
    } catch (e) {
      // Ignore close errors
    }
    connections.backtest = undefined;
  }

  const uri = process.env.DATABASE3 as string;
  if (!uri) throw new Error("❌ Missing DATABASE3 environment variable");

  console.log("🔌 Connecting to Backtest DB...");

  try {
    const conn = await mongoose.createConnection(uri, backtestOptions);

    conn.on("connected", () => console.log("✅ Backtest DB: Connection Successful"));
    conn.on("error", (err) => {
      console.error("❌ Backtest DB: Connection Error", err.message);
      // Clear connection on error to force reconnect next time
      connections.backtest = undefined;
    });
    conn.on("disconnected", () => {
      console.warn("⚠️ Backtest DB: Disconnected");
      connections.backtest = undefined;
    });

    connections.backtest = conn;
    return conn;
  } catch (error: any) {
    console.error("❌ Backtest DB: Failed to connect -", error.message);
    throw error;
  }
};
