"use server";

import { getCampaignsDb } from "@/lib/campaigns-db";
import { getGeneratedDb } from "@/lib/generated-db";

export async function getCampaignDetailsAction(campaignId: string) {
  try {
    const cDb = getCampaignsDb();
    const gDb = getGeneratedDb();

    const campaign = cDb.campaigns.find(c => c.id === campaignId);
    if (!campaign) {
      return { success: false, error: "Campaign not found" };
    }

    const assets = gDb.items.filter(item => item.campaignId === campaignId);

    return { 
      success: true, 
      campaign,
      assets 
    };
  } catch (error) {
    console.error("Error fetching campaign details:", error);
    return { success: false, error: "Server error" };
  }
}
