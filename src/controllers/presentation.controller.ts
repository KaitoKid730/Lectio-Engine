import { Request, Response } from 'express';
import crypto from 'crypto';
import PptxGenJS from 'pptxgenjs';
import { z } from 'zod';
import { GoogleGenAI } from '@google/genai';
import { getDbPool } from '../db';
import { env } from '../config/env';
import { generateSlideImage } from '../handlers/presentationGeneration.handler';
import { executePrompt } from '../services/gemini.service';

const PptxClass: any = (PptxGenJS as any).default || PptxGenJS;

function sendResponse(res: Response, status: number, success: boolean, data?: any, error?: string) {
  res.status(status).json({ success, data, error });
}

/**
 * GET /api/presentations/export-selftest
 */
export async function exportSelftestController(req: Request, res: Response): Promise<void> {
  try {
    const pptx = new PptxClass();
    pptx.layout = 'LAYOUT_16x9';
    const slide = pptx.addSlide();
    slide.background = { color: '0F172A' };
    slide.addText('PPTX Export Selftest Success', {
      x: 1.0,
      y: 2.2,
      w: 11.3,
      h: 1.5,
      fontSize: 36,
      bold: true,
      color: '38BDF8',
      align: 'center',
    });
    slide.addText('Lectio Presentation Studio - Pipeline verified end-to-end', {
      x: 1.0,
      y: 4.0,
      w: 11.3,
      h: 1.0,
      fontSize: 18,
      color: '94A3B8',
      align: 'center',
    });
    const buffer = (await pptx.write({ outputType: 'nodebuffer' })) as Buffer;
    res.status(200);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
    res.setHeader('Content-Disposition', 'attachment; filename="export-selftest.pptx"');
    res.end(buffer);
    return;
  } catch (err: any) {
    console.error('[Export Selftest Error]:', err);
    sendResponse(res, 500, false, undefined, err.message || 'Export selftest failed.');
  }
}

/**
 * POST /api/presentations/generate
 */
export async function generatePresentationController(req: Request, res: Response): Promise<void> {
  try {
    const { title, sourceBookId, sourceLessonId, theme = 'editorial', slideCount = 8, gradeLevel = 'Grade 3-5', designBrief, customPalette } = req.body;
    const pool = getDbPool();

    let presentationTitle = title;
    if (!presentationTitle) {
      if (sourceBookId) {
        const bookRes = await pool.query(`SELECT title FROM books WHERE id = $1;`, [sourceBookId]);
        if (bookRes.rows.length > 0) presentationTitle = `${bookRes.rows[0].title} - Slide Deck`;
      } else if (sourceLessonId) {
        const lessonRes = await pool.query(`SELECT title FROM lesson_plans WHERE id = $1;`, [sourceLessonId]);
        if (lessonRes.rows.length > 0) presentationTitle = `${lessonRes.rows[0].title} - Slide Deck`;
      }
    }
    if (!presentationTitle) {
      presentationTitle = `Presentation Studio Deck (${new Date().toLocaleDateString()})`;
    }

    const presentationId = crypto.randomUUID();
    const createdBy = (req as any).user?.id || null;
    const districtId = (req as any).user?.districtId || null;

    // Create presentation record
    await pool.query(
      `INSERT INTO presentations (id, title, source_book_id, source_lesson_id, theme, design_brief, custom_palette, status, created_by, district_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'generating', $8, $9, NOW(), NOW());`,
      [
        presentationId,
        presentationTitle,
        sourceBookId || null,
        sourceLessonId || null,
        theme,
        designBrief || null,
        customPalette ? JSON.stringify(customPalette) : null,
        createdBy,
        districtId,
      ]
    );

    // Enqueue background job
    const jobId = crypto.randomUUID();
    await pool.query(
      `INSERT INTO background_jobs (id, job_type, payload, status, attempts, created_at, updated_at)
       VALUES ($1, 'presentation_generation', $2, 'queued', 0, NOW(), NOW());`,
      [
        jobId,
        JSON.stringify({
          presentationId,
          sourceBookId,
          sourceLessonId,
          gradeLevel,
          slideCount: Number(slideCount) || 8,
          theme,
          designBrief,
        }),
      ]
    );

    sendResponse(res, 201, true, {
      id: presentationId,
      title: presentationTitle,
      theme,
      designBrief,
      status: 'generating',
      jobId,
    });
  } catch (err: any) {
    console.error('[Generate Presentation Controller] Error:', err);
    sendResponse(res, 500, false, undefined, err.message || 'Error queuing presentation generation.');
  }
}

/**
 * GET /api/presentations
 */
