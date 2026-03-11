import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface CacheEntry {
  hash: string;
  prompt: string;
  response: string;
  model: string;
  timestamp: string;
}

export interface CacheDatabase {
  entries: Record<string, CacheEntry>;
}

const CACHE_FILE_PATH = path.join(process.cwd(), 'data', 'semantic-cache.json');

/**
 * Ensures the cache database file exists.
 */
function ensureCacheDb(): void {
  try {
    const dir = path.dirname(CACHE_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(CACHE_FILE_PATH)) {
      const initialDb: CacheDatabase = { entries: {} };
      fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(initialDb, null, 2), 'utf-8');
    }
  } catch (error) {
    console.warn("Could not ensure cache DB:", error);
  }
}

/**
 * Gets the current cache database.
 */
export function getCacheDb(): CacheDatabase {
  try {
    ensureCacheDb();
    const data = fs.readFileSync(CACHE_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.warn("Could not read cache DB, returning empty object:", error);
    return { entries: {} };
  }
}

/**
 * Saves the cache database.
 */
function saveCacheDb(db: CacheDatabase): void {
  try {
    fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(db, null, 2), 'utf-8');
  } catch (error) {
    console.warn("Could not save cache DB:", error);
  }
}

/**
 * Generates a SHA-256 hash for a given prompt string and model.
 */
export function generateCacheHash(model: string, systemPrompt: string, userPrompt: string): string {
  const payload = `${model}::${systemPrompt}::${userPrompt}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
}

/**
 * Checks if a response exists in the cache for the given parameters.
 */
export function getSemanticCache(model: string, systemPrompt: string, userPrompt: string): string | null {
  const hash = generateCacheHash(model, systemPrompt, userPrompt);
  const db = getCacheDb();
  
  if (db.entries[hash]) {
    console.log(`[CACHE HIT] Responding from Semantic Cache (Model: ${model}, Hash: ${hash.substring(0,8)}...)`);
    return db.entries[hash].response;
  }
  
  console.log(`[CACHE MISS] Fetching fresh from OpenAI (Model: ${model}, Hash: ${hash.substring(0,8)}...)`);
  return null;
}

/**
 * Stores a new response in the semantic cache.
 */
export function setSemanticCache(model: string, systemPrompt: string, userPrompt: string, response: string): void {
  const hash = generateCacheHash(model, systemPrompt, userPrompt);
  const db = getCacheDb();
  
  db.entries[hash] = {
    hash,
    prompt: userPrompt.substring(0, 500) + '...', // Store a preview for debugability
    response,
    model: model,
    timestamp: new Date().toISOString()
  };
  
  saveCacheDb(db);
}
