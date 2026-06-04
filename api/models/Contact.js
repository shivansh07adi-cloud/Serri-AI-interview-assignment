const mongoose = require('mongoose');

const ContactSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name:    { type: String, required: true, trim: true },
    company: { type: String, trim: true, default: '' },
    role:    { type: String, trim: true, default: '' },
    email:   { type: String, trim: true, lowercase: true, default: '' },
    notes:   { type: String, default: '' },

    // Arbitrary key-value metadata (industry, location, fundingStage, etc.)
    attributes: {
      type: Map,
      of: String,
      default: {},
    },

    // Denormalized search blob — rebuilt on every save
    searchText: { type: String, select: false },
  },
  { timestamps: true }
);

// Rebuild searchText before saving
ContactSchema.pre('save', function (next) {
  const attrValues = [...(this.attributes?.values() ?? [])].join(' ');
  this.searchText = [
    this.name,
    this.company,
    this.role,
    this.email,
    this.notes,
    attrValues,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  next();
});

// Full-text index on the blob
ContactSchema.index({ searchText: 'text' });

// Compound indexes for common filters
ContactSchema.index({ userId: 1, company: 1 });
ContactSchema.index({ userId: 1, role: 1 });
ContactSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Contact', ContactSchema);
