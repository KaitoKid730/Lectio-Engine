/**
 * Text Chunking and Readability Assessment Utilities (14-PIPE-TextChunking)
 */

export const MAX_MANUSCRIPT_CHARACTERS = 500000;

export interface ReadabilityMetrics {
  fleschKincaidGradeLevel: number;
  fleschReadingEase: number;
  wordCount: number;
  sentenceCount: number;
  syllableCount: number;
}

/**
 * Helper to estimate syllable count of an English word
 */
export function countSyllablesInWord(word: string): number {
  const cleaned = word.toLowerCase().replace(/[^a-z]/g, '');
  if (cleaned.length === 0) return 0;
  if (cleaned.length <= 3) return 1;

  // Handle words ending in -le (e.g. apple, table, candle)
  const isLeEnding = /[bcdfghjklmnpqrstvwxz]le$/i.test(cleaned);

  // Strip common non-syllabic endings (silent e, ed, es)
  const processed = cleaned
    .replace(/(?:ed|es|e)$/i, '')
    .replace(/^y/i, '');

  const vowelMatches = processed.match(/[aeiouy]{1,2}/g);
  let count = vowelMatches ? vowelMatches.length : 1;
  if (isLeEnding && !cleaned.endsWith('angle')) {
    count += 1;
  }
  return Math.max(1, count);
}

/**
 * Calculates Flesch-Kincaid Grade Level and Flesch Reading Ease scores mathematically.
 *
 * Formulas:
 * Flesch Reading Ease = 206.835 - (1.015 * (words / sentences)) - (84.6 * (syllables / words))
 * Flesch-Kincaid Grade Level = (0.39 * (words / sentences)) + (11.8 * (syllables / words)) - 15.59
 */
export function calculateFleschKincaid(text: string): ReadabilityMetrics {
  if (!text || text.trim().length === 0) {
    return {
      fleschKincaidGradeLevel: 0,
      fleschReadingEase: 100,
      wordCount: 0,
      sentenceCount: 0,
      syllableCount: 0,
    };
  }

  const words = text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);

  const wordCount = Math.max(1, words.length);

  const sentenceMatches = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const sentenceCount = Math.max(1, sentenceMatches.length);

  let totalSyllables = 0;
  for (const word of words) {
    totalSyllables += countSyllablesInWord(word);
  }
  const syllableCount = Math.max(1, totalSyllables);

  // Flesch Reading Ease
  const fre = 206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (syllableCount / wordCount);
  const fleschReadingEase = Math.round(Math.max(0, Math.min(100, fre)) * 100) / 100;

  // Flesch-Kincaid Grade Level
  const fkgl = 0.39 * (wordCount / sentenceCount) + 11.8 * (syllableCount / wordCount) - 15.59;
  const fleschKincaidGradeLevel = Math.round(Math.max(0, fkgl) * 100) / 100;

  return {
    fleschKincaidGradeLevel,
    fleschReadingEase,
    wordCount: words.length,
    sentenceCount: sentenceMatches.length,
    syllableCount,
  };
}

/**
 * Splits text into chunks respecting paragraph boundaries.
 * Enforces maximum 500,000 character manuscript limit.
 */
export function chunkText(text: string, maxChunkSize: number = 4000): string[] {
  if (!text) return [];

  if (text.length > MAX_MANUSCRIPT_CHARACTERS) {
    throw new Error(
      `Text exceeds maximum allowed limit of ${MAX_MANUSCRIPT_CHARACTERS} characters (received ${text.length} characters).`
    );
  }

  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    if (paragraph.length > maxChunkSize) {
      if (currentChunk) {
        chunks.push(currentChunk);
        currentChunk = '';
      }
      const sentences = paragraph.split(/(?<=[.!?])\s+/);
      for (const sentence of sentences) {
        if ((currentChunk + ' ' + sentence).trim().length <= maxChunkSize) {
          currentChunk = currentChunk ? `${currentChunk} ${sentence}` : sentence;
        } else {
          if (currentChunk) chunks.push(currentChunk);
          currentChunk = sentence.length > maxChunkSize ? sentence.substring(0, maxChunkSize) : sentence;
        }
      }
    } else if ((currentChunk + '\n\n' + paragraph).trim().length <= maxChunkSize) {
      currentChunk = currentChunk ? `${currentChunk}\n\n${paragraph}` : paragraph;
    } else {
      if (currentChunk) chunks.push(currentChunk);
      currentChunk = paragraph;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}
