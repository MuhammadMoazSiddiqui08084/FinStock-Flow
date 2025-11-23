// ...existing code...
import express from "express";
import multer from "multer";
import csvParse from "csv-parse";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import db from "./db";
import { simpleMovingAverageForecast, callPythonForecast } from "../main";

dotenv.config();
const upload = multer({ dest: "tmp/" });
const app = express();
app.use(express.json());

// POST /upload_csv
app.post("/upload_csv", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).send({ error: "file required" });
  const content = fs.readFileSync(req.file.path, "utf8");
  csvParse(content, { columns: true, skip_empty_lines: true }, (err: any, records: any[]) => {
    try { fs.unlinkSync(req.file.path); } catch {}
    if (err) return res.status(400).send({ error: err.message });

    const insert = db.prepare("INSERT INTO transactions (user_id, date, category, amount) VALUES (?, ?, ?, ?)");
    const userId = (req.body.userId as string) || "anon";
    const stmt = db.transaction((rows: any[]) => {
      for (const r of rows) {
        const date = r.date;
        const cat = r.category || "uncategorized";
        const amt = Number(r.amount || 0);
        insert.run(userId, date, cat, amt);
      }
    });
    try { stmt(records); } catch (e:any) { return res.status(500).send({ error: e.message }); }

    const rows = db.prepare("SELECT date, category, SUM(amount) as amount FROM transactions WHERE user_id = ? GROUP BY date, category ORDER BY date").all(userId);
    res.send({ parsed: rows });
  });
});

// GET /forecast?userId=...
app.get("/forecast", async (req, res) => {
  const userId = String(req.query.userId || "anon");
  const rows = db.prepare("SELECT date, SUM(amount) as amount FROM transactions WHERE user_id = ? GROUP BY date ORDER BY date").all(userId);
  const daily = rows.map((r: any) => ({ date: r.date, balance: -Number(r.amount) }));
  try {
    if (process.env.PY_FORECAST_URL) {
      const py = await callPythonForecast(daily.map(d => ({ date: d.date, value: d.balance })), 14);
      return res.json(py);
    } else {
      const m = simpleMovingAverageForecast(daily, 14);
      return res.json(m);
    }
  } catch (e: any) {
    const m = simpleMovingAverageForecast(daily, 14);
    return res.json(m);
  }
});

// POST /actions  (Grok/OpenAI)
app.post("/actions", async (req, res) => {
  const { forecast, categories } = req.body;
  if (!process.env.GROK_API_KEY) {
    return res.json({
      actions: [
        { id: "a1", title: "Reduce Food by 20%", change: { category: "Food & Dining", pct: 20 }, buffer_gain_days: 6, risk: "low", explanation: "Reduce dining out frequency" },
        { id: "a2", title: "Pause subscriptions ($35)", change: { category: "Subscriptions", amount: 35 }, buffer_gain_days: 2, risk: "med", explanation: "Cancel extras" },
        { id: "a3", title: "Use public transit 2x/wk", change: { category: "Transport", pct: 15 }, buffer_gain_days: 4, risk: "low", explanation: "Switch trips to cheaper modes" }
      ]
    });
  }

  try {
    // dynamic fetch: use global fetch on Node 18+ else import node-fetch
    let _fetch: any = (globalThis as any).fetch;
    if (!_fetch) {
      _fetch = (await import("node-fetch")).default;
    }
    const apiKey = process.env.GROK_API_KEY!;
    const prompt = `Generate 3 JSON actions from forecast. Forecast: ${JSON.stringify(forecast)}. Categories: ${JSON.stringify(categories)}. Output JSON array.`;
    const r = await _fetch("https://api.grok.ai/v1/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({ prompt, max_tokens: 600 })
    });
    const jr = await r.json();
    const text = jr.output_text || jr.choices?.[0]?.text || JSON.stringify([]);
    let actions = [];
    try { actions = JSON.parse(text); } catch { actions = [{ title: text }] }
    return res.json({ actions });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// POST /simulate
app.post("/simulate", async (req, res) => {
  const { userId = "anon", action } = req.body;
  const rows = db.prepare("SELECT date, category, SUM(amount) as amount FROM transactions WHERE user_id = ? GROUP BY date, category ORDER BY date").all(userId);
  const dailyMap: Record<string, number> = {};
  for (const r of rows) {
    const key = r.date;
    dailyMap[key] = (dailyMap[key] || 0) + Number(r.amount);
  }
  const mod: Record<string, number> = {};
  for (const k of Object.keys(dailyMap)) mod[k] = dailyMap[k];

  if (action?.change?.pct || action?.change?.amount) {
    for (const d of Object.keys(mod)) {
      if (action.change.pct) {
        mod[d] = Number((mod[d] * (1 - action.change.pct/100)).toFixed(2));
      } else if (action.change.amount) {
        mod[d] = Number((mod[d] - action.change.amount).toFixed(2));
      }
    }
  }

  const before = Object.keys(dailyMap).map(k => ({ date: k, balance: -dailyMap[k] }));
  const after = Object.keys(mod).map(k => ({ date: k, balance: -mod[k] }));
  const usePy = !!process.env.PY_FORECAST_URL;
  const forecastBefore = usePy ? await callPythonForecast(before, 14).catch(()=>simpleMovingAverageForecast(before,14)) : simpleMovingAverageForecast(before,14);
  const forecastAfter  = usePy ? await callPythonForecast(after, 14).catch(()=>simpleMovingAverageForecast(after,14)) : simpleMovingAverageForecast(after,14);

  const firstNeg = (arr: number[]) => {
    const idx = arr.findIndex(v => v < 0);
    return idx === -1 ? null : idx + 1;
  };
  const metric = {
    before_first_negative_day: firstNeg(forecastBefore.balances),
    after_first_negative_day: firstNeg(forecastAfter.balances),
    delta_balance: Number((forecastAfter.balances[forecastAfter.balances.length-1] - forecastBefore.balances[forecastBefore.balances.length-1]).toFixed(2))
  };

  res.json({ before: forecastBefore, after: forecastAfter, metrics: metric });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, ()=> console.log(`API listening ${PORT}`));