import mongoose from "mongoose";

const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  bufferCommands: false, // Prevent buffering when connection is not ready
};

// Global cache for connection promises to prevent race conditions during initialization
// In Next.js/Vercel, we need to persist these across hot reloads and function invocations
declare global {
  var _mongooseConnections: {
    main?: Promise<mongoose.Connection>;
    accounts?: Promise<mongoose.Connection>;
    workers?: Promise<mongoose.Connection>;
  };
}

const connections = global._mongooseConnections || (global._mongooseConnections = {});
console.log("🌐 DB Connect Module Loaded");

export const connectMainDB = async (): Promise<mongoose.Connection> => {
  if (connections.main) {
    const conn = await connections.main;
    if (conn.readyState === 1) {
      return conn;
    }
    console.log("⚠️ Main DB connection exists but is not open, re-connecting...");
    delete connections.main;
  }

  const uri = process.env.DATABASE as string;
  if (!uri) throw new Error("❌ Missing DATABASE environment variable");

  console.log("🔌 Connecting to Main DB...");

  connections.main = (async () => {
    try {
      const conn = await mongoose.createConnection(uri, options).asPromise();
      console.log("✅ Main DB: Connection Successful");

      conn.on("error", (err) => {
        console.error("❌ Main DB: Connection Error", err);
        delete connections.main;
      });
      conn.on("disconnected", () => {
        console.warn("⚠️ Main DB: Disconnected");
        delete connections.main;
      });

      return conn;
    } catch (error) {
      console.error("❌ Main DB: Initial Connection Failed", error);
      delete connections.main;
      throw error;
    }
  })();

  return connections.main;
};

export const connectAccountsDB = async (): Promise<mongoose.Connection> => {
  if (connections.accounts) {
    const conn = await connections.accounts;
    if (conn.readyState === 1) {
      return conn;
    }
    console.log("⚠️ Accounts DB connection exists but is not open, re-connecting...");
    delete connections.accounts;
  }

  const uri = process.env.DATABASE2 as string;
  if (!uri) throw new Error("❌ Missing DATABASE2 environment variable");

  console.log("🔌 Connecting to Accounts DB...");

  connections.accounts = (async () => {
    try {
      const conn = await mongoose.createConnection(uri, options).asPromise();
      console.log("✅ Accounts DB: Connection Successful");

      conn.on("error", (err) => {
        console.error("❌ Accounts DB: Connection Error", err);
        delete connections.accounts;
      });
      conn.on("disconnected", () => {
        console.warn("⚠️ Accounts DB: Disconnected");
        delete connections.accounts;
      });

      return conn;
    } catch (error) {
      console.error("❌ Accounts DB: Initial Connection Failed", error);
      delete connections.accounts;
      throw error;
    }
  })();

  return connections.accounts;
};

export const connectWorkersDB = async (): Promise<mongoose.Connection> => {
  if (connections.workers) {
    const conn = await connections.workers;
    if (conn.readyState === 1) {
      return conn;
    }
    console.log("⚠️ Workers DB connection exists but is not open, re-connecting...");
    delete connections.workers;
  }

  const uri = process.env.DATABASE3 as string;
  if (!uri) throw new Error("❌ Missing DATABASE3 environment variable");

  console.log("🔌 Connecting to Workers DB...");

  connections.workers = (async () => {
    try {
      const conn = await mongoose.createConnection(uri, options).asPromise();
      console.log("✅ Workers DB: Connection Successful");

      conn.on("error", (err) => {
        console.error("❌ Workers DB: Connection Error", err);
        delete connections.workers;
      });
      conn.on("disconnected", () => {
        console.warn("⚠️ Workers DB: Disconnected");
        delete connections.workers;
      });

      return conn;
    } catch (error) {
      console.error("❌ Workers DB: Initial Connection Failed", error);
      delete connections.workers;
      throw error;
    }
  })();

  return connections.workers;
};
