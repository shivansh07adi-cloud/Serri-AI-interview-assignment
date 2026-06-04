const Contact = require('../models/Contact');

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'who', 'what', 'where', 'when', 'which',
  'do', 'we', 'know', 'about', 'all', 'list', 'our', 'in', 'at', 'and',
  'or', 'of', 'to', 'for', 'with', 'me', 'show', 'tell', 'find', 'get',
  'give', 'have', 'has', 'had', 'can', 'could', 'would', 'should', 'my',
  'their', 'from', 'that', 'this', 'contacts', 'contact', 'people', 'person',
]);

/**
 * Extract meaningful keywords from a user message.
 */
function extractKeywords(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

/**
 * Find the most relevant contacts for a given user query.
 * Strategy:
 *   1. MongoDB full-text search (fast, ranked by relevance)
 *   2. Fallback to regex search on extracted keywords
 *   3. Returns empty array if nothing found
 *
 * @param {string} query   - Raw user message or search string
 * @param {string} userId  - Authenticated user ID
 * @param {number} limit   - Max contacts to return
 */
async function retrieveRelevantContacts(query, userId, limit = 20) {
  // ── Step 1: Full-text search ──────────────────────────────────────
  try {
    const textResults = await Contact.find(
      { userId, $text: { $search: query } },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit)
      .lean();

    if (textResults.length > 0) {
      return textResults;
    }
  } catch (_) {
    // $text search might fail if index not ready; fall through
  }

  // ── Step 2: Keyword regex fallback ───────────────────────────────
  const keywords = extractKeywords(query);
  if (keywords.length === 0) return [];

  const orClauses = keywords.flatMap((kw) => {
    const r = new RegExp(kw, 'i');
    return [
      { name: r },
      { company: r },
      { role: r },
      { email: r },
      { notes: r },
    ];
  });

  return Contact.find({ userId, $or: orClauses }).limit(limit).lean();
}

/**
 * Format contact list as a concise, LLM-readable string.
 */
function formatContactsForLLM(contacts) {
  if (!contacts || contacts.length === 0) {
    return 'No matching contacts found in the user\'s contact list.';
  }

  return contacts
    .map((c) => {
      const parts = [`Name: ${c.name}`];
      if (c.company) parts.push(`Company: ${c.company}`);
      if (c.role)    parts.push(`Role: ${c.role}`);
      if (c.email)   parts.push(`Email: ${c.email}`);
      if (c.notes)   parts.push(`Notes: ${c.notes}`);

      // Include arbitrary attributes
      if (c.attributes) {
        const entries =
          c.attributes instanceof Map
            ? [...c.attributes.entries()]
            : Object.entries(c.attributes);
        for (const [k, v] of entries) {
          if (v) parts.push(`${k}: ${v}`);
        }
      }

      return parts.join(' | ');
    })
    .join('\n');
}

module.exports = { retrieveRelevantContacts, formatContactsForLLM, extractKeywords };
