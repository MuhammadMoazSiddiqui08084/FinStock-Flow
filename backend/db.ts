import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL not found in environment variables!");
  throw new Error("DATABASE_URL is required in production");
}

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // required for Railway
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on("connect", () => console.log("✅ Connected to PostgreSQL database"));
pool.on("error", (err) => console.error("❌ PostgreSQL pool error:", err.message));

export default pool;
