-- Migration 0001: Add Presentations and Slides tables

CREATE TABLE IF NOT EXISTS presentations (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title TEXT NOT NULL,
    source_book_id VARCHAR(64) REFERENCES books(id) ON DELETE SET NULL,
    source_lesson_id VARCHAR(64) REFERENCES lesson_plans(id) ON DELETE SET NULL,
    theme VARCHAR(64) NOT NULL DEFAULT 'modern',
    status VARCHAR(32) NOT NULL DEFAULT 'draft',
    created_by VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    district_id VARCHAR(64) REFERENCES school_districts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS slides (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    presentation_id VARCHAR(64) NOT NULL REFERENCES presentations(id) ON DELETE CASCADE,
    slide_order INT NOT NULL,
    layout VARCHAR(32) NOT NULL CHECK (layout IN ('title', 'bullets', 'image', 'quiz', 'flashcard', 'discussion')),
    title TEXT,
    bullets JSONB DEFAULT '[]'::jsonb,
    speaker_notes TEXT,
    image_url TEXT,
    activity JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_slides_presentation ON slides(presentation_id);
CREATE INDEX IF NOT EXISTS idx_presentations_district ON presentations(district_id);
