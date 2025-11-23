// llmService.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

// Helper to get API key in both Browser (Vite) and Node (Test) environments
const getApiKey = () => {
    // Check for Vite environment variable
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
        return import.meta.env.VITE_GEMINI_API_KEY;
    }
    // Check for Node environment variable
    if (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) {
        return process.env.GEMINI_API_KEY;
    }
    return '';
};

// Initialize Gemini
const genAI = new GoogleGenerativeAI(getApiKey());
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

// HACKATHON TIP: Use a flag to switch between Real AI and Mock Data
// Set MOCK_LLM=true in your .env file to save money and speed up dev
const getMockFlag = () => {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
        return import.meta.env.VITE_MOCK_LLM === 'true';
    }
    if (typeof process !== 'undefined' && process.env) {
        return process.env.MOCK_LLM === 'true';
    }
    return false;
}

const USE_MOCK = getMockFlag();

// Types for your team
interface FinancialContext {
    currentBalance: number;
    negativeDayIndex: number; // e.g., 6 (runs out in 6 days)
    topCategories: { name: string; amount: number }[]; // e.g., [{name: 'Food', amount: 500}]
}

export async function generateActions(context: FinancialContext) {
    if (USE_MOCK) {
        console.log("⚠️ Returning MOCK actions");
        return [
            {
                title: "Defer Utility Bill",
                change: "Delay payment by 7 days",
                buffer_gain_days: 4,
                risk: "Low",
                explanation: "Most utility providers offer a grace period without penalty."
            },
            {
                title: "Cut Dining Out",
                change: "Reduce food budget by 30%",
                buffer_gain_days: 2,
                risk: "Medium",
                explanation: "Switching to home cooking for 5 days saves approx $150."
            },
            {
                title: "Micro-Gig Income",
                change: "Take 1 Upwork shift",
                buffer_gain_days: 3,
                risk: "High",
                explanation: "Requires immediate time investment but provides instant cash."
            }
        ];
    }

    const prompt = `
    You are FinStock Flow, an empathetic but highly strategic financial crisis manager.
    Your goal is to help a user who is running out of money extend their runway.

    Context:
    - Current Balance: $${context.currentBalance}
    - Days until $0: ${context.negativeDayIndex}
    - Top Spending Categories: ${JSON.stringify(context.topCategories)}

    Task: Generate EXACTLY 3 specific, high-impact, and immediately actionable steps.
    
    Output Requirements:
    - Return ONLY valid JSON.
    - Format: { "actions": [{ "title": string, "change": string, "buffer_gain_days": number, "risk": "Low"|"Medium"|"High", "explanation": string }] }
    - "explanation": A persuasive, 1-sentence reason (max 80 chars).
    - "change": Concrete action (e.g., "Switch to generic brands", "Sell unused electronics").
    - "risk": Assess the lifestyle impact or difficulty.
    - Do not include markdown formatting like \`\`\`json.
  `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // Clean up markdown if present
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        const data = JSON.parse(text);
        return data.actions;
    } catch (error) {
        console.error("LLM Error:", error);
        // Fallback to empty array or mock data if API fails
        return [];
    }
}


export async function explainSimulation(originalBalance: number, newBalance: number, reductions: Record<string, number>) {
    if (USE_MOCK) {
        return {
            days_before_negative: 12,
            improvement_days: 6,
            brief_explain: "Cutting expenses by this amount significantly slows your burn rate."
        };
    }

    const reductionSummary = Object.entries(reductions)
        .filter(([_, val]) => val > 0)
        .map(([key, val]) => `${key} by ${val}%`)
        .join(", ");

    const prompt = `
    You are a financial simulation engine.
    
    Scenario:
    - Original Balance: $${originalBalance}
    - New Projected Balance: $${newBalance}
    - User's Proposed Cuts: ${reductionSummary || "None"}

    Task: Analyze the impact of these changes on the user's financial survival.
    
    Output Requirements:
    - Return ONLY valid JSON.
    - Format: { "days_before_negative": number, "improvement_days": number, "brief_explain": "string" }
    - "days_before_negative": Estimate new days until $0 (assume daily burn is approx $100 if unknown).
    - "improvement_days": How many EXTRA days they gained vs baseline.
    - "brief_explain": A punchy, encouraging 1-sentence summary of the impact.
    - Do not include markdown formatting like \`\`\`json.
  `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // Clean up markdown if present
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(text);
    } catch (error) {
        console.error("LLM Error:", error);
        return {
            days_before_negative: 0,
            improvement_days: 0,
            brief_explain: "Could not analyze simulation."
        };
    }
}

export async function analyzeCSV(csvText: string) {
    if (USE_MOCK) {
        return {
            summary: "Analyzed 150 transactions. Top spending in Food ($450) and Transport ($200).",
            flagged_transactions: [
                { date: "2023-10-12", description: "Unknown Merchant", amount: 120, reason: "Unusual high amount" }
            ],
            advice: "Consider setting a stricter budget for dining out."
        };
    }

    // Truncate CSV if too long to avoid token limits (simple heuristic)
    const truncatedCSV = csvText.split('\n').slice(0, 50).join('\n');

    const prompt = `
    You are a forensic financial analyst.
    
    Task: Analyze the following CSV transaction history (first 50 lines provided).
    CSV Data:
    ${truncatedCSV}

    Output Requirements:
    - Return ONLY valid JSON.
    - Format: { 
        "summary": "Brief summary of spending patterns (max 2 sentences)",
        "flagged_transactions": [{ "date": string, "description": string, "amount": number, "reason": string }],
        "advice": "One strategic piece of advice based on this data"
      }
    - Flag up to 3 transactions that look suspicious, wasteful, or unusually high.
    - Do not include markdown formatting like \`\`\`json.
  `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // Clean up markdown if present
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(text);
    } catch (error) {
        console.error("LLM Error:", error);
        return {
            summary: "Failed to analyze CSV.",
            flagged_transactions: [],
            advice: "Please try again with a smaller file."
        };
    }
}