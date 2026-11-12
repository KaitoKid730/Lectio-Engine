-- Migration 0002: Add design_brief, custom_palette, and design_review to presentations

ALTER TABLE presentations ADD COLUMN IF NOT EXISTS design_brief TEXT;
ALTER TABLE presentations ADD COLUMN IF NOT EXISTS custom_palette JSONB;
ALTER TABLE presentations ADD COLUMN IF NOT EXISTS design_review JSONB;
