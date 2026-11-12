---
title: Subsystem 05 - Teacher Copilot
layer: SUBSYSTEM_TEACHER_AI
status: APPROVED
version: 2.0.0
last_updated: 2026-08-04
author: Pedagogical Systems Team
---

# Subsystem 05: Teacher Copilot

## 1. Overview & Operational Scope
The Teacher Copilot acts as a real-time AI instructional assistant. Teachers query the copilot for instant assistance with lesson adaptations, special needs modifications (IEP/504 support), English Language Learner (ELL) scaffoldings, behavioral management strategies, printable worksheet generation, and parent communication drafts.

---

## 2. Associated Prompt Catalog Entries

### Prompt `teacher.chat.v1`
- **Model**: `gemini-3.6-flash`
- **System Instruction**: You are an expert instructional coach and veteran K-8 teacher copilot. Provide research-backed, actionable, empathetic teaching advice and resources.
- **Context Attachment**: Automatically injects selected `Book` title, target grade level, and active `LessonPlan` summary into context.

### Prompt `teacher.ell-scaffold.v1`
- **Model**: `gemini-3.6-flash`
- **System Instruction**: Generate multi-tiered ELL/ESL scaffolds (WIDA levels 1-4) with graphic organizers and sentence frames.

### Prompt `teacher.iep-accommodation.v1`
- **Model**: `gemini-3.6-flash`
- **System Instruction**: Formulate specific, compliant IEP/504 accommodations including sensory breaks, visual schedules, and audio support.

### Prompt `teacher.parent-email.v1`
- **Model**: `gemini-3.6-flash`
- **System Instruction**: Draft a warm, professional parent email summarizing student reading milestones, growth areas, and home activities.

---

## 3. Context Attachment & Safety Rules

1. **Context Limits**: History bounded to last 10 turns (approx. 4,000 tokens) to guarantee fast sub-second latency.
2. **PII Redaction**: Student names are scrubbed to anonymous placeholders (`Student A`) prior to sending chat prompts.
3. **Safety Guardrails**:
   - Strictly refuses medical, legal, or psychological diagnosis advice.
   - Refuses inappropriate or non-educational queries with a polite redirection to classroom pedagogy.

---

## 4. Preset Quick Actions
- 💬 **Differentiate for ELL/ESL**: Generates sentence starters and visual vocabulary cards.
- 📄 **Create Printable Worksheet**: Converts lesson objectives into printable practice exercises.
- ✉️ **Draft Parent Update Email**: Synthesizes reading progress into an encouraging email draft.
- 🧩 **IEP / 504 Accommodations**: Formulates task chunking and time extensions.