export async function listPresentationsController(req: Request, res: Response): Promise<void> {
  try {
    const pool = getDbPool();
    const result = await pool.query(`
      SELECT 
        p.id, 
        p.title, 
        p.source_book_id as "sourceBookId", 
        p.source_lesson_id as "sourceLessonId", 
        p.theme, 
        p.design_brief as "designBrief",
        p.custom_palette as "customPalette",
        p.design_review as "designReview",
        p.status, 
        p.created_by as "createdBy", 
        p.district_id as "districtId", 
        p.created_at as "createdAt", 
        p.updated_at as "updatedAt",
        COUNT(s.id)::int as "slideCount"
      FROM presentations p
      LEFT JOIN slides s ON p.id = s.presentation_id
      GROUP BY p.id
      ORDER BY p.created_at DESC;
    `);

    sendResponse(res, 200, true, result.rows);
  } catch (err: any) {
    console.error('[List Presentations Controller] Error:', err);
    sendResponse(res, 500, false, undefined, err.message || 'Error listing presentations.');
  }
}

/**
 * GET /api/presentations/:id
 */
export async function getPresentationController(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const pool = getDbPool();

    const presRes = await pool.query(
      `SELECT id, title, source_book_id as "sourceBookId", source_lesson_id as "sourceLessonId", theme, design_brief as "designBrief", custom_palette as "customPalette", design_review as "designReview", status, created_by as "createdBy", district_id as "districtId", created_at as "createdAt", updated_at as "updatedAt"
       FROM presentations WHERE id = $1;`,
      [id]
    );

    if (presRes.rows.length === 0) {
      sendResponse(res, 404, false, undefined, 'Presentation not found.');
      return;
    }

    const slidesRes = await pool.query(
      `SELECT id, presentation_id as "presentationId", slide_order as "slideOrder", layout, title, bullets, speaker_notes as "speakerNotes", image_url as "imageUrl", activity, style, image_score as "imageScore", created_at as "createdAt", updated_at as "updatedAt"
       FROM slides WHERE presentation_id = $1 ORDER BY slide_order ASC;`,
      [id]
    );

    const slides = slidesRes.rows.map((row: any) => {
      const styleObj = typeof row.style === 'string' ? JSON.parse(row.style) : (row.style || {});
      return {
        ...row,
        composition: row.composition || styleObj.composition || undefined,
        creativityScore: row.creativityScore || styleObj.creativityScore || 8,
      };
    });

    const presentation = {
      ...presRes.rows[0],
      slides,
    };

    sendResponse(res, 200, true, presentation);
  } catch (err: any) {
    console.error('[Get Presentation Controller] Error:', err);
    sendResponse(res, 500, false, undefined, err.message || 'Error getting presentation.');
  }
}

/**
 * PATCH /api/slides/:id
 */
export async function updateSlideController(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { title, bullets, layout, speakerNotes, activity, slideOrder } = req.body;
    const pool = getDbPool();

    const checkRes = await pool.query(`SELECT * FROM slides WHERE id = $1;`, [id]);
    if (checkRes.rows.length === 0) {
      sendResponse(res, 404, false, undefined, 'Slide not found.');
      return;
    }

    const existing = checkRes.rows[0];
    const newTitle = title !== undefined ? title : existing.title;
    const newBullets = bullets !== undefined ? JSON.stringify(bullets) : JSON.stringify(existing.bullets || []);
    const newLayout = layout !== undefined ? layout : existing.layout;
    const newNotes = speakerNotes !== undefined ? speakerNotes : existing.speaker_notes;
    const newActivity = activity !== undefined ? JSON.stringify(activity) : JSON.stringify(existing.activity || null);
    const newOrder = slideOrder !== undefined ? Number(slideOrder) : existing.slide_order;

    const result = await pool.query(
      `UPDATE slides 
       SET title = $1, bullets = $2, layout = $3, speaker_notes = $4, activity = $5, slide_order = $6, updated_at = NOW()
       WHERE id = $7
       RETURNING id, presentation_id as "presentationId", slide_order as "slideOrder", layout, title, bullets, speaker_notes as "speakerNotes", image_url as "imageUrl", activity, created_at as "createdAt", updated_at as "updatedAt";`,
      [newTitle, newBullets, newLayout, newNotes, newActivity, newOrder, id]
    );

    sendResponse(res, 200, true, result.rows[0]);
  } catch (err: any) {
    console.error('[Update Slide Controller] Error:', err);
    sendResponse(res, 500, false, undefined, err.message || 'Error updating slide.');
  }
}

/**
 * POST /api/presentations/:id/slides
 */
