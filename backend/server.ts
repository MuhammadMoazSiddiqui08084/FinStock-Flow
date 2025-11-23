import express, { Request, Response, NextFunction } from "express";
import multer from "multer";
import { parse } from "csv-parse/sync";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { fileURLToPath } from "url";
import db from "./db";
import { simpleMovingAverageForecast, callPythonForecast } from "./main";

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
// When running from backend/, we need to go up one level
const envPaths = [
  path.resolve(process.cwd(), ".env"), // Current directory
  path.resolve(process.cwd(), "..", ".env"), // Parent directory (when in backend/)
  path.resolve(__dirname, "..", ".env"), // Relative to this file
];

let envLoaded = false;
for (const envPath of envPaths) {
  const result = dotenv.config({ path: envPath });
  if (!result.error && fs.existsSync(envPath)) {
    envLoaded = true;
    console.log(`✅ Loaded .env from: ${envPath}`);
    break;
  }
}

if (!envLoaded) {
  console.warn("⚠️ Could not find .env file. Tried:", envPaths);
}

const app = express();
app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000" }));

// Ensure tmp directory exists
const tmpDir = path.join(process.cwd(), "tmp");
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
}

const upload = multer({ dest: tmpDir });

interface Transaction {
  date: string;
  category?: string;
  amount: number | string;
  description?: string;
  merchant?: string;
}

interface Action {
  id: string;
  title: string;
  change: { category?: string; pct?: number; amount?: number };
  buffer_gain_days: number;
  risk: "low" | "med" | "medium" | "high";
  explanation: string;
}

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Middleware to verify JWT token
const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    // Allow anonymous access but set userId to "anon"
    (req as any).userId = "anon";
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      (req as any).userId = "anon";
      return next();
    }
    (req as any).userId = String(user.id);
    (req as any).user = user;
    next();
  });
};

app.use(authenticateToken);

// Health check
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ========== AUTHENTICATION ENDPOINTS ==========

// POST /auth/register
app.post("/auth/register", async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    // Check if user exists
    const existingResult = await db.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existingResult.rows.length > 0) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert user
    const result = await db.query(
      "INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name",
      [email, passwordHash, name || null]
    );

    const user = result.rows[0];
    const userId = user.id;

    // Generate token
    const token = jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: "30d" });

    res.json({
      user: { id: userId, email: user.email, name: user.name },
      token,
    });
  } catch (error: any) {
    console.error("Register error:", error);
    res.status(500).json({ error: error.message || "Registration failed" });
  }
});

// POST /auth/login
app.post("/auth/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    // Find user
    const result = await db.query(
      "SELECT id, email, password_hash, name FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = result.rows[0];

    // Verify password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate token
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "30d" });

    res.json({
      user: { id: user.id, email: user.email, name: user.name },
      token,
    });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({ error: error.message || "Login failed" });
  }
});

// ========== TRANSACTION ENDPOINTS ==========

// POST /transactions - Add expense or revenue
app.post("/transactions", async (req: Request, res: Response) => {
  try {
    const { date, amount, category, description, merchant, userId, type } = req.body;
    const uid = userId || (req as any).userId || "anon";

    if (!date || amount === undefined || !category) {
      return res.status(400).json({ error: "Date, amount, and category required" });
    }

    // Ensure amount is negative for expenses, positive for revenue
    const finalAmount = type === "revenue" ? Math.abs(amount) : -Math.abs(amount);

    await db.query(
      "INSERT INTO transactions (user_id, date, category, amount, description, merchant) VALUES ($1, $2, $3, $4, $5, $6)",
      [uid, date, category, finalAmount, description || null, merchant || null]
    );

    res.json({ success: true, message: "Transaction added" });
  } catch (error: any) {
    console.error("Transaction error:", error);
    res.status(500).json({ error: error.message || "Failed to add transaction" });
  }
});

// GET /transactions - Get all transactions
app.get("/transactions", async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId || (req as any).userId || "anon";

    const result = await db.query(
      "SELECT id, date, category, amount, description, merchant FROM transactions WHERE user_id = $1 ORDER BY date DESC",
      [userId]
    );

    res.json(result.rows);
  } catch (error: any) {
    console.error("Get transactions error:", error);
    res.status(500).json({ error: error.message || "Failed to get transactions" });
  }
});

