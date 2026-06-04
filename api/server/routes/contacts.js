const express = require('express');
const router = express.Router();
const multer = require('multer');
const Contact = require('../../models/Contact');
const { importContactsFromCSV } = require('../../services/contactImport');

// Use LibreChat's existing JWT middleware — adjust path if needed
const { requireJwtAuth } = require('../middleware');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 }, // 200 MB max
});

// ── GET /api/contacts ─────────────────────────────────────────────────
// Query params: ?search=&company=&role=&page=&limit=
router.get('/', requireJwtAuth, async (req, res) => {
  try {
    const { search, company, role, page = 1, limit = 50 } = req.query;
    const filter = { userId: req.user.id };

    if (search) {
      filter.$text = { $search: search };
    }
    if (company) {
      filter.company = new RegExp(company, 'i');
    }
    if (role) {
      filter.role = new RegExp(role, 'i');
    }

    const sortOption = search
      ? { score: { $meta: 'textScore' } }
      : { createdAt: -1 };

    const [contacts, total] = await Promise.all([
      Contact.find(filter, search ? { score: { $meta: 'textScore' } } : {})
        .sort(sortOption)
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .lean(),
      Contact.countDocuments(filter),
    ]);

    res.json({ contacts, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error('[contacts] GET error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/contacts ────────────────────────────────────────────────
router.post('/', requireJwtAuth, async (req, res) => {
  try {
    const contact = await Contact.create({ ...req.body, userId: req.user.id });
    res.status(201).json(contact);
  } catch (err) {
    console.error('[contacts] POST error:', err);
    res.status(400).json({ error: err.message });
  }
});

// ── GET /api/contacts/:id ─────────────────────────────────────────────
router.get('/:id', requireJwtAuth, async (req, res) => {
  try {
    const contact = await Contact.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!contact) return res.status(404).json({ error: 'Not found' });
    res.json(contact);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/contacts/:id ───────────────────────────────────────────
router.patch('/:id', requireJwtAuth, async (req, res) => {
  try {
    const contact = await Contact.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!contact) return res.status(404).json({ error: 'Not found' });
    res.json(contact);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── DELETE /api/contacts/:id ──────────────────────────────────────────
router.delete('/:id', requireJwtAuth, async (req, res) => {
  try {
    await Contact.deleteOne({ _id: req.params.id, userId: req.user.id });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/contacts/import ─────────────────────────────────────────
// Accepts multipart/form-data with field "file" (CSV)
router.post('/import', requireJwtAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const result = await importContactsFromCSV(req.file.buffer, req.user.id);
    res.json(result);
  } catch (err) {
    console.error('[contacts] import error:', err);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