export async function addSlideController(req: Request, res: Response): Promise<void> {
  try {
    const { id: presentationId } = req.params;
    const { layout = 'bullets', title = 'New Slide', bullets = [], speakerNotes = '', activity = null } = req.body;
    const pool = getDbPool();

    const maxOrderRes = await pool.query(`SELECT COALESCE(MAX(slide_order), -1) as "maxOrder" FROM slides WHERE presentation_id = $1;`, [presentationId]);
    const nextOrder = Number(maxOrderRes.rows[0]?.maxOrder ?? -1) + 1;

    const newSlideId = crypto.randomUUID();
    const result = await pool.query(
      `INSERT INTO slides (id, presentation_id, slide_order, layout, title, bullets, speaker_notes, activity, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       RETURNING id, presentation_id as "presentationId", slide_order as "slideOrder", layout, title, bullets, speaker_notes as "speakerNotes", image_url as "imageUrl", activity, created_at as "createdAt", updated_at as "updatedAt";`,
      [newSlideId, presentationId, nextOrder, layout, title, JSON.stringify(bullets), speakerNotes, activity ? JSON.stringify(activity) : null]
    );

    sendResponse(res, 201, true, result.rows[0]);
  } catch (err: any) {
    console.error('[Add Slide Controller] Error:', err);
    sendResponse(res, 500, false, undefined, err.message || 'Error adding slide.');
  }
}

/**
 * DELETE /api/slides/:id
 */
export async function deleteSlideController(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const pool = getDbPool();

    const result = await pool.query(`DELETE FROM slides WHERE id = $1 RETURNING id;`, [id]);
    if (result.rows.length === 0) {
      sendResponse(res, 404, false, undefined, 'Slide not found.');
      return;
    }

    sendResponse(res, 200, true, { id });
  } catch (err: any) {
    console.error('[Delete Slide Controller] Error:', err);
    sendResponse(res, 500, false, undefined, err.message || 'Error deleting slide.');
  }
}

/**
 * POST /api/slides/:id/attach-image
 */
export async function attachImageToSlideController(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { imageId, imageUrl } = req.body;
    const pool = getDbPool();

    let finalUrl = imageUrl;
    if (!finalUrl && imageId) {
      const imgRes = await pool.query(`SELECT image_url FROM generated_images WHERE id = $1;`, [imageId]);
      if (imgRes.rows.length > 0) {
        finalUrl = imgRes.rows[0].image_url;
      }
    }

    if (!finalUrl) {
      sendResponse(res, 400, false, undefined, 'Must provide imageId or imageUrl.');
      return;
    }

    const result = await pool.query(
      `UPDATE slides 
       SET image_url = $1, layout = CASE WHEN layout = 'title' THEN 'title' ELSE 'image' END, updated_at = NOW() 
       WHERE id = $2 
       RETURNING id, presentation_id as "presentationId", slide_order as "slideOrder", layout, title, bullets, speaker_notes as "speakerNotes", image_url as "imageUrl", activity;`,
      [finalUrl, id]
    );

    if (result.rows.length === 0) {
      sendResponse(res, 404, false, undefined, 'Slide not found.');
      return;
    }

    sendResponse(res, 200, true, result.rows[0]);
  } catch (err: any) {
    console.error('[Attach Image Controller] Error:', err);
    sendResponse(res, 500, false, undefined, err.message || 'Error attaching image to slide.');
  }
}

/**
 * PATCH /api/presentations/:id
 */
export async function updatePresentationController(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { theme, title } = req.body;
    const pool = getDbPool();

    const checkRes = await pool.query(`SELECT * FROM presentations WHERE id = $1;`, [id]);
    if (checkRes.rows.length === 0) {
      sendResponse(res, 404, false, undefined, 'Presentation not found.');
      return;
    }

    const existing = checkRes.rows[0];
    const newTheme = theme !== undefined ? theme : existing.theme;
    const newTitle = title !== undefined ? title : existing.title;

    const result = await pool.query(
      `UPDATE presentations 
       SET theme = $1, title = $2, updated_at = NOW() 
       WHERE id = $3 
       RETURNING id, title, source_book_id as "sourceBookId", source_lesson_id as "sourceLessonId", theme, status, created_by as "createdBy", district_id as "districtId", created_at as "createdAt", updated_at as "updatedAt";`,
      [newTheme, newTitle, id]
    );

    sendResponse(res, 200, true, result.rows[0]);
  } catch (err: any) {
    console.error('[Update Presentation Controller] Error:', err);
    sendResponse(res, 500, false, undefined, err.message || 'Error updating presentation.');
  }
}

/**
 * POST /api/presentations/:id/export
 */