// GET /categories - Get spending by category
app.get("/categories", async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId || (req as any).userId || "anon";

    const result = await db.query(
      "SELECT category, SUM(amount) as total, COUNT(*) as count FROM transactions WHERE user_id = $1 GROUP BY category ORDER BY total ASC",
      [userId]
    );

    res.json(result.rows);
  } catch (error: any) {
    console.error("Get categories error:", error);
    res.status(500).json({ error: error.message || "Failed to get categories" });
  }
});

// POST /upload_csv
app.post("/upload_csv", upload.single("file"), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: "File required" });
  }

  try {
    const content = fs.readFileSync(req.file.path, "utf8");
    const records: Transaction[] = parse(content, {
      columns: true,
      skip_empty_lines: true,
      cast: true,
    });

    // Clean up uploaded file
    try {
      fs.unlinkSync(req.file.path);
    } catch {}

    const userId = req.body.userId || (req as any).userId || "anon";

    const client = await db.connect();
    try {
      // Begin transaction
      await client.query("BEGIN");

      try {
        for (const record of records) {
          const date = record.date || new Date().toISOString().slice(0, 10);
          const category = record.category || "uncategorized";
          const amount = Number(record.amount || 0);
          const description = record.description || null;
          const merchant = record.merchant || null;

          await client.query(
            "INSERT INTO transactions (user_id, date, category, amount, description, merchant) VALUES ($1, $2, $3, $4, $5, $6)",
            [userId, date, category, amount, description, merchant]
          );
        }

        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }

      // Return parsed data grouped by date and category
      const result = await db.query(
        "SELECT date, category, SUM(amount) as amount FROM transactions WHERE user_id = $1 GROUP BY date, category ORDER BY date",
        [userId]
      );

      res.json({
        success: true,
        parsed: result.rows,
        count: records.length,
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("Upload error:", error);
    res.status(500).json({ error: error.message || "Failed to process CSV" });
  }
});

// GET /forecast?userId=...&days=14
app.get("/forecast", async (req: Request, res: Response) => {
  try {
    const userId = String(req.query.userId || "anon");
    const days = parseInt(String(req.query.days || "14"));

    // Get historical transactions grouped by date
    const result = await db.query(
      "SELECT date, SUM(amount) as amount FROM transactions WHERE user_id = $1 GROUP BY date ORDER BY date",
      [userId]
    );

    const rows = result.rows as Array<{ date: string; amount: number }>;

    if (rows.length === 0) {
      return res.json({ dates: [], balances: [] });
    }

    // Calculate daily balances (assuming starting balance from last transaction or 0)
    // For simplicity, we'll treat amounts as expenses (negative)
    const daily: Array<{ date: string; balance: number }> = rows.map((r) => ({
      date: r.date,
      balance: -Number(r.amount || 0),
    }));

    // Try Prophet first, fallback to moving average
    let forecast: { dates: string[]; balances: number[] };
    let method = "moving_average";

    try {
      if (process.env.PY_FORECAST_URL) {
        const series = daily.map((d) => ({ date: d.date, value: d.balance }));
        forecast = await callPythonForecast(series, days);
        method = "prophet";
      } else {
        forecast = simpleMovingAverageForecast(daily, days);
      }
    } catch (error) {
      console.error("Forecast error, using fallback:", error);
      forecast = simpleMovingAverageForecast(daily, days);
    }

    // Store forecast in database
    const forecastDate = new Date().toISOString().slice(0, 10);
    await db.query(
      "INSERT INTO forecasts (user_id, forecast_date, dates, balances, method) VALUES ($1, $2, $3, $4, $5)",
      [
        userId,
        forecastDate,
        JSON.stringify(forecast.dates),
        JSON.stringify(forecast.balances),
        method,
      ]
    );

    res.json(forecast);
  } catch (error: any) {
    console.error("Forecast error:", error);
    res.status(500).json({ error: error.message || "Failed to generate forecast" });
  }
});

// POST /actions - Generate 3 ranked actions using Grok API
app.post("/actions", async (req: Request, res: Response) => {
  try {
    const { forecast, categories, userId } = req.body;

    if (!forecast || !categories) {
      return res.status(400).json({ error: "forecast and categories required" });
    }

    // Check for Grok API key
    const apiKey = process.env.GROK_API_KEY;

    if (!apiKey) {
      // Return mock actions if no API key
      console.log("⚠️ No GROK_API_KEY, returning mock actions");
      const mockActions: Action[] = [
        {
          id: "a1",
          title: "Reduce Food by 20%",
          change: { category: "Food & Dining", pct: 20 },
          buffer_gain_days: 6,
          risk: "low",
          explanation: "Reduce dining out frequency",
        },
        {
          id: "a2",
          title: "Pause subscriptions ($35)",
          change: { category: "Subscriptions", amount: 35 },
          buffer_gain_days: 2,
          risk: "med",
          explanation: "Cancel extras",
        },
        {
          id: "a3",
          title: "Use public transit 2x/wk",
          change: { category: "Transport", pct: 15 },
          buffer_gain_days: 4,
          risk: "low",
          explanation: "Switch trips to cheaper modes",
        },
      ];
      return res.json({ actions: mockActions });
    }

    // Call Grok API
    try {
      const _fetch: typeof fetch = (globalThis as any).fetch
        ? (globalThis as any).fetch
        : (await import("node-fetch")).default;

      const prompt = `You are a financial advisor AI. Given the following cashflow forecast and spending categories, generate exactly 3 actionable recommendations ranked by impact.

Forecast data:
${JSON.stringify(forecast, null, 2)}

Spending categories:
${JSON.stringify(categories, null, 2)}

Return a JSON array of exactly 3 actions. Each action must have:
- id: unique string (e.g., "a1", "a2", "a3")
- title: short action title (max 50 chars)
- change: object with either {category: string, pct: number} for percentage reduction, or {category: string, amount: number} for fixed amount reduction
- buffer_gain_days: number of days gained before going negative
- risk: one of "low", "med", or "high"
- explanation: one sentence explanation (max 80 chars)

Output ONLY valid JSON array, no markdown or extra text:
`;

      const response = await _fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "grok-beta",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 800,
        }),
      });

      if (!response.ok) {
        // Don't log full error text as it may contain sensitive info
        const statusText = response.statusText;
        try {
          const errorText = await response.text();
          const errorObj = JSON.parse(errorText);
          if (errorObj.error?.includes("API key") || errorObj.error?.includes("Incorrect API key")) {
            console.warn("⚠️ Grok API key invalid or expired (using mock data)");
          } else {
            console.warn("⚠️ Grok API error (using mock data):", statusText);
          }
        } catch {
          console.warn("⚠️ Grok API error (using mock data):", statusText);
        }
        throw new Error(`Grok API error: ${statusText}`);
      }

      const data = await response.json();
      let text = data.choices?.[0]?.message?.content || "";

      // Clean up markdown if present
      text = text.replace(/```json/g, "").replace(/```/g, "").trim();

      // Try to extract JSON array from response
      let actions: Action[] = [];
      try {
        // Try parsing as-is
        actions = JSON.parse(text);
      } catch {
        // Try to find JSON array in text
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          actions = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("Could not parse JSON from Grok response");
        }
      }

      // Validate and ensure we have exactly 3 actions
      if (!Array.isArray(actions) || actions.length === 0) {
        throw new Error("Invalid actions format");
      }

      // Ensure exactly 3 actions
      if (actions.length < 3) {
        // Pad with mock actions if needed
        while (actions.length < 3) {
          actions.push({
            id: `a${actions.length + 1}`,
            title: `Action ${actions.length + 1}`,
            change: { category: "Other", pct: 10 },
            buffer_gain_days: 2,
            risk: "med",
            explanation: "Additional recommendation",
          });
        }
      }

      res.json({ actions: actions.slice(0, 3) });
    } catch (error: any) {
      console.warn("⚠️ Grok API unavailable (using mock actions):", error.message || error);
      // Return mock actions on error
      const mockActions: Action[] = [
        {
          id: "a1",
          title: "Reduce Food by 20%",
          change: { category: "Food & Dining", pct: 20 },
          buffer_gain_days: 6,
          risk: "low",
          explanation: "Reduce dining out frequency",
        },
        {
          id: "a2",
          title: "Pause subscriptions ($35)",
          change: { category: "Subscriptions", amount: 35 },
          buffer_gain_days: 2,
          risk: "med",
          explanation: "Cancel extras",
        },
        {
          id: "a3",
          title: "Use public transit 2x/wk",
          change: { category: "Transport", pct: 15 },
          buffer_gain_days: 4,
          risk: "low",
          explanation: "Switch trips to cheaper modes",
        },
      ];
      res.json({ actions: mockActions });
    }
  } catch (error: any) {
    console.error("Actions error:", error);
    res.status(500).json({ error: error.message || "Failed to generate actions" });
  }
});

