import { Book, LessonPlan, QAAssessment, GeneratedImage, DocumentationFile, SystemStats } from '../types';

export const initialStats: SystemStats = {
  processedBooks: 4,
  generatedLessons: 6,
  teacherInteractions: 18,
  qaAuditsPassed: 5,
  illustrationsGenerated: 8,
};

export const docsList: DocumentationFile[] = [
  {
    id: 'master',
    title: 'MASTER Architecture & Specification',
    layer: 'SYSTEM_MASTER',
    description: 'Executive roadmap, system topology, communication rules, single source of truth.',
    filename: 'MASTER.md',
  },
  {
    id: '01-foundation',
    title: 'Layer 01 - Foundation & Runtime Architecture',
    layer: 'LAYER_01_FOUNDATION',
    description: 'Server bootstrap, environment variables, security directives, error envelope.',
    filename: 'docs/01-FOUNDATION.md',
  },
  {
    id: '02-data-schema',
    title: 'Layer 02 - Data Architecture & ER Schema',
    layer: 'LAYER_02_DATA',
    description: 'Entity relationship diagrams, database tables, JSON documents, indexes.',
    filename: 'docs/02-DATA-SCHEMA.md',
  },
  {
    id: '03-book-processing',
    title: 'Subsystem 03 - Book Processing Engine',
    layer: 'SUBSYSTEM_BOOK_PROCESSING',
    description: 'Text chunking, vocabulary extraction, chapter node parsing, reading metrics.',
    filename: 'docs/03-BOOK-PROCESSING.md',
  },
  {
    id: '04-lesson-ai',
    title: 'Subsystem 04 - AI Lesson Planner',
    layer: 'SUBSYSTEM_LESSON_AI',
    description: 'Automated lesson creation, learning objectives, timed activities, quiz generation.',
    filename: 'docs/04-LESSON-AI.md',
  },
  {
    id: '05-teacher-ai',
    title: 'Subsystem 05 - Teacher Copilot',
    layer: 'SUBSYSTEM_TEACHER_AI',
    description: 'Real-time instructional assistant, ELL differentiation, IEP support, homework generator.',
    filename: 'docs/05-TEACHER-AI.md',
  },
  {
    id: '06-image-ai',
    title: 'Subsystem 06 - Image AI Generator',
    layer: 'SUBSYSTEM_IMAGE_AI',
    description: 'Gemini visual illustration generator, storybook art, visual flashcards.',
    filename: 'docs/06-IMAGE-AI.md',
  },
  {
    id: '07-qa-ai',
    title: 'Subsystem 07 - QA & Safety Auditor',
    layer: 'SUBSYSTEM_QA_AI',
    description: 'Automated readability check, age-appropriateness, content safety, compliance.',
    filename: 'docs/07-QA-AI.md',
  },
  {
    id: '08-api-spec',
    title: 'Layer 08 - API Endpoint Specifications',
    layer: 'LAYER_08_API',
    description: 'REST API contract endpoints, request/response payload schemas.',
    filename: 'docs/08-API-SPEC.md',
  },
  {
    id: '09-checklist',
    title: 'Layer 09 - Feature Implementation Checklist',
    layer: 'SUBSYSTEM_CHECKLIST',
    description: 'Full audit matrix verifying all architecture specs, endpoints, and UI subsystems.',
    filename: 'docs/09-CHECKLIST.md',
  },
  {
    id: '10-auth-roles',
    title: 'Layer 10 - Authentication & Role-Based Access Control',
    layer: 'LAYER_10_AUTH',
    description: 'User identity, multi-persona RBAC rules, student portal, and admin management.',
    filename: 'docs/10-AUTH-ROLES.md',
  },
  {
    id: 'full-feature-review',
    title: 'Master Feature & Specification Review',
    layer: 'MASTER_FEATURE_REVIEW',
    description: 'Itemized feature review mapping every requirement across Sprints 1 to 6.',
    filename: 'docs/FULL-FEATURE-REVIEW.md',
  },
  {
    id: 'module-template',
    title: 'Subsystem Specification Template',
    layer: 'TEMPLATE',
    description: 'Standardized specification template for subsystem modules (Inputs, Outputs, Rules, Criteria).',
    filename: 'docs/MODULE-TEMPLATE.md',
  },
  {
    id: 'template-subsystem',
    title: 'Strict Subsystem Standard Specification Template',
    layer: 'TEMPLATE_SUBSYSTEM',
    description: 'Master standard template defining Module Name, Triggers, Inputs, Outputs, Business & Validation Rules, Workflow, Forbidden Actions, and Acceptance Criteria.',
    filename: 'TEMPLATE_SUBSYSTEM.md',
  },
];