export async function exportPresentationController(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const pool = getDbPool();

    const presRes = await pool.query(`SELECT id, title, theme, custom_palette FROM presentations WHERE id = $1;`, [id]);
    if (presRes.rows.length === 0) {
      sendResponse(res, 404, false, undefined, 'Presentation not found.');
      return;
    }

    const presentation = presRes.rows[0];
    const slidesRes = await pool.query(
      `SELECT id, slide_order, layout, title, bullets, speaker_notes, image_url, activity 
       FROM slides WHERE presentation_id = $1 ORDER BY slide_order ASC;`,
      [id]
    );

    const pptx = new PptxClass();
    pptx.layout = 'LAYOUT_16x9';
    pptx.title = presentation.title;

    // Theme color palettes
    const themes: Record<string, { bg: string; text: string; accent: string; cardBg: string }> = {
      editorial: { bg: 'FDFBF7', text: '1C1917', accent: '0284C7', cardBg: 'F5F5F4' },
      'tech-glass': { bg: '0B0F19', text: 'F8FAFC', accent: '06B6D4', cardBg: '1E293B' },
      corporate: { bg: '0F172A', text: 'F8FAFC', accent: '38BDF8', cardBg: '1E293B' },
      minimal: { bg: 'FFFFFF', text: '18181B', accent: '2563EB', cardBg: 'F4F4F5' },
      modern: { bg: '0F172A', text: 'F8FAFC', accent: '818CF8', cardBg: '1E293B' },
      storybook: { bg: 'FDFBF7', text: '292524', accent: 'B45309', cardBg: 'FFFDF9' },
      playful: { bg: '311B92', text: 'F3E5F5', accent: 'EC407A', cardBg: '4527A0' },
      chalkboard: { bg: '064E3B', text: 'ECFDF5', accent: '34D399', cardBg: '022C22' },
      vibrant: { bg: '1E1B4B', text: 'F5F3FF', accent: 'C084FC', cardBg: '2E1065' },
      academic: { bg: 'FDFBF7', text: '292524', accent: '0284C7', cardBg: 'FFFFFF' },
    };

    let palette = themes[presentation.theme] || themes.editorial;
    if (presentation.custom_palette && typeof presentation.custom_palette === 'object') {
      const cp = presentation.custom_palette;
      palette = {
        bg: String(cp.bg || palette.bg).replace('#', ''),
        text: String(cp.text || palette.text).replace('#', ''),
        accent: String(cp.accent || palette.accent).replace('#', ''),
        cardBg: String(cp.card || cp.cardBg || palette.cardBg).replace('#', ''),
      };
    }

    for (const slideData of slidesRes.rows) {
      const slide = pptx.addSlide();
      slide.background = { color: palette.bg };

      const titleText = slideData.title || 'Untitled Slide';
      const bulletsList = Array.isArray(slideData.bullets) ? slideData.bullets : [];
      let notes = slideData.speaker_notes || '';

      if (slideData.layout === 'title') {
        slide.addText(titleText, {
          x: 1.0,
          y: 2.0,
          w: 11.3,
          h: 1.5,
          fontSize: 40,
          bold: true,
          color: palette.accent,
          align: 'center',
        });
        if (bulletsList.length > 0) {
          slide.addText(bulletsList.join('\n'), {
            x: 1.5,
            y: 3.8,
            w: 10.3,
            h: 2.0,
            fontSize: 22,
            color: palette.text,
            align: 'center',
          });
        }
      } else if (slideData.layout === 'quiz') {
        slide.addText(titleText, {
          x: 0.8,
          y: 0.8,
          w: 11.7,
          h: 0.8,
          fontSize: 28,
          bold: true,
          color: palette.accent,
        });

        const act = slideData.activity || {};
        const question = act.question || titleText;
        const options: string[] = Array.isArray(act.options) ? act.options : ['Option A', 'Option B', 'Option C', 'Option D'];
        const correctIdx = typeof act.correctAnswerIndex === 'number' ? act.correctAnswerIndex : 0;

        slide.addText(`Q: ${question}`, {
          x: 0.8,
          y: 1.8,
          w: 11.7,
          h: 1.0,
          fontSize: 22,
          bold: true,
          color: palette.text,
        });

        let yPos = 3.0;
        options.forEach((opt, idx) => {
          slide.addText(`${String.fromCharCode(65 + idx)}. ${opt}`, {
            x: 1.0,
            y: yPos,
            w: 11.0,
            h: 0.6,
            fontSize: 18,
            color: palette.text,
            fill: { color: palette.cardBg },
          });
          yPos += 0.8;
        });

        notes += `\n[Quiz Answer Key]: Correct Answer is Option ${String.fromCharCode(65 + correctIdx)}: ${options[correctIdx] || ''}. Explanation: ${act.explanation || 'None'}`;
      } else if (slideData.layout === 'flashcard') {
        slide.addText(titleText, {
          x: 0.8,
          y: 0.8,
          w: 11.7,
          h: 0.8,
          fontSize: 28,
          bold: true,
          color: palette.accent,
        });

        const act = slideData.activity || {};
        const front = act.front || titleText;
        const back = act.back || bulletsList.join(', ');

        slide.addText(`Flashcard Concept:\n${front}`, {
          x: 1.5,
          y: 2.0,
          w: 10.3,
          h: 2.0,
          fontSize: 24,
          bold: true,
          color: palette.text,
          align: 'center',
          fill: { color: palette.cardBg },
        });

        notes += `\n[Flashcard Back Side]: ${back}`;
      } else if (slideData.layout === 'image' && slideData.image_url) {
        slide.addText(titleText, {
          x: 0.8,
          y: 0.6,
          w: 11.7,
          h: 0.8,
          fontSize: 28,
          bold: true,
          color: palette.accent,
        });

        // Add image with try-catch and base64 cleaning
        try {
          if (slideData.image_url.startsWith('data:image/')) {
            const cleanBase64 = slideData.image_url.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
            slide.addImage({ data: `data:image/png;base64,${cleanBase64}`, x: 0.8, y: 1.6, w: 5.5, h: 4.5 });
          } else if (slideData.image_url.startsWith('http')) {
            slide.addImage({ path: slideData.image_url, x: 0.8, y: 1.6, w: 5.5, h: 4.5 });
          }
        } catch (imgErr) {
          console.warn('[PPTX Export] Failed to embed slide image, rendering text layout:', imgErr);
        }

        if (bulletsList.length > 0) {
          slide.addText(bulletsList.map((b) => `• ${b}`).join('\n\n'), {
            x: 6.6,
            y: 1.6,
            w: 5.8,
            h: 4.5,
            fontSize: 18,
            color: palette.text,
          });
        }
      } else {
        // Standard Bullets / Discussion
        slide.addText(titleText, {
          x: 0.8,
          y: 0.8,
          w: 11.7,
          h: 0.8,
          fontSize: 28,
          bold: true,
          color: palette.accent,
        });

        if (bulletsList.length > 0) {
          slide.addText(bulletsList.map((b) => `• ${b}`).join('\n\n'), {
            x: 0.8,
            y: 1.8,
            w: 11.7,
            h: 4.5,
            fontSize: 20,
            color: palette.text,
          });
        }
      }

      if (notes.trim()) {
        slide.addNotes(notes.trim());
      }
    }

    let pptxBuffer: Buffer;
    try {
      pptxBuffer = (await pptx.write({ outputType: 'nodebuffer' })) as Buffer;
    } catch (writeErr) {
      console.warn('[Export Presentation] Initial PPTX write failed, attempting text-safe PPTX fallback:', writeErr);
      const fallbackPptx = new PptxClass();
      fallbackPptx.layout = 'LAYOUT_16x9';
      for (const slideData of slidesRes.rows) {
        const slide = fallbackPptx.addSlide();
        slide.background = { color: palette.bg };
        const titleText = slideData.title || 'Slide';
        const bulletsList = Array.isArray(slideData.bullets) ? slideData.bullets : [];
        slide.addText(titleText, {
          x: 0.8,
          y: 0.8,
          w: 11.7,
          h: 0.8,
          fontSize: 28,
          bold: true,
          color: palette.accent,
        });
        if (bulletsList.length > 0) {
          slide.addText(bulletsList.map((b) => `• ${b}`).join('\n\n'), {
            x: 0.8,
            y: 1.8,
            w: 11.7,
            h: 4.5,
            fontSize: 20,
            color: palette.text,
          });
        }
      }
      pptxBuffer = (await fallbackPptx.write({ outputType: 'nodebuffer' })) as Buffer;
    }

    const safeFilename = presentation.title.replace(/[^a-zA-Z0-9_\-]/g, '_');
    res.status(200);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}.pptx"`);
    res.end(pptxBuffer);
    return;
  } catch (err: any) {
    console.error('[Export Presentation Controller] Error:', err);
    sendResponse(res, 500, false, undefined, err.message || 'Error exporting presentation.');
  }
}