// POST /simulate - Apply action and recompute forecast
app.post("/simulate", async (req: Request, res: Response) => {
  try {
    const { userId = "anon", action } = req.body;

    if (!action) {
      return res.status(400).json({ error: "action required" });
    }

    // Get historical transactions
    const result = await db.query(
      "SELECT date, category, SUM(amount) as amount FROM transactions WHERE user_id = $1 GROUP BY date, category ORDER BY date",
      [userId]
    );

    const rows = result.rows as Array<{ date: string; category: string; amount: number }>;

    // Build daily spend map (category -> date -> amount)
    const dailySpend: Record<string, Record<string, number>> = {};
    for (const row of rows) {
      const cat = row.category || "uncategorized";
      if (!dailySpend[cat]) {
        dailySpend[cat] = {};
      }
      dailySpend[cat][row.date] = (dailySpend[cat][row.date] || 0) + Number(row.amount || 0);
    }

    // Apply action modifications
    const modifiedSpend: Record<string, Record<string, number>> = JSON.parse(
      JSON.stringify(dailySpend)
    );

    const targetCategory = action.change?.category;
    if (targetCategory && modifiedSpend[targetCategory]) {
      if (action.change.pct !== undefined) {
        // Apply percentage reduction
        for (const date in modifiedSpend[targetCategory]) {
          modifiedSpend[targetCategory][date] = Number(
            (modifiedSpend[targetCategory][date] * (1 - action.change.pct / 100)).toFixed(2)
          );
        }
      } else if (action.change.amount !== undefined) {
        // Apply fixed amount reduction (distribute across dates)
        const dates = Object.keys(modifiedSpend[targetCategory]);
        const reductionPerDate = action.change.amount / Math.max(dates.length, 1);
        for (const date of dates) {
          modifiedSpend[targetCategory][date] = Math.max(
            0,
            Number((modifiedSpend[targetCategory][date] - reductionPerDate).toFixed(2))
          );
        }
      }
    }

    // Convert to daily balances (before and after)
    const buildDailyBalances = (spendMap: Record<string, Record<string, number>>) => {
      const dateMap: Record<string, number> = {};
      for (const cat in spendMap) {
        for (const date in spendMap[cat]) {
          dateMap[date] = (dateMap[date] || 0) + spendMap[cat][date];
        }
      }
      return Object.entries(dateMap)
        .map(([date, amount]) => ({ date, balance: -amount }))
        .sort((a, b) => a.date.localeCompare(b.date));
    };

    const before = buildDailyBalances(dailySpend);
    const after = buildDailyBalances(modifiedSpend);

    // Generate forecasts for both scenarios
    const days = 14;
    let forecastBefore: { dates: string[]; balances: number[] };
    let forecastAfter: { dates: string[]; balances: number[] };

    try {
      if (process.env.PY_FORECAST_URL) {
        const seriesBefore = before.map((d) => ({ date: d.date, value: d.balance }));
        const seriesAfter = after.map((d) => ({ date: d.date, value: d.balance }));
        forecastBefore = await callPythonForecast(seriesBefore, days);
        forecastAfter = await callPythonForecast(seriesAfter, days);
      } else {
        forecastBefore = simpleMovingAverageForecast(before, days);
        forecastAfter = simpleMovingAverageForecast(after, days);
      }
    } catch (error) {
      forecastBefore = simpleMovingAverageForecast(before, days);
      forecastAfter = simpleMovingAverageForecast(after, days);
    }

    // Calculate metrics
    const findFirstNegativeDay = (balances: number[]): number | null => {
      const idx = balances.findIndex((v) => v < 0);
      return idx === -1 ? null : idx + 1;
    };

    const beforeFirstNegative = findFirstNegativeDay(forecastBefore.balances);
    const afterFirstNegative = findFirstNegativeDay(forecastAfter.balances);
    const improvementDays =
      beforeFirstNegative && afterFirstNegative
        ? afterFirstNegative - beforeFirstNegative
        : afterFirstNegative
        ? 999
        : 0;

    const deltaBalance =
      forecastAfter.balances[forecastAfter.balances.length - 1] -
      forecastBefore.balances[forecastBefore.balances.length - 1];

    // Generate explanation using Grok
    let explanation = "";
    try {
      const apiKey = process.env.GROK_API_KEY;
      if (apiKey) {
        const _fetch: typeof fetch = (globalThis as any).fetch
          ? (globalThis as any).fetch
          : (await import("node-fetch")).default;

        const prompt = `Explain this financial simulation result in one concise sentence (max 80 chars):

Action: ${action.title}
Before first negative day: ${beforeFirstNegative || "Never"}
After first negative day: ${afterFirstNegative || "Never"}
Balance improvement: $${deltaBalance.toFixed(2)}

Provide a brief, encouraging explanation:`;

        const response = await _fetch("https://api.x.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "grok-beta",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
            max_tokens: 100,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          explanation = data.choices?.[0]?.message?.content?.trim() || "";
        } else {
          console.warn("⚠️ Grok API error for explanation (using fallback)");
        }
      }
    } catch (error) {
      console.warn("⚠️ Explanation generation error (using fallback):", (error as Error).message);
    }

    if (!explanation) {
      explanation = `This action would delay negative balance by ${improvementDays} days and improve final balance by $${Math.abs(deltaBalance).toFixed(2)}.`;
    }

    res.json({
      before: forecastBefore,
      after: forecastAfter,
      metrics: {
        before_first_negative_day: beforeFirstNegative,
        after_first_negative_day: afterFirstNegative,
        improvement_days: improvementDays,
        delta_balance: Number(deltaBalance.toFixed(2)),
      },
      explanation,
    });
  } catch (error: any) {
    console.error("Simulate error:", error);
    res.status(500).json({ error: error.message || "Failed to simulate action" });
  }
});

