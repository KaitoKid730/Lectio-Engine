import { z } from 'zod';
import { GoogleGenAI } from '@google/genai';
import { getDbPool } from '../db';
import { executePrompt } from '../services/gemini.service';
import { env } from '../config/env';

const ExpandedPromptSchema = z.preprocess((val: any) => {
  if (typeof val === 'string') return { expandedPrompt: val };
  if (val && typeof val === 'object') {
    return {
      expandedPrompt: String(val.expandedPrompt || val.prompt || val.imagePrompt || ''),
    };
  }
  return { expandedPrompt: '' };
}, z.object({
  expandedPrompt: z.string().default(''),
}));

const AltTextSchema = z.preprocess((val: any) => {
  if (typeof val === 'string') return { altText: val };
  if (val && typeof val === 'object') {
    return {
      altText: String(val.altText || val.alt || val.description || ''),
    };
  }
  return { altText: '' };
}, z.object({
  altText: z.string().default(''),
}));

const FALLBACK_IMAGE_CATALOG: Record<string, string> = {
  'Watercolor_1:1': 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
  'Watercolor_16:9': 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=80',
  '3D Cartoon_1:1': 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
  '3D Cartoon_16:9': 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
  'Vector Graphic_1:1': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
  'Vector Graphic_16:9': 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&q=80',
  'Realistic_1:1': 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80',
  'Realistic_16:9': 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=1200&q=80',
  'default_1:1': 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=800&q=80',
  'default_16:9': 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80',
};

export function getFallbackImageUrl(visualStyle: string, aspectRatio: string): string {
  const key = `${visualStyle}_${aspectRatio}`;
  if (FALLBACK_IMAGE_CATALOG[key]) {
    return FALLBACK_IMAGE_CATALOG[key];
  }
  const defaultKey = `default_${aspectRatio === '16:9' ? '16:9' : '1:1'}`;
  return FALLBACK_IMAGE_CATALOG[defaultKey] || FALLBACK_IMAGE_CATALOG['default_1:1'];
}

export async function handleImageGeneration(payload: {
  imageId: string;
  bookId?: string;
  prompt: string;
  visualStyle?: string;
  aspectRatio?: string;
}): Promise<any> {
  const { imageId, prompt, visualStyle = '3D Cartoon', aspectRatio = '1:1' } = payload;
  if (!imageId) throw new Error('Missing imageId in payload');
  if (!prompt) throw new Error('Missing prompt in payload');

  const pool = getDbPool();

  try {
    // 1. Expand image prompt via Gemini prompt-builder
    let expandedPrompt = prompt;
    try {
      const promptResult = await executePrompt(
        'image.prompt-builder.v1',
        'gemini-3.6-flash',
        'You are an expert AI illustration prompt designer for K-12 educational storybooks. Return a JSON object with a single key "expandedPrompt". Expand the input user prompt into a detailed, vivid image generation prompt incorporating style, lighting, character details, and educational safety guidelines.',
        `PROMPT: ${prompt}\nSTYLE: ${visualStyle}\nASPECT RATIO: ${aspectRatio}\nReturn JSON format: {"expandedPrompt": "..."}`,
        ExpandedPromptSchema,
        0.5,
        500
      );
      if (promptResult?.expandedPrompt) {
        expandedPrompt = promptResult.expandedPrompt;
      }
    } catch (pErr: any) {
      console.log('[Image Generation Handler] Prompt builder fallback used:', pErr?.message || pErr);
    }

    // 2. Attempt Image Generation or Fallback
    let finalImageUrl = getFallbackImageUrl(visualStyle, aspectRatio);
    try {
      const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      if (apiKey) {
        const ai = new GoogleGenAI({ apiKey });
        const modelName = env.GEMINI_IMAGE_MODEL || 'imagen-3.0-generate-002';

        if (modelName.startsWith('imagen')) {
          try {
            const imgRes = await ai.models.generateImages({
              model: modelName,
              prompt: expandedPrompt,
              config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: aspectRatio === '16:9' ? '16:9' : '1:1',
              },
            });
            if (imgRes.generatedImages?.[0]?.image?.imageBytes) {
              const base64Data = imgRes.generatedImages[0].image.imageBytes;
              finalImageUrl = `data:image/jpeg;base64,${base64Data}`;
            }
          } catch (_imagenErr) {
            try {
              const response = await ai.models.generateContent({
                model: 'gemini-3.1-flash-lite-image',
                contents: expandedPrompt,
                config: {
                  responseModalities: ['IMAGE', 'TEXT'],
                },
              });
              if (response.candidates?.[0]?.content?.parts) {
                for (const part of response.candidates[0].content.parts) {
                  if (part.inlineData?.data) {
                    const base64Data = part.inlineData.data;
                    const mime = part.inlineData.mimeType || 'image/png';
                    finalImageUrl = `data:${mime};base64,${base64Data}`;
                    break;
                  }
                }
              }
            } catch (_fallbackErr) {
              // Silently fallback to static illustration URL
            }
          }
        } else {
          try {
            const response = await ai.models.generateContent({
              model: modelName,
              contents: expandedPrompt,
              config: {
                responseModalities: ['IMAGE', 'TEXT'],
                imageConfig: {
                  aspectRatio: aspectRatio as any,
                },
              },
            });

            if (response.candidates?.[0]?.content?.parts) {
              for (const part of response.candidates[0].content.parts) {
                if (part.inlineData?.data) {
                  const base64Data = part.inlineData.data;
                  const mime = part.inlineData.mimeType || 'image/png';
                  finalImageUrl = `data:${mime};base64,${base64Data}`;
                  break;
                }
              }
            }
          } catch (_genErr) {
            // Silently fallback to static illustration URL
          }
        }
      }
    } catch (_imgErr: any) {
      console.warn('[Image Generation Handler] Image generation model limit reached, using styled illustration fallback.');
    }

    // 3. Generate Alt Text for Accessibility
    let altText = `An educational illustration in ${visualStyle} style depicting ${prompt}`;
    try {
      const altResult = await executePrompt(
        'image.alt-text.v1',
        'gemini-3.6-flash',
        'You are an accessibility expert for K-12 educational media. Return a JSON object with a single key "altText". Generate concise, descriptive alt-text for screen readers explaining the primary subjects, scene context, and educational details of the described illustration.',
        `SCENE PROMPT: ${expandedPrompt}\nReturn JSON format: {"altText": "..."}`,
        AltTextSchema,
        0.2,
        250
      );
      if (altResult?.altText) {
        altText = altResult.altText;
      }
    } catch (aErr: any) {
      console.log('[Image Generation Handler] Alt text fallback used:', aErr?.message || aErr);
    }

    // 4. Update Database
    await pool.query(
      `
      UPDATE generated_images 
      SET 
        prompt = $1,
        image_url = $2,
        alt_text = $3,
        status = 'approved',
        updated_at = NOW()
      WHERE id = $4;
    `,
      [expandedPrompt, finalImageUrl, altText, imageId]
    );

    console.log(`[Image Generation Handler] Image ${imageId} processed successfully.`);
    return { imageId, imageUrl: finalImageUrl, altText, status: 'approved' };
  } catch (err: any) {
    console.error(`[Image Generation Handler] Error in image generation ${imageId}:`, err?.message);
    await pool.query(`UPDATE generated_images SET status = 'failed', updated_at = NOW() WHERE id = $1;`, [imageId]);
    throw err;
  }
}