export const initialBooks: Book[] = [
  {
    id: 'book-1',
    title: 'Leo the Lionhearted',
    author: 'Elena Rostova',
    genre: 'Fable / Adventure',
    gradeLevel: 'Grade 2',
    summary: 'Leo is a quiet young lion who discovers that true courage comes from helping friends in need rather than roaring the loudest.',
    chapters: [
      {
        chapterNumber: 1,
        title: 'The Quiet Whispers of the Savannah',
        content: 'High above the golden grass of the savannah, young Leo sat beneath the acacia tree. While other lion cubs practiced their loudest roars, Leo preferred listening to the wind and observing the busy weaver birds weaving their nests.',
        wordCount: 142,
      },
      {
        chapterNumber: 2,
        title: 'The Great River Crossing',
        content: 'When a sudden summer rain filled the riverbed, Pip the field mouse found himself stranded on a slippery rock. Hearing Pip squeak for help, Leo did not hesitate. He carefully placed a fallen branch across the swift water, guiding Pip to safety.',
        wordCount: 168,
      },
    ],
    vocabulary: [
      { word: 'savannah', definition: 'A vast flat grassland with scattered trees in tropical regions', contextSentence: 'Leo looked across the sunlit savannah.', difficulty: 'Intermediate' },
      { word: 'courage', definition: 'The ability to do something that frightens one', contextSentence: 'Helping Pip required true courage.', difficulty: 'Basic' },
      { word: 'hesitate', definition: 'Pause before saying or doing something', contextSentence: 'Leo did not hesitate when his friend called.', difficulty: 'Advanced' },
    ],
    themes: ['Courage', 'Kindness', 'Observation', 'Friendship'],
    createdAt: '2026-08-04T10:00:00.000Z',
  },
  {
    id: 'book-2',
    title: 'The Magic Seed of Wonder',
    author: 'Marcus Vance',
    genre: 'Fantasy / Science',
    gradeLevel: 'Grade 3',
    summary: 'Maya discovers an unusual glowing seed in her grandmother garden that grows into a magnificent rainbow plant when nurtured with patience and curiosity.',
    chapters: [
      {
        chapterNumber: 1,
        title: 'An Unexpected Discovery',
        content: 'While digging gently in the soft black soil of grandmother garden, Maya noticed a seed shining like a tiny fallen star. It felt warm in her palm and sparkled with faint blue light.',
        wordCount: 135,
      },
      {
        chapterNumber: 2,
        title: 'Patience and Sunlight',
        content: 'Maya watered the soil every morning and sang sweet melodies. Days passed without a sprout, but on the seventh day, two tiny iridescent leaves poked through the earth.',
        wordCount: 152,
      },
    ],
    vocabulary: [
      { word: 'iridescent', definition: 'Showing luminous colors that seem to change when seen from different angles', contextSentence: 'The leaves pouted with iridescent reflections.', difficulty: 'Advanced' },
      { word: 'nurture', definition: 'Care for and encourage the growth or development of', contextSentence: 'Maya learned how to nurture living plants.', difficulty: 'Intermediate' },
    ],
    themes: ['Patience', 'Botany & Nature', 'Curiosity'],
    createdAt: '2026-08-04T10:15:00.000Z',
  },
];

