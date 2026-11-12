import { z } from 'zod';
import { GoogleGenAI } from '@google/genai';
import { getDbPool } from '../db';
import { executePrompt } from '../services/gemini.service';
import { env } from '../config/env';
import { getFallbackImageUrl } from './imageGeneration.handler';
import { generateSlideImageWithScoring } from '../services/imageScoring.service';

export async function generateSlideImage(prompt: string): Promise<string> {
  const visualStyle = 'Vector Graphic';
  const aspectRatio = '16:9';
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
            prompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/jpeg',
              aspectRatio: '16:9',
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
              contents: prompt,
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
            // Silently fallback to static image
          }
        }
      } else {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              responseModalities: ['IMAGE', 'TEXT'],
              imageConfig: { aspectRatio: '16:9' as any },
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
          // Silently fallback to static image
        }
      }
    }
  } catch (_err: any) {
    console.warn('[Presentation Studio] Image generation model limit reached, using slide illustration fallback.');
  }

  return finalImageUrl;
}

const CompositionItemSchema = z.object({
  type: z.enum(['text', 'shape', 'image', 'interactive']),
  content: z.string().optional(),
  imagePrompt: z.string().optional(),
  imageUrl: z.string().optional(),
  shape: z.enum(['circle', 'rectangle', 'triangle', 'blob', 'star']).optional(),
  x: z.string().default('10%'),
  y: z.string().default('10%'),
  width: z.string().optional(),
  height: z.string().optional(),
  fontSize: z.string().optional(),
  rotation: z.number().optional(),
  fill: z.string().optional(),
  zIndex: z.number().optional(),
  style: z.record(z.string(), z.any()).optional(),
  interaction: z
    .object({
      type: z.enum(['quiz', 'flashcard', 'discussion']),
      data: z.record(z.string(), z.any()),
    })
    .optional(),
});

const SlideStyleSchema = z.object({
  bgGradient: z.array(z.string()).optional(),
  accentColor: z.string().optional(),
  titleColor: z.string().optional(),
  textColor: z.string().optional(),
  shape: z.enum(['blob', 'wave', 'starburst', 'cloud', 'none']).optional(),
  fontVibe: z.enum(['bubbly', 'bold', 'rounded']).optional(),
  decorations: z.array(z.string()).optional(),
}).optional();

const SlideSchema = z.object({
  component: z.string().optional(),
  props: z.record(z.string(), z.any()).optional(),
  layout: z.string().default('title'),
  title: z.string(),
  bullets: z.array(z.string()).default([]),
  speakerNotes: z.string().default(''),
  imagePrompt: z.string().optional(),
  style: z.record(z.string(), z.any()).optional(),
  activity: z.any().optional(),
});

const PaletteSchema = z.object({
  bg: z.string().default('#0f172a'),
  accent: z.string().default('#06b6d4'),
  text: z.string().default('#f8fafc'),
  card: z.string().default('#1e293b'),
  font: z.string().optional(),
}).optional();

const PresentationGenerateSchema = z.preprocess((val: any) => {
  if (!val || typeof val !== 'object') return { slides: [], customPalette: undefined };
  const rawSlides = Array.isArray(val.slides) ? val.slides : (Array.isArray(val) ? val : []);
  const rawPalette = val.customPalette || val.custom_palette || undefined;

  const slides = rawSlides.map((s: any, idx: number) => {
    const component = s?.component || (idx === 0 ? 'HeroTitle' : 'CardGrid');
    const props = s?.props && typeof s.props === 'object' ? s.props : {};
    
    const title = String(s?.title || props?.title || `Slide ${idx + 1}`);
    const bullets = Array.isArray(s?.bullets) ? s.bullets.map((b: any) => String(b)) : (Array.isArray(props?.bullets) ? props.bullets : []);
    const speakerNotes = String(s?.speakerNotes || s?.speaker_notes || props?.speakerNotes || '');
    const imagePrompt = s?.imagePrompt || props?.imagePrompt ? String(s?.imagePrompt || props?.imagePrompt) : undefined;

    return {
      component,
      props,
      layout: s?.layout || 'title',
      title,
      bullets,
      speakerNotes,
      imagePrompt,
      style: {
        ...(s?.style || {}),
        component,
        props,
      },
      activity: s?.activity || props?.activity || undefined,
    };
  });

  return { slides, customPalette: rawPalette };
}, z.object({
  slides: z.array(SlideSchema),
  customPalette: PaletteSchema,
}));

