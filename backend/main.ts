// ...existing code...
/**
 * Simple JS fallback forecast: rolling average of last N days.
 * Returns { dates: string[], balances: number[] }
 */
export function simpleMovingAverageForecast(dailyBalances: {date: string, balance: number}[], days = 14) {
  const balances = dailyBalances.map(d => ({ date: d.date, balance: d.balance ?? 0 }));
  const window = 7;
  const resDates: string[] = [];
  const resBalances: number[] = [];

  for (let i = 0; i < days; i++) {
    const recent = balances.slice(-window).map(d => d.balance);
    const avg = recent.length ? recent.reduce((a,b)=>a+b,0) / recent.length : 0;
    const lastDate = new Date(balances.length ? balances[balances.length-1].date : Date.now());
    lastDate.setDate(lastDate.getDate() + 1 + i);
    resDates.push(lastDate.toISOString().slice(0,10));
    resBalances.push(Number((avg).toFixed(2)));
    const lastIdx = resBalances.length - 1;
    const prevVal = resBalances[lastIdx - 1] ?? resBalances[lastIdx];
    const jump = resBalances[lastIdx] - prevVal;
    const threshold = Math.max(50, Math.abs(prevVal) * 0.6);
    if (Math.abs(jump) > threshold) {
      resBalances[lastIdx] = Number((prevVal + Math.sign(jump) * threshold).toFixed(2));
    }
    balances.push({ date: resDates[resDates.length-1], balance: avg });
  }

  return { dates: resDates, balances: resBalances };
}

/**
 * Call Python Prophet service if available.
 * Expects service at PY_FORECAST_URL env var -> POST /predict {series: [{date, value}], days:14}
 */
export async function callPythonForecast(series: {date:string, value:number}[], days = 14) {
  const url = process.env.PY_FORECAST_URL;
  if (!url) throw new Error("PY_FORECAST_URL not configured");

  // prefer global fetch (Node 18+); fallback to dynamic import of node-fetch
  const _fetch: typeof fetch = (globalThis as any).fetch
    ? (globalThis as any).fetch
    : (await import('node-fetch')).default;

  const resp = await _fetch(`${url.replace(/\/$/,'')}/predict`, {
    method: "POST",
    headers: { "content-type":"application/json" },
    body: JSON.stringify({ series, days })
  });

  if (!resp.ok) {
    throw new Error(`Forecast service error: ${resp.statusText}`);
  }
  return resp.json();
}