// POST /explain_simulation - Generate explanation for simulation result
app.post("/explain_simulation", async (req: Request, res: Response) => {
  try {
    const { originalBalance, newBalance, reductions, action } = req.body;

    const apiKey = process.env.GROK_API_KEY;
    if (!apiKey) {
      return res.json({
        explanation: `This simulation shows a change from $${originalBalance} to $${newBalance}.`,
      });
    }

    const _fetch: typeof fetch = (globalThis as any).fetch
      ? (globalThis as any).fetch
      : (await import("node-fetch")).default;

    const reductionSummary = reductions
      ? Object.entries(reductions)
          .filter(([_, val]: [string, any]) => val > 0)
          .map(([key, val]: [string, any]) => `${key} by ${val}%`)
          .join(", ")
      : "";

    const prompt = `Explain this financial simulation in one concise sentence (max 80 chars):

Original Balance: $${originalBalance}
New Projected Balance: $${newBalance}
${reductionSummary ? `Cuts: ${reductionSummary}` : ""}
${action ? `Action: ${action.title || ""}` : ""}

Provide a brief, encouraging explanation:`;

    const response = await _fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-beta",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 100,
      }),
    });

    if (!response.ok) {
      throw new Error(`Grok API error: ${response.statusText}`);
    }

    const data = await response.json();
    const explanation = data.choices?.[0]?.message?.content?.trim() || "";

    res.json({ explanation });
  } catch (error: any) {
    console.error("Explain simulation error:", error);
    res.status(500).json({ error: error.message || "Failed to generate explanation" });
  }
});

