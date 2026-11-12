import { z } from 'zod';
import { getDbPool } from '../db';
import { executePrompt } from '../services/gemini.service';
import { calculateFleschKincaid } from '../services/textChunking.service';

const QAAuditSchema = z.preprocess((val: any) => {
  if (!val || typeof val !== 'object') return {};
  const recs = Array.isArray(val.improvementRecommendations)
    ? val.improvementRecommendations
    : Array.isArray(val.recommendations)
    ? val.recommendations
    : [];
  return {
    childSafetyPassed: Boolean(val.childSafetyPassed ?? val.safe ?? val.isChildSafe ?? true),
    recommendedGrade: String(val.recommendedGrade || val.gradeLevel || val.grade || 'Grade 5'),
    bloomsTaxonomyDepth: String(val.bloomsTaxonomyDepth || val.bloomsDepth || val.cognitiveLevel || 'Understanding'),
    improvementRecommendations: recs.map((r: any) => String(r)),
  };
}, z.object({
  childSafetyPassed: z.boolean().default(true),
  recommendedGrade: z.string().default('Grade 5'),
  bloomsTaxonomyDepth: z.string().default('Understanding'),
  improvementRecommendations: z.array(z.string()).default([]),
}));

export async function handleQAAudit(payload: {
  assessmentId: string;
  targetType: string;
  targetId: string;
  textContent: string;
}): Promise<any> {
  const { assessmentId, targetType, targetId, textContent } = payload;
  if (!assessmentId) throw new Error('Missing assessmentId in payload');
  if (!textContent) throw new Error('Missing textContent in payload');

  const pool = getDbPool();

  try {
    // 1. Calculate Readability
    const readability = calculateFleschKincaid(textContent);

    // 2. Perform AI QA Assessment
    const sysInst =
      'You are an educational quality assurance and child safety auditor. Audit the provided educational text content for K-12 appropriateness, ' +
      "child safety compliance, Bloom's taxonomy cognitive depth, and actionable quality recommendations.";

    const aiAudit = await executePrompt(
      'qa.audit.v1',
      'gemini-3.6-flash',
      sysInst,
      `TARGET TYPE: ${targetType}\nTARGET ID: ${targetId}\nCONTENT:\n${textContent.slice(0, 4000)}`,
      QAAuditSchema,
      0.2,
      1000
    );

    // 3. Update Database Record
    await pool.query(
      `
      UPDATE qa_assessments 
      SET 
        flesch_kincaid_score = $1,
        recommended_grade = $2,
        child_safety_passed = $3,
        blooms_taxonomy_depth = $4,
        improvement_recommendations = $5::jsonb,
        status = 'approved',
        updated_at = NOW()
      WHERE id = $6;
    `,
      [
        readability.fleschKincaidGradeLevel,
        aiAudit.recommendedGrade || 'Grade 5',
        aiAudit.childSafetyPassed,
        aiAudit.bloomsTaxonomyDepth || 'Understanding',
        JSON.stringify(aiAudit.improvementRecommendations || []),
        assessmentId,
      ]
    );

    console.log(`[QA Audit Handler] Assessment ${assessmentId} completed successfully.`);
    return { assessmentId, status: 'approved', safetyPassed: aiAudit.childSafetyPassed };
  } catch (err: any) {
    console.error(`[QA Audit Handler] Error auditing assessment ${assessmentId}:`, err?.message);
    await pool.query(`UPDATE qa_assessments SET status = 'failed', updated_at = NOW() WHERE id = $1;`, [assessmentId]);
    throw err;
  }
}
