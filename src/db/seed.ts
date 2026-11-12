import bcrypt from 'bcrypt';
import { getDb, ensurePgliteReady } from './index';
import { users, classrooms, studentEnrollments, schoolDistricts, schools } from './schema';

export async function ensureSeedUsersExist() {
  try {
    await ensurePgliteReady();
    const db = getDb();
    const existingUsers = await db.select({ id: users.id }).from(users).limit(1);

    if (existingUsers.length > 0) return;

    console.log('Seeding initial database records...');

    // Create default school district
    const [district] = await db
      .insert(schoolDistricts)
      .values({
        id: 'dist-001',
        name: 'Springfield School District',
        code: 'SSD-001',
        state: 'IL',
      })
      .onConflictDoNothing()
      .returning();

    const districtId = district?.id || 'dist-001';

    // Create default school
    const [school] = await db
      .insert(schools)
      .values({
        id: 'sch-001',
        districtId,
        name: 'Springfield Elementary',
        code: 'SES-101',
      })
      .onConflictDoNothing()
      .returning();

    const schoolId = school?.id || 'sch-001';

    // Create default classroom
    await db
      .insert(classrooms)
      .values({
        id: 'cls-001',
        schoolId,
        districtId,
        name: 'Grade 3 - Room 102',
        gradeLevel: '3',
        accessCode: 'READ2026',
      })
      .onConflictDoNothing();

    const defaultPasswordHash = await bcrypt.hash('password123', 10);
    const defaultPinHash = await bcrypt.hash('1234', 10);

    const seedUsersList = [
      {
        id: 'usr_teacher_1',
        email: 'teacher@lectio.edu',
        passwordHash: defaultPasswordHash,
        name: 'Sara Jenkins, M.Ed.',
        role: 'teacher',
        title: '3rd Grade Lead Educator',
        districtId,
        status: 'active',
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      },
      {
        id: 'usr_curriculum_1',
        email: 'curriculum@lectio.edu',
        passwordHash: defaultPasswordHash,
        name: 'Marcus Vance',
        role: 'curriculum_lead',
        title: 'Director of K-8 Literacy & Curriculum',
        districtId,
        status: 'active',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      },
      {
        id: 'usr_qa_1',
        email: 'qa@lectio.edu',
        passwordHash: defaultPasswordHash,
        name: 'Elena Rostova',
        role: 'qa_auditor',
        title: 'Senior Standards & Compliance Auditor',
        districtId,
        status: 'active',
        avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      },
      {
        id: 'usr_admin_1',
        email: 'admin@lectio.edu',
        passwordHash: defaultPasswordHash,
        name: 'Dr. Arthur Vance',
        role: 'admin',
        title: 'System Administrator & District Officer',
        districtId,
        status: 'active',
        mustChangePassword: true,
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      },
      {
        id: 'usr_student_1',
        pinHash: defaultPinHash,
        name: 'Student 101',
        pseudonymousLabel: 'Student 101',
        role: 'student',
        title: 'Elementary Learner (Grade 3)',
        districtId,
        status: 'active',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      },
    ];

    for (const u of seedUsersList) {
      await db.insert(users).values(u as any).onConflictDoNothing();
    }

    // Enroll student in classroom
    await db
      .insert(studentEnrollments)
      .values({
        classroomId: 'cls-001',
        studentId: 'usr_student_1',
      })
      .onConflictDoNothing();

    console.log('Database seeding complete.');
  } catch (err) {
    console.warn('Seed initialization notice:', err);
  }
}
