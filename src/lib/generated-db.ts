import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'generated-db.json');

export interface GeneratedItem {
  id: string;
  campaignId: string; // Relational link to the Campaign
  type: 'article' | 'social' | 'marketing' | 'image';
  title: string;
  date: string;
  preview: string;
  content: any; // Full generated object
  metadata?: any;
}

export function getGeneratedDb(): { items: GeneratedItem[] } {
  try {
    if (!fs.existsSync(path.dirname(DB_PATH))) {
      fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    }
    if (!fs.existsSync(DB_PATH)) {
      const initialDb = { items: [] };
      fs.writeFileSync(DB_PATH, JSON.stringify(initialDb, null, 2));
      return initialDb;
    }
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading generated database:", error);
    return { items: [] };
  }
}

export function saveGeneratedDb(db: { items: GeneratedItem[] }) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  } catch (error) {
    console.error("Error saving generated database:", error);
  }
}

export function addToGeneratedDb(item: Omit<GeneratedItem, 'id' | 'date'> & { campaignId?: string }) {
  const db = getGeneratedDb();
  const newItem: GeneratedItem = {
    ...item,
    campaignId: item.campaignId || 'draft',
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
  };
  db.items.unshift(newItem); // Newest first
  saveGeneratedDb(db);
  return newItem;
}
