import { GoogleGenAI, Type } from '@google/genai';
import { env } from '../config/env';
import { generateSlideImage } from '../handlers/presentationGeneration.handler';

export interface ImageScoringResult {
  score: number;
  reasoning: string;
  improvedPrompt: string;
  scored: boolean;
}

/**
 * Multimodal image scoring function for children's educational illustrations.
 */
export async function scoreImage(
  base64Image: string,
  topic: string
): Promise<ImageScoringResult> {
  try {
    const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        score: 40,
        reasoning: 'Gemini API key not configured, returning baseline score.',
        improvedPrompt: topic,
        scored: false,
      };
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    let mimeType = 'image/jpeg';
    let rawBase64 = base64Image;

    if (!base64Image || !base64Image.startsWith('data:')) {
      return {
        score: 40,
        reasoning: 'External or non-data image URL provided, bypassing multimodal scoring.',
        improvedPrompt: `Playful, colorful, whimsical children's educational illustration of ${topic}`,
        scored: false,
      };
    }

    const match = base64Image.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      mimeType = match[1];
      rawBase64 = match[2];
    } else {
      return {
        score: 40,
        reasoning: 'Non-raster preview image format, using default quality baseline.',
        improvedPrompt: `Playful, colorful, whimsical children's educational illustration of ${topic}`,
        scored: false,
      };
    }

    const imagePart = {
      inlineData: {
        mimeType,
        data: rawBase64,
      },
    };

    const promptText = `Score this illustration 0–100 for a children's educational slide.
Criteria: (1) playful and fun for kids 5–11, (2) colorful and engaging, (3) matches the topic, (4) age-appropriate and safe, (5) clear composition.
Topic: "${topic}"

Return JSON: {score: number, reasoning: string, improvedPrompt: string}.`;

    const modelToUse = env.GEMINI_TEXT_MODEL || 'gemini-3.6-flash';

    const response = await ai.models.generateContent({
      model: modelToUse,
      contents: [imagePart, { text: promptText }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            reasoning: { type: Type.STRING },
            improvedPrompt: { type: Type.STRING },
          },
          required: ['score', 'reasoning', 'improvedPrompt'],
        },
      },
    });

    const jsonText = response.text || '{}';
    const parsed = JSON.parse(jsonText);
    const score = typeof parsed.score === 'number' ? Math.max(0, Math.min(100, Math.round(parsed.score))) : 40;

    return {
      score,
      reasoning: String(parsed.reasoning || 'Illustration evaluated for child engagement.'),
      improvedPrompt: String(parsed.improvedPrompt || promptText),
      scored: true,
    };
  } catch (err: any) {
    console.warn('[scoreImage] Evaluation failed, using fallback score:', err?.message || err);
    return {
      score: 40,
      reasoning: 'Image scoring fallback evaluation.',
      improvedPrompt: `Vibrant, playful children's classroom illustration of ${topic}`,
      scored: false,
    };
  }
}

/**
 * Best-of-5 scoring iteration loop for generating slide illustrations.
 */
export async function generateSlideImageWithScoring(
  prompt: string,
  maxAttempts = 5,
  threshold = 70
): Promise<{ imageUrl: string; score: number }> {
  let currentPrompt = prompt;
  let bestImageUrl = '';
  let bestScore = -1;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const imageUrl = await generateSlideImage(currentPrompt);
    const scoringResult = await scoreImage(imageUrl, currentPrompt);
    const score = scoringResult.score;

    if (scoringResult.scored) {
      console.log(`[Image Scoring] Attempt ${attempt} scored ${score}/100.`);

      if (score > bestScore || !bestImageUrl) {
        bestScore = score;
        bestImageUrl = imageUrl;
      }

      if (score >= threshold) {
        return { imageUrl, score };
      }
    } else {
      console.warn(`[Image Scoring] WARNING: scoring unavailable, using un-scored image`);

      if (bestScore < 0 || !bestImageUrl) {
        bestScore = score; // 40
        bestImageUrl = imageUrl;
      }
    }

    if (scoringResult.improvedPrompt) {
      currentPrompt = scoringResult.improvedPrompt;
    }
  }

  return { imageUrl: bestImageUrl, score: Math.max(0, bestScore) };
}
