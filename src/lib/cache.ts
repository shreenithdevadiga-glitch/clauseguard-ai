import crypto from "node:crypto";
import { ContractAnalysis } from "./types";

const MAX_CACHE_ENTRIES = 50;
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes

interface CacheEntry {
  value: ContractAnalysis;
  expiresAt: number;
}

const auditCache = new Map<string, CacheEntry>();

/**
 * Generates a deterministic SHA-256 cache key for a contract text payload.
 */
export function buildContractCacheKey(text: string): string {
  return crypto.createHash("sha256").update(text.trim()).digest("hex");
}

/**
 * Retrieves a cached contract analysis if present and not expired.
 */
export function getCachedAudit(key: string): ContractAnalysis | null {
  const entry = auditCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    auditCache.delete(key);
    return null;
  }
  return entry.value;
}

/**
 * Stores a contract analysis in an in-memory bounded LRU cache.
 */
export function setCachedAudit(key: string, value: ContractAnalysis): void {
  if (auditCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = auditCache.keys().next().value;
    if (oldestKey) auditCache.delete(oldestKey);
  }
  auditCache.set(key, {
    value,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}