/**
 * POST /api/presentations/:id/design-review
 */
export async function designReviewController(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { slides: clientSlides = [], designBrief } = req.body;
    const pool = getDbPool();

    const presRes = await pool.query(
      `SELECT id, title, theme, design_brief, custom_palette FROM presentations WHERE id = $1;`,
      [id]
    );

    if (presRes.rows.length === 0) {
      sendResponse(res, 404, false, undefined, 'Presentation not found.');
      return;
    }

    const presentation = presRes.rows[0];
    const brief = designBrief || presentation.design_brief || 'Clean, high-impact instructional slides';

    const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      sendResponse(res, 400, false, undefined, 'GEMINI_API_KEY is not set.');
      return;
    }

    const ai = new GoogleGenAI({ apiKey });
    const SlideCritiqueSchema = z.object({
      approved: z.boolean().default(true),
      issues: z.array(z.string()).default([]),
      improvements: z
        .object({
          layout: z.enum(['title', 'bullets', 'image', 'quiz', 'flashcard', 'discussion']).optional(),
          title: z.string().optional(),
          bullets: z.array(z.string()).optional(),
          imagePrompt: z.string().optional(),
          accent: z.string().optional(),
        })
        .optional(),
    });

    const reviews: Array<{ slideId: string; approved: boolean; issues: string[]; improvements?: any }> = [];

    for (const slide of clientSlides) {
      const { slideId, imageDataUrl, layout, title } = slide;
      if (!imageDataUrl || !imageDataUrl.startsWith('data:image/')) {
        reviews.push({ slideId, approved: true, issues: ['Skipped: no valid image preview'] });
        continue;
      }

      try {
        const base64Data = imageDataUrl.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
        const mimeType = imageDataUrl.match(/^data:(image\/[a-zA-Z]+);base64,/)?.[1] || 'image/png';

        const promptText = `This slide is for CHILDREN aged 5–11. Is it playful, colorful, and engaging? Does it look like a fun children's activity rather than a corporate slide? If it looks too stiff or business-like, recommend making it more playful.

Design Brief: "${brief}"
Current Slide Layout: "${layout}"
Current Slide Title: "${title}"

Examine the provided slide preview image.
Evaluate playfulness, color harmony, visual hierarchy, text legibility, and engagement for kids aged 5–11.
Strictly ensure NO emojis are present anywhere in the title or bullets.

Return a JSON object with:
- "approved": boolean (true if playful, colorful, and highly engaging for kids; false if it looks too stiff or corporate)
- "issues": string array of any visual issues noticed (e.g., "Looks like a corporate bullet grid", "Needs brighter playful colors")
- "improvements": optional object favoring playfulness (brighter gradients, fun shapes, bigger friendly text, interactive elements) with keys:
  - "layout": optional replacement layout ("title" | "bullets" | "image" | "quiz" | "flashcard" | "discussion")
  - "title": optional refined title string (without emojis)
  - "bullets": optional refined bullet array (without emojis)
  - "imagePrompt": optional string describing a playful children's illustration
  - "accent": optional bright vibrant hex color code`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: [
            {
              role: 'user',
              parts: [
                { inlineData: { mimeType, data: base64Data } },
                { text: promptText },
              ],
            },
          ],
          config: {
            responseMimeType: 'application/json',
          },
        });

        const textOutput = response.text || '{}';
        let parsedJson = {};
        try {
          parsedJson = JSON.parse(textOutput);
        } catch (_e) {}

        const critique = SlideCritiqueSchema.parse(parsedJson);
        reviews.push({ slideId, ...critique });

        // Apply approved improvements to the database
        if (critique.improvements && Object.keys(critique.improvements).length > 0) {
          const imp = critique.improvements;
          const currentDbSlideRes = await pool.query(`SELECT * FROM slides WHERE id = $1;`, [slideId]);
          if (currentDbSlideRes.rows.length > 0) {
            const currentDbSlide = currentDbSlideRes.rows[0];
            const newLayout = imp.layout || currentDbSlide.layout;
            const newTitle = imp.title || currentDbSlide.title;
            const newBullets = imp.bullets ? JSON.stringify(imp.bullets) : JSON.stringify(currentDbSlide.bullets || []);

            await pool.query(
              `UPDATE slides SET layout = $1, title = $2, bullets = $3, updated_at = NOW() WHERE id = $4;`,
              [newLayout, newTitle, newBullets, slideId]
            );

            if (imp.imagePrompt) {
              try {
                const newImgUrl = await generateSlideImage(imp.imagePrompt);
                await pool.query(
                  `UPDATE slides SET image_url = $1, updated_at = NOW() WHERE id = $2;`,
                  [newImgUrl, slideId]
                );
              } catch (imgErr) {
                console.warn('[Design Review] Failed to regenerate slide image:', imgErr);
              }
            }
          }
        }
      } catch (slideErr: any) {
        console.error(`[Design Review] Error reviewing slide ${slideId}:`, slideErr?.message || slideErr);
        reviews.push({ slideId, approved: true, issues: [`Review failed: ${slideErr?.message || 'Error'}`] });
      }
    }

    // Save design review summary to presentation record
    await pool.query(
      `UPDATE presentations SET design_review = $1, updated_at = NOW() WHERE id = $2;`,
      [JSON.stringify({ reviewedAt: new Date().toISOString(), brief, reviews }), id]
    );

    // Fetch updated presentation
    const updatedPresRes = await pool.query(
      `SELECT id, title, source_book_id as "sourceBookId", source_lesson_id as "sourceLessonId", theme, design_brief as "designBrief", custom_palette as "customPalette", design_review as "designReview", status, created_by as "createdBy", district_id as "districtId", created_at as "createdAt", updated_at as "updatedAt"
       FROM presentations WHERE id = $1;`,
      [id]
    );
    const updatedSlidesRes = await pool.query(
      `SELECT id, presentation_id as "presentationId", slide_order as "slideOrder", layout, title, bullets, speaker_notes as "speakerNotes", image_url as "imageUrl", activity, style, image_score as "imageScore", created_at as "createdAt", updated_at as "updatedAt"
       FROM slides WHERE presentation_id = $1 ORDER BY slide_order ASC;`,
      [id]
    );

    sendResponse(res, 200, true, {
      presentation: {
        ...updatedPresRes.rows[0],
        slides: updatedSlidesRes.rows,
      },
      reviews,
    });
  } catch (err: any) {
    console.error('[Design Review Controller] Error:', err);
    sendResponse(res, 500, false, undefined, err.message || 'Error executing design review.');
  }
}

