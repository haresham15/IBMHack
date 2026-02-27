/**
 * lib/session-store.js
 * In-memory store for uploaded syllabi, shared across all API routes.
 *
 * Uses globalThis so the Map survives Next.js hot-module-replacement in dev,
 * where individual modules can be re-evaluated while the Node.js process lives on.
 *
 * Keys:   syllabusId (UUID string)
 * Values: { rawText, filename, buffer, uploadedAt }
 */

if (!globalThis.__syllabusStore) {
  globalThis.__syllabusStore = new Map()
}

export const syllabusStore = globalThis.__syllabusStore
