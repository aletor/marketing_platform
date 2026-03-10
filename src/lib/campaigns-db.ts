import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'campaigns-db.json');

export interface CampaignRecord {
  id: string;
  theme: string;
  status: 'Draft' | 'Active' | 'Completed';
  createdAt: string;
  briefing: any; 
  metadata?: any;
}

export function getCampaignsDb(): { campaigns: CampaignRecord[] } {
  try {
    if (!fs.existsSync(path.dirname(DB_PATH))) {
      fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    }
    if (!fs.existsSync(DB_PATH)) {
      const initialDb = { campaigns: [] };
      fs.writeFileSync(DB_PATH, JSON.stringify(initialDb, null, 2));
      return initialDb;
    }
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading campaigns database:", error);
    return { campaigns: [] };
  }
}

export function saveCampaignsDb(db: { campaigns: CampaignRecord[] }) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  } catch (error) {
    console.error("Error saving campaigns database:", error);
  }
}

export function createCampaign(theme: string, briefing: any): CampaignRecord {
  const db = getCampaignsDb();
  const newCampaign: CampaignRecord = {
    id: crypto.randomUUID(),
    theme,
    status: 'Active',
    createdAt: new Date().toISOString(),
    briefing
  };
  db.campaigns.unshift(newCampaign);
  saveCampaignsDb(db);
  return newCampaign;
}

export function getCampaignById(id: string): CampaignRecord | undefined {
    const db = getCampaignsDb();
    return db.campaigns.find(c => c.id === id);
}

export function updateCampaignStatus(id: string, status: 'Draft' | 'Active' | 'Completed') {
    const db = getCampaignsDb();
    const campaign = db.campaigns.find(c => c.id === id);
    if(campaign) {
        campaign.status = status;
        saveCampaignsDb(db);
    }
}

export function deleteCampaign(id: string) {
    const db = getCampaignsDb();
    db.campaigns = db.campaigns.filter(c => c.id !== id);
    saveCampaignsDb(db);
}
