"use server";

import { getCampaignsDb, deleteCampaign as dbDeleteCampaign } from "@/lib/campaigns-db";
import { getGeneratedDb, saveGeneratedDb } from "@/lib/generated-db";

export async function getCampaignsAction() {
  try {
    const db = getCampaignsDb();
    return { success: true, campaigns: db.campaigns };
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return { success: false, campaigns: [] };
  }
}

export async function deleteCampaignAction(id: string) {
  try {
    // Delete campaign
    dbDeleteCampaign(id);
    
    // Delete all associated generated assets
    const genDb = getGeneratedDb();
    genDb.items = genDb.items.filter(item => item.campaignId !== id);
    saveGeneratedDb(genDb);

    return { success: true };
  } catch (error) {
    console.error("Error deleting campaign:", error);
    return { success: false, error: "Failed to delete campaign" };
  }
}
