"use server";

import { getGeneratedDb, saveGeneratedDb, addToGeneratedDb, GeneratedItem } from "@/lib/generated-db";

export async function getLibraryItemsAction() {
  try {
    const db = getGeneratedDb();
    return { success: true, items: db.items };
  } catch (error) {
    console.error("Error fetching library items:", error);
    return { success: false, items: [] };
  }
}

export async function deleteLibraryItemAction(id: string) {
  try {
    const db = getGeneratedDb();
    db.items = db.items.filter(item => item.id !== id);
    saveGeneratedDb(db);
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete item" };
  }
}

export async function duplicateLibraryItemAction(id: string) {
  try {
    const db = getGeneratedDb();
    const itemToDuplicate = db.items.find(item => item.id === id);
    if (!itemToDuplicate) throw new Error("Item not found");

    const duplicatedItem = addToGeneratedDb({
      campaignId: itemToDuplicate.campaignId,
      type: itemToDuplicate.type,
      title: `${itemToDuplicate.title} (Copia)`,
      preview: itemToDuplicate.preview,
      content: JSON.parse(JSON.stringify(itemToDuplicate.content)), // Deep clone
      metadata: itemToDuplicate.metadata
    });

    return { success: true, item: duplicatedItem };
  } catch (error) {
    return { success: false, error: "Failed to duplicate item" };
  }
}

export async function updateLibraryItemAction(id: string, newContent: any, newTitle?: string) {
  try {
    const db = getGeneratedDb();
    const itemIndex = db.items.findIndex(item => item.id === id);
    if (itemIndex === -1) throw new Error("Item not found");

    db.items[itemIndex].content = newContent;
    if (newTitle) db.items[itemIndex].title = newTitle;
    
    saveGeneratedDb(db);
    return { success: true, item: db.items[itemIndex] };
  } catch (error) {
    return { success: false, error: "Failed to update item" };
  }
}

export async function updateLibraryItemCampaignAction(id: string, newCampaignId: string) {
  try {
    const db = getGeneratedDb();
    const itemIndex = db.items.findIndex(item => item.id === id);
    if (itemIndex === -1) throw new Error("Item not found");

    db.items[itemIndex].campaignId = newCampaignId;
    
    saveGeneratedDb(db);
    return { success: true, item: db.items[itemIndex] };
  } catch (error) {
    return { success: false, error: "Failed to update item campaign" };
  }
}
