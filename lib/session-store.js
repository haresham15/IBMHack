/**
 * lib/session-store.js
 * Module-level in-memory store for uploaded syllabi.
 * Shared across upload and translate routes within the same Next.js server process.
 *
 * Keys:   syllabusId (UUID string)
 * Values: { rawText, filename, buffer, uploadedAt }
 */
export const syllabusStore = new Map()
