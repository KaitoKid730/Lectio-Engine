---
title: Subsystem 07 - QA & Compliance Auditor
layer: SUBSYSTEM_QA_AI
status: APPROVED
version: 2.0.0
last_updated: 2026-08-04
author: Safety & Compliance Team
---

# Subsystem 07: QA & Compliance Auditor

## 1. Overview & Compliance Objectives
The QA & Compliance Auditor performs automated quality, readability, safety, and pedagogical checks on storybooks and AI-generated lesson plans before they reach classrooms. It evaluates reading grade level, content safety, vocabulary appropriateness, Bloom's taxonomy cognitive depth, and Common Core curriculum alignment.

---

## 2. Associated Prompt Catalog Entries

### Prompt `qa.readability-audit.v1`
- **Model**: `gemini-3.6-flash`
- **System Instruction**: Calculate Flesch-Kincaid readability score, sentence complexity, and syllable density.

### Prompt `qa.age-safety-audit.v1`
- **Model**: `gemini-3.6-flash`
- **System Instruction**: Screen passage text for child safety, age appropriateness, violence, or sensitive content.

### Prompt `qa.blooms-depth-audit.v1`
- **Model**: `gemini-3.6-flash`
- **System Instruction**: Evaluate Bloom's Taxonomy cognitive level (Remembering, Understanding, Applying, Analyzing, Evaluating, Creating).

### Prompt `qa.lesson-quality-audit.v1`
- **Model**: `gemini-3.6-flash`
- **System Instruction**: Verify lesson timing feasibility, objective clarity, and quiz answer key accuracy.

---

## 3. Assessment Thresholds & Scoring Matrix

| Evaluation Dimension | Pass Threshold / Metric | Severity on Failure | Action Required |
| :--- | :--- | :--- | :--- |
| **Flesch-Kincaid Grade** | Within +/- 1.0 grade level of target | Warning | Adjust sentence length & vocabulary |
| **Child Safety Screening** | 100% Pass (Zero unsafe flags) | Critical / Fail | Block publication immediately |
| **Bloom's Taxonomy Depth** | Must include "Applying" or higher | Improvement | Add open-ended analysis prompt |
| **Quiz Answer Accuracy** | 100% Verified correct option | High Error | Regenerate quiz question key |

---

## 4. Audit Report Schema & Remediation Workflow

```json
{
  "fleschKincaidScore": 3.2,
  "recommendedGrade": "Grade 3",
  "childSafetyPassed": true,
  "curriculumAligned": true,
  "bloomsTaxonomyDepth": "Applying & Analyzing",
  "issues": [],
  "improvementRecommendations": [
    "Provide audio pronunciation for multi-syllable vocabulary words.",
    "Include one additional reflection prompt encouraging peer discussion."
  ]
}
```

### Remediation Process:
1. **Audit Invocation**: QA Auditor triggers audit on selected `Book` or `LessonPlan`.
2. **Evaluation**: Gemini runs readability, safety, and Bloom's depth prompts.
3. **Report Generation**: Overall status assigned (`passed` or `failed`).
4. **Actionable Suggestions**: Specific, actionable edits provided to teacher or editor.
