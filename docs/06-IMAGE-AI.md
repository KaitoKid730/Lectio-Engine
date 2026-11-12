---
title: Subsystem 06 - Image AI Generator
layer: SUBSYSTEM_IMAGE_AI
status: APPROVED
version: 2.0.0
last_updated: 2026-08-04
author: Visual Assets & Multimodal AI Team
---

# Subsystem 06: Image AI Generator

## 1. Overview & Visual Pipeline
The Image AI Generator produces child-friendly, vibrant storybook illustrations, visual vocabulary cards, and lesson cover assets using Gemini image models (`gemini-3.1-flash-lite-image` / `gemini-3.1-flash-image`).

---

## 2. Associated Prompt Catalog Entries

### Prompt `image.prompt-builder.v1`
- **Model**: `gemini-3.6-flash`
- **System Instruction**: Convert chapter passages or vocabulary concepts into vivid, age-appropriate, detailed visual illustration prompts.

### Prompt `image.generate.v1`
- **Model**: `gemini-3.1-flash-lite-image`
- **System Instruction**: Render high-quality, child-friendly story artwork adhering to specified style and aspect ratio.

### Prompt `image.safety-check.v1`
- **Model**: `gemini-3.6-flash`
- **System Instruction**: Verify prompt contains zero scary, violent, or inappropriate visual concepts prior to model execution.

---

## 3. Style Presets & Technical Specifications

| Preset Style | Visual Characteristics | Target Use Case |
| :--- | :--- | :--- |
| **Storybook Watercolor** | Soft pastel wash, expressive characters, warm gentle lighting. | Storybook pages & chapter headers |
| **3D Animated Cartoon** | Vibrant primary colors, smooth textures, playful depth. | Interactive student reader & covers |
| **Flat Vector Graphic** | Clean geometric lines, high contrast, minimalist shapes. | Vocabulary flashcards & worksheets |

### Supported Aspect Ratios:
- **`1:1`**: Square flashcards, avatar cards, quiz icons.
- **`16:9`**: Widescreen lesson banners, dashboard heroes.
- **`4:3`**: Standard storybook page illustrations.

---

## 4. Fallback & Retry Pipeline
1. **Validation**: Check prompt safety and parameter constraints.
2. **Generation**: Call `gemini-3.1-flash-lite-image`.
3. **Retry Logic**: If API rate limits occur, retry up to 2 times with exponential backoff.
4. **Fallback Mechanism**: On quota exhaustion or network offline, serve high-quality pre-seeded visual artwork to ensure zero user-facing downtime.
5. **Accessibility**: Every generated image auto-generates descriptive `alt` text for screen readers.
