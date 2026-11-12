import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { env } from '../config/env';

/**
 * Custom error thrown when AI output fails JSON parsing or Zod schema validation.
 */
export class PromptValidationError extends Error {
  public promptId: string;
  public rawOutput: string;
  public zodErrors?: any;

  constructor(message: string, promptId: string, rawOutput: string, zodErrors?: any) {
    super(message);
    this.name = 'PromptValidationError';
    this.promptId = promptId;
    this.rawOutput = rawOutput;
    this.zodErrors = zodErrors;
  }
}

let aiClient: GoogleGenAI | null = null;

/**
 * Lazy initialization of GoogleGenAI SDK instance using server-side key
 */
const getGeminiClient = (): GoogleGenAI => {
  if (!aiClient) {
    const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not configured.');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
};

function tryRepairJson(jsonStr: string): any {
  let str = jsonStr.trim();
  if (!str) return {};

  try {
    return JSON.parse(str);
  } catch (_) {}

  // Strip markdown code fences
  str = str
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/, '')
    .trim();

  try {
    return JSON.parse(str);
  } catch (_) {}

  // Extract substring from first '{' to last '}'
  const startObj = str.indexOf('{');
  const endObj = str.lastIndexOf('}');
  if (startObj !== -1 && endObj > startObj) {
    try {
      return JSON.parse(str.substring(startObj, endObj + 1));
    } catch (_) {}
  }

  // Attempt to fix unclosed strings/brackets/braces
  let inString = false;
  let escaped = false;
  const stack: string[] = [];

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === '\\') {
      escaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (char === '{' || char === '[') {
        stack.push(char === '{' ? '}' : ']');
      } else if (char === '}' || char === ']') {
        if (stack.length > 0 && stack[stack.length - 1] === char) {
          stack.pop();
        }
      }
    }
  }

  let repairedStr = str;
  if (inString) {
    repairedStr += '"';
  }

  repairedStr = repairedStr.replace(/,\s*$/g, '');

  while (stack.length > 0) {
    repairedStr += stack.pop();
  }

  try {
    return JSON.parse(repairedStr);
  } catch (_) {}

  const startArr = str.indexOf('[');
  const endArr = str.lastIndexOf(']');
  if (startArr !== -1 && endArr > startArr) {
    try {
      return JSON.parse(str.substring(startArr, endArr + 1));
    } catch (_) {}
  }

  return {};
}

/**
 * Executes a Gemini AI prompt with optional system instructions, JSON mode, and strict Zod validation.
 *
 * @param promptId Identifier for the prompt template/call for tracking and errors
 * @param model Gemini model alias (defaults to 'gemini-3.6-flash')
 * @param systemInstruction System instruction string
 * @param contents String prompt or multimodal parts array
 * @param responseSchema Optional Zod schema to validate structured JSON output
 * @param temperature Sampling temperature (0.0 to 1.0)
 * @param maxTokens Optional maximum tokens limit
 */
export async function executePrompt<T = any>(
  promptId: string,
  model: string = 'gemini-3.6-flash',
  systemInstruction?: string,
  contents: string | any[] = '',
  responseSchema?: z.ZodType<T>,
  temperature: number = 0.7,
  maxTokens?: number
): Promise<T> {
  const ai = getGeminiClient();

  const config: Record<string, any> = {
    temperature: temperature ?? 0.7,
  };

  if (responseSchema) {
    config.responseMimeType = 'application/json';
  }

  let finalSystemInstruction = systemInstruction || '';
  if (responseSchema) {
    finalSystemInstruction += (finalSystemInstruction ? '\n\n' : '') + 
      'CRITICAL: You MUST respond ONLY with a valid, raw JSON object matching the requested fields. Do NOT wrap in markdown fences or include any conversational intro/outro text.';
  }

  if (finalSystemInstruction) {
    config.systemInstruction = finalSystemInstruction;
  }

  if (maxTokens) {
    config.maxOutputTokens = maxTokens;
  }

  const candidateModels = [model, 'gemini-3.1-flash-lite', 'gemini-2.5-flash', 'gemini-flash-latest'].filter((m, i, arr) => Boolean(m) && arr.indexOf(m) === i);
  let lastError: any = null;

  const isQuotaError = (err: any): boolean => {
    const msg = (err?.message || '').toLowerCase();
    const status = err?.status || err?.code || '';
    return (
      msg.includes('429') ||
      msg.includes('resource_exhausted') ||
      msg.includes('quota') ||
      status === 429
    );
  };

  const isTransientError = (err: any): boolean => {
    const msg = (err?.message || '').toLowerCase();
    const status = err?.status || err?.code || '';
    return (
      msg.includes('503') ||
      msg.includes('unavailable') ||
      msg.includes('high demand') ||
      msg.includes('spikes in demand') ||
      msg.includes('overloaded') ||
      msg.includes('500') ||
      msg.includes('internal') ||
      msg.includes('502') ||
      msg.includes('504') ||
      msg.includes('404') ||
      msg.includes('not_found') ||
      msg.includes('deadline_exceeded') ||
      status === 503 ||
      status === 500
    );
  };

  for (let i = 0; i < candidateModels.length; i++) {
    const currentModel = candidateModels[i];

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: currentModel,
          contents: typeof contents === 'string' ? contents : (contents as any),
          config,
        });

        const rawOutput = response.text || '';

        if (!responseSchema) {
          return rawOutput as unknown as T;
        }

        let parsedJson: any;
        try {
          parsedJson = tryRepairJson(rawOutput);
        } catch (_parseErr) {
          parsedJson = {};
        }

        const validationResult = responseSchema.safeParse(parsedJson);
        if (!validationResult.success) {
          const fallbackResult = responseSchema.safeParse({});
          if (fallbackResult.success) {
            return fallbackResult.data;
          }

          throw new PromptValidationError(
            `JSON schema validation failed for prompt ${promptId}: ${validationResult.error.message}`,
            promptId,
            rawOutput,
            validationResult.error.format()
          );
        }

        return validationResult.data;
      } catch (err: any) {
        if (err instanceof PromptValidationError) {
          throw err;
        }
        lastError = err;

        if (isQuotaError(err)) {
          if (i < candidateModels.length - 1) {
            console.warn(`[Gemini API] Quota limit hit on ${currentModel} for [${promptId}]. Immediately switching to fallback candidate model (${candidateModels[i + 1]})...`);
            await new Promise((resolve) => setTimeout(resolve, 300));
          }
          break; // Break attempt loop to proceed to next model candidate
        }

        if (isTransientError(err) && attempt < 3) {
          const backoff = attempt * 1000;
          console.warn(`[Gemini API] Transient error on ${currentModel} for [${promptId}] (${err?.message || '503'}). Retrying in ${backoff}ms (attempt ${attempt}/3)...`);
          await new Promise((resolve) => setTimeout(resolve, backoff));
          continue;
        }

        if (isTransientError(err) && i < candidateModels.length - 1) {
          console.warn(`[Gemini API] Model ${currentModel} temporary limit/availability for [${promptId}]. Switching to fallback candidate model (${candidateModels[i + 1]})...`);
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
        break;
      }
    }
  }

  throw new Error(`Gemini API execution failed [${promptId}]: ${lastError?.message || 'Unknown error'}`);
}
