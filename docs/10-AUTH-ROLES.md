---
title: Layer 10 - Authentication, Authorization & Role-Based Access Control (RBAC)
layer: LAYER_10_AUTH
status: APPROVED
version: 2.0.0
last_updated: 2026-08-04
author: Security & Access Engineering Group
---

# Layer 10: Authentication & Role-Based Access Control (RBAC)

## 1. Overview & Identity Scope
Layer 10 defines user identity management, authentication endpoints, session policy, persona switching, and the granular Role-Based Access Control (RBAC) matrix for Lectio Engine. It ensures secure operation across Educators, Curriculum Leads, QA Auditors, Administrators, and Students while complying with COPPA and FERPA mandates.

---

## 2. System Personas & Key Roles

| Persona / Role | Key Identifier | Description & Primary Access Rights | Default Screen |
| :--- | :--- | :--- | :--- |
| **Educator / Teacher** | `teacher` | Generates lesson plans, uses Teacher Copilot, runs quizzes, views books, creates image assets. | Overview Dashboard |
| **Curriculum Specialist**| `curriculum_lead` | Ingests storybooks, parses text, generates master lesson plans, reviews QA standards. | Overview Dashboard |
| **QA & Compliance Auditor**| `qa_auditor` | Evaluates Flesch-Kincaid readability, audits child safety, inspects Bloom's taxonomy depth. | QA Auditor View |
| **District Administrator**| `admin` | Full system access: provisions staff accounts, views telemetry, manages RBAC permissions. | Admin User Console |
| **Student Learner** | `student` | Reads interactive storybooks, studies vocabulary flashcards, takes self-paced quizzes for XP. | Student Portal |

---

## 3. Granular RBAC Permission Matrix

| UI Feature / API Endpoint | Teacher (`teacher`) | Curriculum Lead (`curriculum_lead`) | QA Auditor (`qa_auditor`) | Admin (`admin`) | Student (`student`) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Overview Dashboard (`/`)** | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | ❌ Redirected |
| **Student Reader (`/student`)** | 👁️ Preview | 👁️ Preview | 👁️ Preview | ✅ Allowed | ✅ Full Interactive |
| **Process New Book (`POST /api/books/process`)** | 👁️ Read-only | ✅ Full Access | 👁️ Read-only | ✅ Full Access | ❌ Forbidden |
| **Generate Lesson (`POST /api/lessons/generate`)**| ✅ Full Access | ✅ Full Access | 👁️ Read-only | ✅ Full Access | ❌ Forbidden |
| **Teacher Copilot Chat (`POST /api/teacher/chat`)**| ✅ Full Access | 👁️ Limited | ❌ Forbidden | ✅ Full Access | ❌ Forbidden |
| **Run QA Audit (`POST /api/qa/audit`)** | 👁️ Read-only | 👁️ Read-only | ✅ Full Audit | ✅ Full Audit | ❌ Forbidden |
| **Generate Image Assets (`POST /api/images/generate`)**| ✅ Full Access | ✅ Full Access | 👁️ Read-only | ✅ Full Access | ❌ Forbidden |
| **Admin Console (`/api/auth/users`)** | ❌ Forbidden | ❌ Forbidden | ❌ Forbidden | ✅ Full Management| ❌ Forbidden |

---

## 4. Session Policy, Security & Compliance

1. **Authentication Endpoints**:
   - `GET /api/auth/me`: Retrieves active user profile and role capabilities.
   - `POST /api/auth/login`: Authenticates account or switches demo persona.
   - `GET /api/auth/users`: Lists district staff directory (Admin only).
   - `POST /api/auth/users`: Provisions new staff account (Admin only).
2. **Demo Persona Switching**:
   - Offers instant 1-click authentication pre-populated with realistic credentials for testing each persona.
3. **Password & Token Security**:
   - Enforces min 8-character password policy with alphanumeric and special character requirements.
   - Session identifiers are stored in client memory/localStorage and verified on protected endpoints.
4. **COPPA / FERPA Compliance**:
   - Student accounts do not store email, phone, or home addresses.
   - Student quiz results are anonymized and restricted to authorized school district staff.
