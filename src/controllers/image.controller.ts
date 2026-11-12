import { Request, Response } from 'express';
import { z } from 'zod';
import { getDbPool } from '../db';
import { sendResponse } from '../utils/response';

const GenerateImageSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  bookId: z.string().optional(),
  visualStyle: z.string().default('3D Cartoon'),
  aspectRatio: z.string().default('1:1'),
  districtId: z.string().optional(),
});

/**
 * POST /api/images/generate
 */
export async function generateImageController(req: Request, res: Response): Promise<void> {
  try {
    const parseResult = GenerateImageSchema.safeParse(req.body);
    if (!parseResult.success) {
      sendResponse(res, 400, false, undefined, parseResult.error.issues[0].message);
      return;
    }

    const { prompt, bookId, visualStyle, aspectRatio, districtId } = parseResult.data;
    const pool = getDbPool();
    const userId = (req as any).user?.id || null;
    const effectiveDistrictId = districtId || (req as any).user?.districtId || null;

    const imageId = crypto.randomUUID();
    const jobId = crypto.randomUUID();

    // Insert record in 'generating' status
    const imageRes = await pool.query(
      `
      INSERT INTO generated_images (
        id, book_id, district_id, prompt, visual_style, aspect_ratio, image_url, status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, '', 'generating', $7)
      RETURNING *;
    `,
      [imageId, bookId || null, effectiveDistrictId, prompt, visualStyle, aspectRatio, userId]
    );

    const img = imageRes.rows[0];

    // Enqueue background job
    await pool.query(
      `
      INSERT INTO background_jobs (
        id, job_type, payload, status
      ) VALUES ($1, 'image_generation', $2::jsonb, 'queued');
    `,
      [
        jobId,
        JSON.stringify({
          imageId: img.id,
          bookId,
          prompt,
          visualStyle,
          aspectRatio,
        }),
      ]
    );

    sendResponse(res, 202, true, {
      id: img.id,
      bookId: img.book_id,
      prompt: img.prompt,
      visualStyle: img.visual_style,
      aspectRatio: img.aspect_ratio,
      status: img.status,
      createdAt: img.created_at,
      message: 'Image generation queued.',
    });
  } catch (err: any) {
    console.error('[Generate Image Controller] Error:', err);
    sendResponse(res, 500, false, undefined, err.message || 'Internal server error generating image.');
  }
}

/**
 * GET /api/images/:id
 */
export async function getImageByIdController(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const pool = getDbPool();

    const result = await pool.query(`SELECT * FROM generated_images WHERE id = $1;`, [id]);
    if (result.rows.length === 0) {
      sendResponse(res, 404, false, undefined, 'Image record not found.');
      return;
    }

    const row = result.rows[0];
    sendResponse(res, 200, true, {
      id: row.id,
      bookId: row.book_id,
      districtId: row.district_id,
      prompt: row.prompt,
      visualStyle: row.visual_style,
      aspectRatio: row.aspect_ratio,
      imageUrl: row.image_url,
      altText: row.alt_text,
      status: row.status,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  } catch (err: any) {
    console.error('[Get Image Controller] Error:', err);
    sendResponse(res, 500, false, undefined, 'Internal server error fetching image record.');
  }
}

/**
 * GET /api/images
 */
export async function listImagesController(req: Request, res: Response): Promise<void> {
  try {
    const pool = getDbPool();
    const result = await pool.query(`SELECT * FROM generated_images ORDER BY created_at DESC LIMIT 50;`);

    const images = result.rows.map((row) => ({
      id: row.id,
      bookId: row.book_id,
      districtId: row.district_id,
      prompt: row.prompt,
      visualStyle: row.visual_style,
      aspectRatio: row.aspect_ratio,
      imageUrl: row.image_url,
      altText: row.alt_text,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    sendResponse(res, 200, true, images);
  } catch (err: any) {
    console.error('[List Images Controller] Error:', err);
    sendResponse(res, 500, false, undefined, 'Internal server error listing images.');
  }
}
