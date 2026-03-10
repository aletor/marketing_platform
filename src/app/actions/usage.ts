"use server";

import { getUsageDb, UsageRecord } from "@/lib/usage-db";

export async function getOpenAIUsageAction() {
  try {
    const db = getUsageDb();
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyRecords = db.records.filter(r => {
      const date = new Date(r.timestamp);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    const totalCalls = monthlyRecords.length;
    const totalCost = monthlyRecords.reduce((sum, r) => sum + r.cost, 0);
    const totalInputTokens = monthlyRecords.reduce((sum, r) => sum + r.inputTokens, 0);
    const totalOutputTokens = monthlyRecords.reduce((sum, r) => sum + r.outputTokens, 0);

    return {
      success: true,
      stats: {
        totalCalls,
        totalCost: parseFloat(totalCost.toFixed(4)),
        totalInputTokens,
        totalOutputTokens,
        monthName: now.toLocaleString('es-ES', { month: 'long' }),
        recentCalls: db.records.slice(-5).reverse(),
        historicalTotalCalls: db.records.length
      }
    };
  } catch (error) {
    console.error("Error fetching usage stats:", error);
    return { success: false, stats: null };
  }
}