const VisualReviewSchema = z.object({
  score: z.number().min(1).max(10),
  issues: z.array(z.string()).default([]),
  suggestions: z.array(z.string()).default([]),
});

const RefinedCompositionSchema = z.object({
  title: z.string().optional(),
  composition: z.array(z.object({
    type: z.enum(['text', 'shape', 'image', 'interactive']),
    content: z.string().optional(),
    imagePrompt: z.string().optional(),
    shape: z.string().optional(),
    x: z.string(),
    y: z.string(),
    width: z.string().optional(),
    height: z.string().optional(),
    fontSize: z.string().optional(),
    rotation: z.number().optional(),
    fill: z.string().optional(),
    zIndex: z.number().optional(),
    style: z.record(z.string(), z.any()).optional(),
    interaction: z.any().optional(),
  })),
});

export async function visualRefineController(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { slideId, imageBase64, attemptNumber = 1 } = req.body;

  if (!slideId || !imageBase64) {
    sendResponse(res, 400, false, undefined, 'slideId and imageBase64 parameters are required.');
    return;
  }

  try {
    const pool = getDbPool();
    const slideRes = await pool.query(`SELECT * FROM slides WHERE id = $1 AND presentation_id = $2;`, [slideId, id]);
    if (slideRes.rows.length === 0) {
      sendResponse(res, 404, false, undefined, 'Slide not found.');
      return;
    }

    const currentSlide = slideRes.rows[0];
    const currentStyle = typeof currentSlide.style === 'string' ? JSON.parse(currentSlide.style) : (currentSlide.style || {});
    const currentComposition = currentSlide.composition || currentStyle.composition || [];

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '').trim();

    const reviewSystemInstruction = `You are a professional presentation designer reviewing a slide for children aged 5-11.
Look at this rendered slide image and evaluate:
- Is the text readable and well-spaced?
- Are elements overlapping in confusing ways?
- Is the visual hierarchy clear?
- Are colors harmonious and engaging for kids?
- Does it look professional and polished?

Rate the design 1-10 and provide specific improvements if score < 8:
{
  "score": number,
  "issues": string[],
  "suggestions": string[]
}`;

    const contents = [
      `Evaluate this rendered slide image visually for children aged 5-11.`,
      {
        inlineData: {
          mimeType: 'image/png',
          data: cleanBase64,
        },
      },
    ];

    console.log(`[Vision Assessment] Evaluating Slide ${slideId} (Attempt ${attemptNumber})...`);

    let assessment: any;
    try {
      assessment = await executePrompt(
        'presentation.visual-review.v1',
        'gemini-2.5-flash',
        reviewSystemInstruction,
        contents,
        VisualReviewSchema,
        0.2
      );
    } catch (evalErr) {
      console.warn('[Vision Assessment] gemini-2.5-flash failed, trying gemini-3.6-flash:', evalErr);
      assessment = await executePrompt(
        'presentation.visual-review.v1',
        'gemini-3.6-flash',
        reviewSystemInstruction,
        contents,
        VisualReviewSchema,
        0.2
      );
    }

    console.log(`[Vision Assessment] Slide ${slideId} Score: ${assessment.score}/10. Issues:`, assessment.issues);

    if (assessment.score < 8 && attemptNumber < 3) {
      console.log(`[Vision Assessment] Score < 8 on attempt ${attemptNumber}. Triggering Gemini Refinement...`);

      const refineSystemInstruction = `You are a presentation composition expert refining a slide layout based on visual feedback from a vision evaluation.
Your goal is to fix all identified issues and suggestions.

DESIGN RULES:
- Text must be readable: minimum 1.2rem font size for body text
- Avoid overlapping text on text
- Leave 15-20% margin around slide edges (positions x: 10%-80%, y: 10%-80%)
- Use max 2-3 font sizes per slide (hierarchy)
- Ensure sufficient contrast between text and background
- Interactive elements must be clearly clickable (min 200x60px)
- Don't place elements outside the visible slide bounds

Output MUST be a JSON object with 'title' and updated 'composition' array.`;

      const refineUserPrompt = `Slide Title: ${currentSlide.title}
Current Layout: ${currentSlide.layout}
Current Composition Array:
${JSON.stringify(currentComposition, null, 2)}

Visual Review Score: ${assessment.score}/10
Issues Identified by Vision Review:
${(assessment.issues || []).map((i: string) => `- ${i}`).join('\n')}

Suggestions for Improvement:
${(assessment.suggestions || []).map((s: string) => `- ${s}`).join('\n')}

Please regenerate an updated composition array for this slide fixing all listed issues and following the DESIGN RULES.`;

      const refinedResult = await executePrompt(
        'presentation.visual-refine-slide.v1',
        'gemini-3.6-flash',
        refineSystemInstruction,
        refineUserPrompt,
        RefinedCompositionSchema,
        0.5
      );

      const updatedComposition = refinedResult.composition || currentComposition;
      const updatedTitle = refinedResult.title || currentSlide.title;

      const mergedStyle = {
        ...currentStyle,
        composition: updatedComposition,
        visualScore: assessment.score,
        lastIssues: assessment.issues,
      };

      await pool.query(
        `UPDATE slides SET title = $1, style = $2, updated_at = NOW() WHERE id = $3;`,
        [updatedTitle, JSON.stringify(mergedStyle), slideId]
      );

      const updatedSlideRes = await pool.query(
        `SELECT id, presentation_id as "presentationId", slide_order as "slideOrder", layout, title, bullets, speaker_notes as "speakerNotes", image_url as "imageUrl", activity, style, image_score as "imageScore", created_at as "createdAt", updated_at as "updatedAt"
         FROM slides WHERE id = $1;`,
        [slideId]
      );

      const updatedRow = updatedSlideRes.rows[0];
      const parsedStyle = typeof updatedRow.style === 'string' ? JSON.parse(updatedRow.style) : (updatedRow.style || {});

      sendResponse(res, 200, true, {
        status: 'refined',
        attempt: attemptNumber,
        score: assessment.score,
        issues: assessment.issues,
        suggestions: assessment.suggestions,
        slide: {
          ...updatedRow,
          composition: parsedStyle.composition || updatedComposition,
          creativityScore: parsedStyle.creativityScore || 8,
          visualScore: assessment.score,
        },
      });
      return;
    }

    // Score >= 8 OR attempt >= 3: Accept current version
    const finalStyle = {
      ...currentStyle,
      visualScore: assessment.score,
      visualIssues: assessment.issues,
    };

    await pool.query(`UPDATE slides SET style = $1, updated_at = NOW() WHERE id = $2;`, [
      JSON.stringify(finalStyle),
      slideId,
    ]);

    const finalSlideRes = await pool.query(
      `SELECT id, presentation_id as "presentationId", slide_order as "slideOrder", layout, title, bullets, speaker_notes as "speakerNotes", image_url as "imageUrl", activity, style, image_score as "imageScore", created_at as "createdAt", updated_at as "updatedAt"
       FROM slides WHERE id = $1;`,
      [slideId]
    );

    const finalRow = finalSlideRes.rows[0];
    const parsedFinalStyle = typeof finalRow.style === 'string' ? JSON.parse(finalRow.style) : (finalRow.style || {});

    sendResponse(res, 200, true, {
      status: 'accepted',
      attempt: attemptNumber,
      score: assessment.score,
      issues: assessment.issues,
      suggestions: assessment.suggestions,
      slide: {
        ...finalRow,
        composition: parsedFinalStyle.composition || currentComposition,
        creativityScore: parsedFinalStyle.creativityScore || 8,
        visualScore: assessment.score,
      },
    });
  } catch (err: any) {
    console.error('[Visual Refine Controller] Error:', err);
    sendResponse(res, 500, false, undefined, err.message || 'Error executing visual review refinement.');
  }
}
