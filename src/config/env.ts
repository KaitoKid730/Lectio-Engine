import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  GEMINI_API_KEY: z.string().optional(),
  DATABASE_URL: z.string().optional().default('postgres://postgres:postgres@localhost:5432/lectio_db'),
  SESSION_SECRET: z.string().default('lectio_engine_default_session_secret_2026_super_secure'),
  SESSION_TTL_HOURS: z.coerce.number().default(12),
  MAX_MANUSCRIPT_SIZE: z.coerce.number().default(5242880),
  CORS_ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  GEMINI_TEXT_MODEL: z.string().default('gemini-3.6-flash'),
  GEMINI_IMAGE_MODEL: z.string().default('imagen-3.0-generate-002'),
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Environment variable validation errors:', result.error.format());
    return envSchema.parse({
      NODE_ENV: process.env.NODE_ENV || 'development',
      PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
    });
  }
  return result.data;
};

export const env = parseEnv();