// GET /anomalies?userId=... - Detect anomalies in spending
app.get("/anomalies", async (req: Request, res: Response) => {
  try {
    const userId = String(req.query.userId || "anon");

    // Get transactions
    const result = await db.query(
      "SELECT date, category, SUM(amount) as amount FROM transactions WHERE user_id = $1 GROUP BY date, category ORDER BY date",
      [userId]
    );

    const rows = result.rows as Array<{ date: string; category: string; amount: number }>;

    if (rows.length === 0) {
      return res.json({ anomalies: [] });
    }

    // Calculate statistics per category
    const categoryStats: Record<string, { amounts: number[]; mean: number; std: number }> = {};

    for (const row of rows) {
      const cat = row.category || "uncategorized";
      if (!categoryStats[cat]) {
        categoryStats[cat] = { amounts: [], mean: 0, std: 0 };
      }
      categoryStats[cat].amounts.push(Number(row.amount || 0));
    }

    // Calculate mean and standard deviation for each category
    for (const cat in categoryStats) {
      const amounts = categoryStats[cat].amounts;
      const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const variance =
        amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length;
      const std = Math.sqrt(variance);
      categoryStats[cat].mean = mean;
      categoryStats[cat].std = std;
    }

    // Detect anomalies (amount > mean + 2*std)
    const anomalies: Array<{
      date: string;
      category: string;
      amount: number;
      reason: string;
      severity: "low" | "medium" | "high";
    }> = [];

    const client = await db.connect();
    try {
      await client.query("BEGIN");

      for (const row of rows) {
        const cat = row.category || "uncategorized";
        const amount = Number(row.amount || 0);
        const stats = categoryStats[cat];

        if (stats && stats.std > 0) {
          const zScore = (amount - stats.mean) / stats.std;

          if (Math.abs(zScore) > 2) {
            const severity: "low" | "medium" | "high" =
              Math.abs(zScore) > 3 ? "high" : Math.abs(zScore) > 2.5 ? "medium" : "low";
            const reason =
              zScore > 0
                ? `Unusually high spending (${zScore.toFixed(1)}σ above average)`
                : `Unusually low spending (${Math.abs(zScore).toFixed(1)}σ below average)`;

            const anomaly = {
              date: row.date,
              category: cat,
              amount,
              reason,
              severity,
            };

            anomalies.push(anomaly);

            // Store in database
            await client.query(
              "INSERT INTO anomalies (user_id, date, amount, category, reason, severity) VALUES ($1, $2, $3, $4, $5, $6)",
              [userId, row.date, amount, cat, reason, severity]
            );
          }
        }
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    res.json({ anomalies });
  } catch (error: any) {
    console.error("Anomalies error:", error);
    res.status(500).json({ error: error.message || "Failed to detect anomalies" });
  }
});

// POST /upload_excel - Upload Excel file and parse using Python service
app.post("/upload_excel", upload.single("file"), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: "File required" });
  }

  const client = await db.connect();
  try {
    const userId = req.body.userId || (req as any).userId || "anon";
    const excelServiceUrl = process.env.EXCEL_PARSER_URL || "http://localhost:5001";

    // Read file content
    const fileContent = fs.readFileSync(req.file.path);

    // Use form-data for node-fetch
    const FormData = (await import("form-data")).default;
    const form = new FormData();
    form.append("file", fileContent, {
      filename: req.file.originalname || req.file.filename,
      contentType: req.file.mimetype,
    });
    form.append("userId", userId);

    // Call Python Excel parser service
    const _fetch: typeof fetch = (globalThis as any).fetch
      ? (globalThis as any).fetch
      : (await import("node-fetch")).default;

    const excelResponse = await _fetch(`${excelServiceUrl}/parse`, {
      method: "POST",
      body: form as any,
      headers: form.getHeaders(),
    });

    // Clean up uploaded file
    try {
      fs.unlinkSync(req.file.path);
    } catch {}

    if (!excelResponse.ok) {
      const errorData = await excelResponse.json();
      return res.status(400).json({ error: errorData.error || "Failed to parse Excel file" });
    }

    const excelData = await excelResponse.json();

    if (!excelData.success || !excelData.transactions) {
      return res.status(400).json({ error: "Failed to parse Excel file" });
    }

    // Begin transaction for inserts
    await client.query("BEGIN");

    try {
      for (const tx of excelData.transactions) {
        await client.query(
          "INSERT INTO transactions (user_id, date, category, amount, description, merchant) VALUES ($1, $2, $3, $4, $5, $6)",
          [
            userId,
            tx.date,
            tx.category,
            tx.amount,
            tx.description || null,
            tx.merchant || null,
          ]
        );
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }

    res.json({
      success: true,
      parsed: excelData.transactions,
      count: excelData.count,
    });
  } catch (error: any) {
    console.error("Excel upload error:", error);
    // Clean up uploaded file
    try {
      if (req.file?.path) {
        fs.unlinkSync(req.file.path);
      }
    } catch {}
    res.status(500).json({ error: error.message || "Failed to process Excel file" });
  } finally {
    client.release();
  }
});

const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || "0.0.0.0";

app.listen(Number(PORT), HOST, () => {
  console.log(`🚀 Backend server running on http://${HOST}:${PORT}`);
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    try {
      const url = new URL(dbUrl);
      const hasPassword = url.password ? "yes" : "no";
      console.log(`📊 Database: PostgreSQL (${url.username}@${url.hostname}:${url.port || "5432"}/${url.pathname?.slice(1) || "finstock"}, password: ${hasPassword})`);
    } catch {
      console.log(`📊 Database: PostgreSQL (DATABASE_URL configured)`);
    }
  } else {
    console.log(`📊 Database: PostgreSQL (not configured - using default)`);
  }
  console.log(`🤖 Prophet service: ${process.env.PY_FORECAST_URL || "Not configured (using fallback)"}`);
  console.log(`📄 Excel parser: ${process.env.EXCEL_PARSER_URL || "Not configured"}`);
  console.log(`🔑 Grok API: ${process.env.GROK_API_KEY ? "Configured" : "Not configured (using mocks)"}`);
});
