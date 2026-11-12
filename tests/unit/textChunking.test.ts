import { describe, it, expect } from 'vitest';
import {
  calculateFleschKincaid,
  chunkText,
  countSyllablesInWord,
  MAX_MANUSCRIPT_CHARACTERS,
} from '../../src/services/textChunking.service';

describe('Text Chunking & Flesch-Kincaid Readability Service', () => {
  describe('countSyllablesInWord', () => {
    it('accurately estimates syllables for simple words', () => {
      expect(countSyllablesInWord('cat')).toBe(1);
      expect(countSyllablesInWord('apple')).toBe(2);
      expect(countSyllablesInWord('education')).toBe(4);
      expect(countSyllablesInWord('')).toBe(0);
    });
  });

  describe('calculateFleschKincaid', () => {
    it('returns default 0 grade level for empty text', () => {
      const result = calculateFleschKincaid('');
      expect(result.fleschKincaidGradeLevel).toBe(0);
      expect(result.fleschReadingEase).toBe(100);
      expect(result.wordCount).toBe(0);
    });

    it('calculates mathematically valid grade level and reading ease scores', () => {
      const passage = 'The quick brown fox jumps over the lazy dog. The sun shines brightly over the green hills.';
      const result = calculateFleschKincaid(passage);

      expect(result.wordCount).toBe(17);
      expect(result.sentenceCount).toBe(2);
      expect(result.fleschKincaidGradeLevel).toBeGreaterThan(0);
      expect(result.fleschReadingEase).toBeGreaterThan(0);
      expect(result.fleschReadingEase).toBeLessThanOrEqual(100);
    });
  });

  describe('chunkText', () => {
    it('splits text into chunks respecting paragraph boundaries', () => {
      const p1 = 'Paragraph 1: ' + 'a '.repeat(100);
      const p2 = 'Paragraph 2: ' + 'b '.repeat(100);
      const fullText = `${p1}\n\n${p2}`;

      const chunks = chunkText(fullText, 250);
      expect(chunks.length).toBeGreaterThanOrEqual(2);
      expect(chunks[0]).toContain('Paragraph 1');
      expect(chunks[1]).toContain('Paragraph 2');
    });

    it('throws error when manuscript exceeds 500,000 characters', () => {
      const oversizedText = 'a'.repeat(MAX_MANUSCRIPT_CHARACTERS + 10);
      expect(() => chunkText(oversizedText)).toThrowError(/exceeds maximum allowed limit of 500000 characters/);
    });

    it('allows manuscript up to 500,000 characters', () => {
      const validText = 'Hello world! ' + 'Testing text. '.repeat(100);
      expect(() => chunkText(validText)).not.toThrow();
    });
  });
});