export async function handlePresentationGeneration(payload: {
  presentationId: string;
  sourceBookId?: string;
  sourceLessonId?: string;
  gradeLevel?: string;
  slideCount?: number;
  theme?: string;
  designBrief?: string;
}): Promise<any> {
  const { presentationId, sourceBookId, sourceLessonId, gradeLevel = 'Grade 3-5', slideCount = 8 } = payload;
  if (!presentationId) throw new Error('Missing presentationId in payload');

  const pool = getDbPool();

  try {
    // 1. Fetch source book or lesson context and design brief
    let contextTitle = 'Educational Story';
    let contextBody = 'Interactive learning presentation for students.';

    const presDbRes = await pool.query(`SELECT design_brief, theme FROM presentations WHERE id = $1;`, [presentationId]);
    const designBrief = payload.designBrief || presDbRes.rows[0]?.design_brief || '';

    if (sourceBookId) {
      const bookRes = await pool.query(`SELECT title, summary, chapters, vocabulary FROM books WHERE id = $1;`, [sourceBookId]);
      if (bookRes.rows.length > 0) {
        contextTitle = bookRes.rows[0].title;
        const chaptersStr = Array.isArray(bookRes.rows[0].chapters)
          ? JSON.stringify(bookRes.rows[0].chapters).substring(0, 3000)
          : '';
        contextBody = bookRes.rows[0].summary || chaptersStr || contextBody;
      }
    } else if (sourceLessonId) {
      const lessonRes = await pool.query(`SELECT title, learning_objectives, timed_steps FROM lesson_plans WHERE id = $1;`, [sourceLessonId]);
      if (lessonRes.rows.length > 0) {
        contextTitle = lessonRes.rows[0].title;
        contextBody = `Objectives: ${JSON.stringify(lessonRes.rows[0].learning_objectives)}\nSteps: ${JSON.stringify(lessonRes.rows[0].timed_steps)}`;
      }
    }

    // Update presentation status to generating
    await pool.query(`UPDATE presentations SET status = 'generating', updated_at = NOW() WHERE id = $1;`, [presentationId]);

    // 2. Call Gemini
    const systemInstruction = `You are selecting slide designs from a professional component library for an educational presentation (for ages 5–11).

Available components:
- HeroTitle: Giant centered title with decorative background shape (props: title, subtitle, backgroundGradient, decorativeShape)
- SplitScreen: Image on one side, content on the other (props: title, content, bullets, imageUrl, imagePrompt, imagePosition)
- CardGrid: 3-4 cards with icons and descriptions (props: title, subtitle, cards: [{ icon, title, description, badge }])
- Quote: Large centered quote with attribution (props: quote, author, role, avatarUrl)
- InteractiveQuiz: Question with 4 option buttons (props: question, options, correctAnswerIndex, explanation)
- Flashcard: Flippable card with front/back (props: frontText, backText, prompt, category)
- ImageWithOverlay: Full image with text overlay box (props: title, description, imageUrl, imagePrompt, overlayPosition)
- Timeline: Horizontal steps with icons (props: title, subtitle, steps: [{ stepNumber, icon, title, description }])
- Comparison: Two-column layout (props: title, columnA: { title, items }, columnB: { title, items })
- DiscussionPrompt: Large question with speech bubble (props: question, subtitle, discussionTips)

Choose the BEST component for each slide's content. Vary your choices across the deck.

Return JSON in this format:
{
  "customPalette": {
    "bg": "#ffffff",
    "accent": "#0284c7",
    "text": "#0f172a",
    "card": "#f8fafc"
  },
  "slides": [
    {
      "component": "HeroTitle",
      "props": {
        "title": "The Brave Hummingbird",
        "subtitle": "A story of courage",
        "backgroundGradient": ["#4f46e5", "#7c3aed"],
        "decorativeShape": "circle"
      }
    },
    {
      "component": "CardGrid",
      "props": {
        "title": "Key Story Elements",
        "cards": [
          { "icon": "🌟", "title": "Courage", "description": "Being brave even when scared" },
          { "icon": "🚀", "title": "Speed", "description": "Flapping wings 80 times a second" }
        ]
      }
    }
  ]
}`;

    const userPrompt = `Presentation Title/Topic: ${contextTitle}
Target Grade Level: ${gradeLevel}
Desired Slide Count: ${slideCount}
Design Brief: ${designBrief || 'Modern, clean, engaging educational slides with crisp typography.'}

Source Content Context:
${contextBody.substring(0, 4000)}`;

    let aiResult: any;
    try {
      aiResult = await executePrompt(
        'presentation.generate.v1',
        'gemini-3.6-flash',
        systemInstruction,
        userPrompt,
        PresentationGenerateSchema,
        0.7
      );
    } catch (genErr: any) {
      console.warn('[Presentation Handler] Gemini prompt execution failed, using fallback presentation structure:', genErr?.message || genErr);
      aiResult = {
        customPalette: {
          bg: '#0f172a',
          accent: '#38bdf8',
          text: '#f8fafc',
          card: '#1e293b',
          font: 'sans',
        },
        slides: [
          {
            layout: 'title',
            title: contextTitle,
            bullets: ['Interactive Learning Presentation', `Target Grade: ${gradeLevel}`],
            speakerNotes: `Welcome class! Today we are exploring ${contextTitle}.`,
            style: {
              bgGradient: ['#0f172a', '#1e293b'],
              accentColor: '#38bdf8',
              titleColor: '#38bdf8',
              textColor: '#f8fafc',
              shape: 'starburst',
              fontVibe: 'bold',
              decorations: ['sparkles'],
            },
          },
          {
            layout: 'bullets',
            title: 'Learning Goals & Key Ideas',
            bullets: [
              `Explore core concepts of ${contextTitle}`,
              'Participate in interactive classroom activities',
              'Share creative thoughts and discussion questions',
            ],
            speakerNotes: 'Here are our main objectives for this lesson.',
            style: {
              bgGradient: ['#1e1b4b', '#312e81'],
              accentColor: '#a78bfa',
              titleColor: '#a78bfa',
              textColor: '#f3e8ff',
              shape: 'blob',
              fontVibe: 'rounded',
              decorations: ['stars'],
            },
          },
          {
            layout: 'image',
            title: `Visualizing ${contextTitle}`,
            bullets: ['Take a close look at this illustration!'],
            imagePrompt: `Playful, colorful children's educational illustration of ${contextTitle}`,
            speakerNotes: 'Let us observe this illustration together.',
            style: {
              bgGradient: ['#064e3b', '#047857'],
              accentColor: '#34d399',
              titleColor: '#34d399',
              textColor: '#ecfdf5',
              shape: 'wave',
              fontVibe: 'bubbly',
              decorations: ['floating-bubbles'],
            },
          },
          {
            layout: 'quiz',
            title: 'Quick Check-In Question!',
            bullets: [],
            activity: {
              question: `What is the main topic of our presentation today?`,
              options: [contextTitle, 'Space Exploration', 'Ancient Empires', 'Ocean Biology'],
              correctAnswerIndex: 0,
              explanation: `Awesome! Our topic today is ${contextTitle}.`,
            },
            speakerNotes: 'Let us test what we have learned so far!',
            style: {
              bgGradient: ['#831843', '#be185d'],
              accentColor: '#f472b6',
              titleColor: '#f472b6',
              textColor: '#fdf2f8',
              shape: 'starburst',
              fontVibe: 'bold',
              decorations: ['sparkles'],
            },
          },
          {
            layout: 'discussion',
            title: 'Classroom Discussion',
            bullets: [],
            activity: {
              prompt: `What was the most interesting fact you discovered about ${contextTitle}?`,
              talkingPoints: ['Share with your partner', 'Mention one new detail you learned'],
            },
            speakerNotes: 'Turn to a classmate and share your thoughts.',
            style: {
              bgGradient: ['#4c1d95', '#6d28d9'],
              accentColor: '#c084fc',
              titleColor: '#c084fc',
              textColor: '#faf5ff',
              shape: 'cloud',
              fontVibe: 'rounded',
              decorations: ['stars'],
            },
          },
        ],
      };
    }

    if (aiResult.customPalette) {
      await pool.query(
        `UPDATE presentations SET custom_palette = $1, theme = 'custom', updated_at = NOW() WHERE id = $2;`,
        [JSON.stringify(aiResult.customPalette), presentationId]
      );
    } else {
      await pool.query(
        `UPDATE presentations SET theme = 'custom', updated_at = NOW() WHERE id = $1;`,
        [presentationId]
      );
    }

    let initialSlides = aiResult.slides && aiResult.slides.length > 0 ? aiResult.slides : [
      {
        layout: 'title' as const,
        title: contextTitle,
        bullets: ['Interactive Educational Slides', `Target Grade: ${gradeLevel}`],
        speakerNotes: 'Welcome students to today\'s lesson presentation.',
        style: {
          bgGradient: ['#3b82f6', '#8b5cf6'],
          accentColor: '#f59e0b',
          titleColor: '#ffffff',
          textColor: '#f3f4f6',
          shape: 'starburst' as const,
          fontVibe: 'bubbly' as const,
          decorations: ['sparkles'],
        },
      },
      {
        layout: 'bullets' as const,
        title: 'Key Concepts',
        bullets: ['Understand core themes', 'Analyze story elements', 'Engage in group discussion'],
        speakerNotes: 'Review learning goals with the class.',
        style: {
          bgGradient: ['#06b6d4', '#3b82f6'],
          accentColor: '#ec4899',
          titleColor: '#ffffff',
          textColor: '#f8fafc',
          shape: 'blob' as const,
          fontVibe: 'bold' as const,
          decorations: ['stars'],
        },
      },
      {
        layout: 'quiz' as const,
        title: 'Quick Check Question',
        bullets: ['Choose the best answer below:'],
        speakerNotes: 'Have students vote or answer using clickers.',
        style: {
          bgGradient: ['#ec4899', '#8b5cf6'],
          accentColor: '#10b981',
          titleColor: '#ffffff',
          textColor: '#f3f4f6',
          shape: 'cloud' as const,
          fontVibe: 'rounded' as const,
          decorations: ['sparkles'],
        },
        activity: {
          question: `What is the primary topic of ${contextTitle}?`,
          options: ['Core theme analysis', 'Unrelated subject', 'Random speculation', 'Historical myth'],
          correctAnswerIndex: 0,
          explanation: 'Core theme analysis is the central focus of our reading.',
        },
      },
      {
        layout: 'flashcard' as const,
        title: 'Vocabulary Flashcard',
        bullets: ['Flip card to reveal answer'],
        speakerNotes: 'Ask students to define before flipping.',
        style: {
          bgGradient: ['#10b981', '#06b6d4'],
          accentColor: '#f59e0b',
          titleColor: '#ffffff',
          textColor: '#f8fafc',
          shape: 'wave' as const,
          fontVibe: 'bubbly' as const,
          decorations: ['stars'],
        },
        activity: {
          front: 'Main Theme',
          back: 'The central idea or message conveyed by the text.',
        },
      },
    ];

    // 2b. Automatic Design Review & Refinement Step (In-Pipeline with Creativity Score Audit)
    let generatedSlides = initialSlides;
    try {
      const refineSystemInstruction = `You are an expert children's presentation designer performing an automated CREATIVITY SCORE AUDIT.
Evaluate the visual uniqueness of each slide on a 1-10 scale ('creativityScore').
CRITICAL RULE:
- Any slide with a 'creativityScore' below 7 OR any slide that repeats the composition structure of another slide MUST BE REGENERATED.
- Overhaul its 'composition' array to use a completely different layout (e.g., giant angled typography, scattered card grids, offset glass overlays, diagonal shapes, or custom interactive frames).
- Ensure every single slide in the deck has a distinct, expressive composition array.
Return the revised slides array with updated 'composition' and 'creativityScore' values.`;

      const refineUserPrompt = `Design Brief & Topic: ${contextTitle} (${gradeLevel})
Design Brief: ${designBrief || 'Kid-friendly, playful, vibrant educational presentation.'}

Original Slides Array to Audit and Refine:
${JSON.stringify(initialSlides, null, 2)}`;

      const refineResult = await executePrompt(
        'presentation.design-refine.v1',
        'gemini-3.6-flash',
        refineSystemInstruction,
        refineUserPrompt,
        PresentationGenerateSchema,
        0.7
      );

      if (refineResult.slides && refineResult.slides.length > 0) {
        console.log(`[Presentation Handler] Auto-refine step succeeded, refined ${refineResult.slides.length} slides.`);
        generatedSlides = refineResult.slides;
      }
    } catch (refineErr: any) {
      console.warn('[Presentation Handler] Auto-refine step failed or skipped, using initial slides:', refineErr?.message || refineErr);
    }

    // 3. Clear old slides & insert generated slides into DB
    await pool.query(`DELETE FROM slides WHERE presentation_id = $1;`, [presentationId]);

    for (let i = 0; i < generatedSlides.length; i++) {
      const s = generatedSlides[i];
      const slideId = `slide_${i + 1}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const mergedStyle = {
        ...(s.style || {}),
        composition: s.composition,
        creativityScore: s.creativityScore || 8,
      };

      console.log(`[Presentation Handler] Slide ${i + 1} ("${s.title}") Composition (${s.composition?.length || 0} items, creativityScore: ${s.creativityScore || 8}):`, JSON.stringify(s.composition, null, 2));

      await pool.query(
        `INSERT INTO slides (id, presentation_id, slide_order, layout, title, bullets, speaker_notes, image_url, activity, style, image_score, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW());`,
        [
          slideId,
          presentationId,
          i,
          s.layout,
          s.title,
          JSON.stringify(s.bullets),
          s.speakerNotes || '',
          null,
          s.activity ? JSON.stringify(s.activity) : null,
          JSON.stringify(mergedStyle),
          null,
        ]
      );
    }

    // 4. Generate images using generateSlideImageWithScoring for image slides
    for (let i = 0; i < generatedSlides.length; i++) {
      const s = generatedSlides[i];
      if (s.layout === 'image' || s.imagePrompt) {
        const promptToUse = s.imagePrompt || `Playful, colorful illustration for children's educational slide on ${s.title}`;
        try {
          const { imageUrl: generatedUrl, score: imageScore } = await generateSlideImageWithScoring(promptToUse, 5, 70);
          await pool.query(
            `UPDATE slides SET image_url = $1, image_score = $2, updated_at = NOW() WHERE presentation_id = $3 AND slide_order = $4;`,
            [generatedUrl, imageScore, presentationId, i]
          );
        } catch (imgErr: any) {
          console.error(`[Presentation Handler] Error generating image for slide ${i}:`, imgErr?.message || imgErr);
        }
      }
    }

    // Mark presentation as ready
    await pool.query(`UPDATE presentations SET status = 'ready', updated_at = NOW() WHERE id = $1;`, [presentationId]);

    return { presentationId, slideCount: generatedSlides.length, status: 'ready' };
  } catch (err: any) {
    console.error('[Presentation Generation Handler] Error:', err);
    await pool.query(`UPDATE presentations SET status = 'failed', updated_at = NOW() WHERE id = $1;`, [presentationId]);
    throw err;
  }
}