export const initialLessons: LessonPlan[] = [
  {
    id: 'lesson-1',
    bookId: 'book-1',
    bookTitle: 'Leo the Lionhearted',
    title: 'Character Analysis: True Courage & Heroism',
    gradeLevel: 'Grade 2',
    durationMinutes: 45,
    learningObjectives: [
      'Identify key character traits using textual evidence',
      'Understand and apply vocabulary words: savannah, courage',
      'Reflect on personal acts of bravery in daily life',
    ],
    discussionQuestions: [
      'How was Leo different from the other lion cubs in Chapter 1?',
      'Why was helping Pip an example of courage even though Leo did not roar?',
      'How can we show kindness when a classmate needs help?',
    ],
    activities: [
      {
        step: 1,
        title: 'Story Read-Aloud & Vocabulary Check',
        durationMinutes: 15,
        instructions: 'Read Chapter 1 & 2 aloud as a group. Pause at "savannah" and "courage" to discuss context clues.',
      },
      {
        step: 2,
        title: 'Courage vs. Loudness Comparison Chart',
        durationMinutes: 20,
        instructions: 'Divide students into pairs. Create a T-chart listing "Roaring Loudly" vs "Helping Friends".',
      },
      {
        step: 3,
        title: 'Comprehension Quiz & Wrap-Up',
        durationMinutes: 10,
        instructions: 'Administer the 3-question quick quiz and share exit slips.',
      },
    ],
    quizQuestions: [
      {
        question: 'What did Leo prefer to do while other cubs practiced roaring?',
        options: [
          'Sleep under the rocks',
          'Listen to the wind and observe birds',
          'Run races across the mud',
          'Hide in deep caves',
        ],
        correctAnswerIndex: 1,
        explanation: 'Leo was observant and enjoyed listening to the savannah wind and watching weaver birds.',
      },
      {
        question: 'How did Leo help Pip the field mouse cross the water?',
        options: [
          'He carried Pip in his mouth',
          'He placed a fallen branch across the swift stream',
          'He swam across with Pip on his back',
          'He asked an elephant to build a bridge',
        ],
        correctAnswerIndex: 1,
        explanation: 'Leo cleverly placed a fallen branch across the river to guide Pip across safely.',
      },
    ],
    createdAt: '2026-08-04T10:30:00.000Z',
  },
];

export const initialAudits: QAAssessment[] = [
  {
    id: 'qa-1',
    targetId: 'book-1',
    targetType: 'book',
    targetTitle: 'Leo the Lionhearted',
    readabilityScore: 2.3,
    recommendedGrade: 'Grade 2',
    safetyPassed: true,
    curriculumAligned: true,
    metrics: {
      vocabularyComplexity: 'Grade Appropriate',
      avgSentenceLength: 12.4,
      bloomsTaxonomyDepth: 'Understanding & Applying',
    },
    issues: [],
    recommendations: [
      'Text vocabulary is well balanced for Grade 2 readers.',
      'Consider adding a visual map of the savannah to boost geographic comprehension.',
    ],
    createdAt: '2026-08-04T10:45:00.000Z',
  },
];

export const initialImages: GeneratedImage[] = [
  {
    id: 'img-1',
    prompt: 'A gentle young lion cub sitting under a acacia tree in a golden sunlit savannah with weaver birds, soft fairytale illustration style',
    style: 'Storybook Watercolor',
    aspectRatio: '16:9',
    imageUrl: 'https://picsum.photos/seed/lion-savannah/1200/675',
    createdAt: '2026-08-04T11:00:00.000Z',
  },
  {
    id: 'img-2',
    prompt: 'A glowing magical seed shining brightly in dark fertile garden soil, vibrant 3D cartoon style',
    style: '3D Animated Cartoon',
    aspectRatio: '1:1',
    imageUrl: 'https://picsum.photos/seed/magic-seed/800/800',
    createdAt: '2026-08-04T11:10:00.000Z',
  },
];
