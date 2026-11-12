---
title: Subsystem 04 - AI Lesson Planner
layer: SUBSYSTEM_LESSON_AI
status: APPROVED
version: 2.0.0
last_updated: 2026-08-04
author: Curriculum AI Lead
---

# Subsystem 04: AI Lesson Planner

## 1. Overview & Pedagogical Scope
The AI Lesson Planner builds comprehensive, standards-aligned lesson plans from processed storybooks or specific topic prompts. It generates learning objectives, timed classroom activities, discussion prompts, differentiated learning extensions (ELL / IEP / 504), and interactive multiple-choice quizzes with live grading feedback.

---

## 2. Lesson Structure & JSON Schema

```json
{
  "title": "Exploring Bravery in 'Leo the Little Lion'",
  "targetGradeLevel": "Grade 2",
  "durationMinutes": 45,
  "learningObjectives": [
    "Identify character traits from story actions (Common Core RL.2.3)",
    "Define new vocabulary words: courageous, habitat",
    "Formulate personal connections to story themes"
  ],
  "timedSteps": [
    {
      "stepNumber": 1,
      "title": "Warm-Up Story Read-Aloud",
      "durationMinutes": 10,
      "instructions": "Read Chapter 1 aloud with class, pausing to highlight vocabulary."
    },
    {
      "stepNumber": 2,
      "title": "Character Map Group Activity",
      "durationMinutes": 20,
      "instructions": "In small groups, list Leo's feelings and actions on sticky notes."
    },
    {
      "stepNumber": 3,
      "title": "Wrap-up Reflection & Quiz",
      "durationMinutes": 15,
      "instructions": "Complete 3-question comprehension check."
    }
  ],
  "discussionPrompts": [
    "How did Leo show bravery when entering the mysterious cave?",
    "Can you share a time when you felt scared but tried anyway?"
  ],
  "quizQuestions": [
    {
      "id": "q1",
      "question": "What main trait did Leo demonstrate in Chapter 1?",
      "options": ["Greed", "Courage", "Laziness", "Confusion"],
      "correctAnswerIndex": 1,
      "explanation": "Leo faced his fears to help his friend, demonstrating courage."
    }
  ]
}
```

---

## 3. Associated Prompt Catalog Entries

### Prompt `lesson.generate.v1`
- **Model**: `gemini-3.6-flash`
- **System Instruction**: You are an expert K-8 curriculum director. Create a 45-minute structured lesson plan with timed steps, discussion prompts, and quiz questions.

### Prompt `lesson.quiz-generate.v1`
- **Model**: `gemini-3.6-flash`
- **System Instruction**: Synthesize a 3-5 question multiple-choice quiz checking reading comprehension, vocabulary recall, and critical thinking.

### Prompt `lesson.differentiate.v1`
- **Model**: `gemini-3.6-flash`
- **System Instruction**: Provide specific ELL/ESL scaffolds (visual aids, sentence starters) and IEP/504 accommodations (extended time, chunked tasks).

---

## 4. Curricular Rules & Bloom's Taxonomy Depth
1. **Measurable Objectives**: Objectives must use Bloom's verbs (e.g. *Identify*, *Compare*, *Analyze*, *Formulate*).
2. **Pacing Rules**: Total step durations must equal `durationMinutes` (e.g. 10m + 20m + 15m = 45m).
3. **Quiz Quality Rules**:
   - Each question has exactly 4 options.
   - `correctAnswerIndex` is 0-indexed [0-3].
   - Explanations explicitly reference story text context.

---

## 5. Differentiation & Adaptation Engine
- **ELL / ESL Support**: Generates bilingual vocabulary glossaries and visual sentence frames.
- **IEP / 504 Accommodations**: Offers chunked task breakdowns, visual timers, and reduced distractor choices.
- **Gifted & Talented Extensions**: Provides open-ended creative writing extensions and Socratic questioning prompts.
