---
title: Subsystem 03 - Book Processing Engine
layer: SUBSYSTEM_BOOK_PROCESSING
status: APPROVED
version: 2.0.0
last_updated: 2026-08-04
author: AI NLP Lead
---

# Subsystem 03: Book Processing Engine

## 1. Overview & Operational Scope
The Book Processing Engine receives raw storybook text or uploaded manuscripts, splits long-form content into semantic chapter nodes, calculates Flesch-Kincaid reading metrics, extracts grade-appropriate vocabulary words with contextual definitions, and summarizes moral and social-emotional learning (SEL) themes.

---

## 2. Text Chunking & Parsing Pipeline

```
[Raw Story Text Input]
          │
          ▼
  [1. PII Redaction & Content Moderation]
          │
          ▼
  [2. Chapter Boundary Detection & Semantic Chunking]
          │
          ▼
  [3. Gemini Entity, Vocab & Theme Extraction]
          │
          ▼
  [4. Reading Complexity Metrics & Word Counting]
          │
          ▼
  [5. Book Record Saved to Store]
```

---

## 3. Associated Prompt Catalog Entries

### Prompt `book.process.v1`
- **Model**: `gemini-3.6-flash`
- **System Instruction**: You are an expert K-8 literary parser. Parse storybook text into structured chapters, summary, vocabulary, and moral themes.
- **Output JSON Schema**:
```json
{
  "summary": "Concise 2-3 sentence story synopsis",
  "recommendedGrade": "Grade 2-3",
  "chapters": [
    {
      "chapterNumber": 1,
      "title": "Chapter Title",
      "content": "Full chapter content...",
      "wordCount": 140
    }
  ],
  "vocabulary": [
    {
      "word": "courageous",
      "definition": "Showing bravery in the face of fear",
      "contextSentence": "Leo was courageous when stepping into the cave.",
      "difficulty": "Intermediate"
    }
  ],
  "moralThemes": ["Bravery", "Friendship", "Perseverance"]
}
```

---

## 4. Reading Complexity Metrics
- **Total Word Count**: Computed via exact token word splitter `text.split(/\s+/).length`.
- **Estimated Reading Time**: `totalWordCount / 120` words per minute (standard K-5 reading speed).
- **Flesch-Kincaid Grade Level Formula**:
  $$\text{FKGL} = 0.39 \left(\frac{\text{total words}}{\text{total sentences}}\right) + 11.8 \left(\frac{\text{total syllables}}{\text{total words}}\right) - 15.59$$

---

## 5. Review & Approval Workflow
1. **Ingestion**: Uploaded story text transitions to `[processing]`.
2. **Extraction**: Gemini parses chapters and vocabulary. State becomes `[processed]`.
3. **Curriculum Review**: Curriculum Lead reviews grade level alignment and approves (`[approved]`).
4. **Error Recovery**: If Gemini parsing fails, fallback parser creates structured single-chapter node with baseline vocabulary.
