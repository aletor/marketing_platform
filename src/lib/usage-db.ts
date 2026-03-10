import fs from 'fs';
import path from 'path';

const USAGE_DB_PATH = path.join(process.cwd(), 'data', 'usage-db.json');

export interface UsageRecord {
  timestamp: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
}

export function getUsageDb(): { records: UsageRecord[] } {
  try {
    if (!fs.existsSync(path.dirname(USAGE_DB_PATH))) {
      fs.mkdirSync(path.dirname(USAGE_DB_PATH), { recursive: true });
    }
    if (!fs.existsSync(USAGE_DB_PATH)) {
      const initialDb = { records: [] };
      fs.writeFileSync(USAGE_DB_PATH, JSON.stringify(initialDb, null, 2));
      return initialDb;
    }
    const data = fs.readFileSync(USAGE_DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading usage database:", error);
    return { records: [] };
  }
}

export function saveUsageDb(db: { records: UsageRecord[] }) {
  try {
    fs.writeFileSync(USAGE_DB_PATH, JSON.stringify(db, null, 2));
  } catch (error) {
    console.error("Error saving usage database:", error);
  }
}

// Approximate costs per 1M tokens (Mar 2024 prices)
const PRICES: Record<string, { input: number; output: number }> = {
  'gpt-4o': { input: 5, output: 15 },
  'gpt-4o-mini': { input: 0.15, output: 0.60 },
  'dall-e-3': { input: 0, output: 0 } // Standalone cost per image, handled differently
};

export function logUsage(model: string, inputTokens: number, outputTokens: number) {
  const db = getUsageDb();
  
  let cost = 0;
  if (model === 'dall-e-3') {
    cost = 0.04; // Standard HD image cost
  } else {
    const price = PRICES[model] || PRICES['gpt-4o-mini'];
    cost = (inputTokens / 1_000_000) * price.input + (outputTokens / 1_000_000) * price.output;
  }

  const record: UsageRecord = {
    timestamp: new Date().toISOString(),
    model,
    inputTokens,
    outputTokens,
    cost
  };

  db.records.push(record);
  saveUsageDb(db);
}
