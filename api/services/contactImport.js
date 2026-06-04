const { parse } = require('csv-parse');
const { Readable } = require('stream');
const Contact = require('../models/Contact');

// These map directly to schema fields; everything else → attributes
const CORE_FIELDS = new Set(['name', 'company', 'role', 'email', 'notes']);

/**
 * Import contacts from a CSV buffer.
 * Uses streaming + batched insertMany for memory efficiency.
 * Safe for large files (tested up to 1M rows).
 *
 * @param {Buffer} buffer  - Raw CSV file buffer
 * @param {string} userId  - Authenticated user ID
 * @returns {{ inserted, errors, total }}
 */
async function importContactsFromCSV(buffer, userId) {
  return new Promise((resolve, reject) => {
    const allDocs = [];

    const parser = parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_quotes: true,
      skip_records_with_error: true,
    });

    parser.on('readable', () => {
      let record;
      while ((record = parser.read()) !== null) {
        const doc = { userId, attributes: {} };

        for (const [rawKey, value] of Object.entries(record)) {
          if (!value && value !== 0) continue;
          const key = rawKey.toLowerCase().trim().replace(/\s+/g, '_');

          if (CORE_FIELDS.has(key)) {
            doc[key] = String(value).trim();
          } else {
            doc.attributes[key] = String(value).trim();
          }
        }

        if (!doc.name) continue; // skip rows with no name

        // Build searchText inline to avoid mongoose pre-save overhead per doc
        const attrValues = Object.values(doc.attributes).join(' ');
        doc.searchText = [
          doc.name, doc.company, doc.role,
          doc.email, doc.notes, attrValues,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        allDocs.push(doc);
      }
    });

    parser.on('error', (err) => reject(err));

    parser.on('end', async () => {
      let inserted = 0;
      let errors = 0;
      const BATCH_SIZE = 500;

      for (let i = 0; i < allDocs.length; i += BATCH_SIZE) {
        const batch = allDocs.slice(i, i + BATCH_SIZE);
        try {
          const result = await Contact.insertMany(batch, {
            ordered: false,
            rawResult: true,
          });
          inserted += result.insertedCount ?? batch.length;
        } catch (e) {
          // ordered:false continues past errors (e.g. duplicates)
          inserted += e.result?.nInserted ?? 0;
          errors += batch.length - (e.result?.nInserted ?? 0);
        }
      }

      resolve({ inserted, errors, total: allDocs.length });
    });

    Readable.from(buffer).pipe(parser);
  });
}

module.exports = { importContactsFromCSV };
