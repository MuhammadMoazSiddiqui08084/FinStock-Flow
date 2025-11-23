import pg from "pg";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Get __dirname equivalent for ES modules (must be at top level)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
// When running from backend/, we need to go up one level
let envLoaded = false;

// Try current directory first
let envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  envLoaded = true;
  console.log(`✅ Loaded .env from: ${envPath}`);
} else {
  // Try parent directory (when running from backend/)
  envPath = path.resolve(process.cwd(), "..", ".env");
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    envLoaded = true;
    console.log(`✅ Loaded .env from: ${envPath}`);
  } else {
    // Try relative to this file
    envPath = path.resolve(__dirname, "..", ".env");
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
      envLoaded = true;
      console.log(`✅ Loaded .env from: ${envPath}`);
    }
  }
}

if (!envLoaded) {
  console.warn("⚠️ Could not find .env file. Using environment variables if set.");
}

const { Pool } = pg;

// Debug: Log environment variable loading
console.log("🔍 Checking environment variables...");
console.log("   DATABASE_URL:", process.env.DATABASE_URL ? "✅ Found" : "❌ Not found");
console.log("   Working directory:", process.cwd());

// Get DATABASE_URL from environment (load explicitly first)
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.warn("⚠️ DATABASE_URL not found in environment variables!");
} else {
  console.log("   DATABASE_URL length:", databaseUrl.length);
  // Show URL without password for security
  try {
    const url = new URL(databaseUrl);
    console.log("   Parsed URL:", `${url.protocol}//${url.username}@${url.host}${url.pathname}`);
  } catch (e) {
    console.log("   URL parse failed");
  }
}

// Use default if not set
const finalDatabaseUrl = databaseUrl || "postgresql://localhost:5432/finstock";

// Parse connection string and create config
function createPoolConfig(): pg.PoolConfig {
  // If no DATABASE_URL or not a postgresql:// URL, use defaults
  if (!finalDatabaseUrl || !finalDatabaseUrl.startsWith("postgresql://")) {
    return {
      user: "postgres",
      host: "localhost",
      port: 5432,
      database: "finstock",
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };
  }

  try {
    const url = new URL(finalDatabaseUrl);
    const config: pg.PoolConfig = {
      user: url.username || "postgres",
      password: url.password || undefined, // Ensure it's a string or undefined
      host: url.hostname || "localhost",
      port: parseInt(url.port || "5432", 10),
      database: url.pathname?.slice(1) || "finstock",
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };

    // Ensure password is always a string if present
    if (config.password !== undefined && typeof config.password !== "string") {
      config.password = String(config.password);
    }

    // Log connection info (without password)
    const passwordInfo = config.password ? `yes (${config.password.length} chars)` : "no";
    console.log(`📊 Database config: ${config.user}@${config.host}:${config.port}/${config.database} (password: ${passwordInfo})`);

    return config;
  } catch (error) {
    console.error("❌ Error parsing DATABASE_URL:", (error as Error).message);
    console.log("📊 Using default connection config");
    return {
      user: "postgres",
      host: "localhost",
      port: 5432,
      database: "finstock",
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };
  }
}

// Create PostgreSQL connection pool
const poolConfig = createPoolConfig();
const pool = new Pool(poolConfig);

// Test connection
pool.on("connect", () => {
  console.log("✅ Connected to PostgreSQL database");
});

pool.on("error", (err: Error) => {
  console.error("❌ PostgreSQL pool error:", err.message);
});

// Initialize database schema
async function initializeDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_email ON users(email);

      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        date TEXT NOT NULL,
        category TEXT NOT NULL,
        amount REAL NOT NULL,
        description TEXT,
        merchant TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_user_date ON transactions(user_id, date);
      CREATE INDEX IF NOT EXISTS idx_category ON transactions(category);

      CREATE TABLE IF NOT EXISTS forecasts (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        forecast_date TEXT NOT NULL,
        dates TEXT NOT NULL,
        balances TEXT NOT NULL,
        method TEXT DEFAULT 'prophet',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_user_forecast ON forecasts(user_id, forecast_date);

      CREATE TABLE IF NOT EXISTS anomalies (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        date TEXT NOT NULL,
        amount REAL NOT NULL,
        category TEXT,
        reason TEXT,
        severity TEXT,
        detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_user_anomaly ON anomalies(user_id, date);

      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        session_token TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_token ON sessions(session_token);
      CREATE INDEX IF NOT EXISTS idx_user_session ON sessions(user_id);
    `);
    console.log("✅ Database tables initialized");
  } catch (error) {
    console.error("❌ Error initializing database:", (error as Error).message);
    throw error;
  } finally {
    client.release();
  }
}

// Initialize on import with better error handling
initializeDatabase().catch((err: any) => {
  console.error("Failed to initialize database:", err.message || err);
  // Don't crash the app, just log the error
  // Connection will be retried on first query
});

export default pool;
