import { Router, type IRouter } from "express";
import { eq, and, or, ilike, inArray, count, desc, type SQL } from "drizzle-orm";
import {
  db,
  studentsTable,
  classesTable,
  attendanceTable,
  feesTable,
  homeworkTable,
} from "@workspace/db";
import {
  ListStudentsByClassParams,
  ListStudentsByClassResponse,
  CreateStudentBody,
  DeleteStudentParams,
  UpdateStudentParams,
  UpdateStudentBody,
  UpdateStudentResponse,
} from "@workspace/api-zod";
import { sql } from "drizzle-orm";
import { extractTeacherId } from "../middleware/auth";

const router: IRouter = Router();

// List students in a specific class
router.get("/classes/:id/students", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ListStudentsByClassParams.safeParse({ id: rawId });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const rows = await db
    .select()
    .from(studentsTable)
    .where(and(eq(studentsTable.classId, params.data.id), eq(studentsTable.isArchived, false)))
    .orderBy(studentsTable.roll, studentsTable.createdAt);

  res.json(ListStudentsByClassResponse.parse(rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }))));
});

// List ALL students for the teacher with computed stats
router.get("/students", async (req, res): Promise<void> => {
  const teacherId = extractTeacherId(req.headers.authorization);
  const searchQ = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const classIdFilter = typeof req.query.classId === "string" ? req.query.classId : undefined;
  const archivedFilter = req.query.archived === "true";

  const classes = await db
    .select()
    .from(classesTable)
    .where(eq(classesTable.teacherId, teacherId));

  if (classes.length === 0) { res.json([]); return; }

  const classMap = new Map(classes.map((c) => [c.id, c.name]));
  let classIds = classes.map((c) => c.id);
  if (classIdFilter) classIds = classIds.filter((id) => id === classIdFilter);
  if (classIds.length === 0) { res.json([]); return; }

  // Build where conditions
  const baseConditions: SQL[] = [
    inArray(studentsTable.classId, classIds),
    eq(studentsTable.isArchived, archivedFilter),
  ];

  if (searchQ) {
    const pattern = `%${searchQ}%`;
    const searchCond = or(
      ilike(studentsTable.name, pattern),
      ilike(studentsTable.phone, pattern),
      ilike(studentsTable.parentPhone, pattern),
      ilike(studentsTable.roll, pattern)
    );
    if (searchCond) baseConditions.push(searchCond);
  }

  const students = await db
    .select()
    .from(studentsTable)
    .where(and(...baseConditions))
    .orderBy(studentsTable.createdAt);

  if (students.length === 0) { res.json([]); return; }

  const studentIds = students.map((s) => s.id);
  const currentMonth = new Date().toISOString().slice(0, 7);

  // Bulk attendance stats per student
  const attStats = await db
    .select({
      studentId: attendanceTable.studentId,
      total: count(),
      presentCount: sql<number>`count(*) filter (where ${attendanceTable.status} = 'present')`,
    })
    .from(attendanceTable)
    .where(inArray(attendanceTable.studentId, studentIds))
    .groupBy(attendanceTable.studentId);

  const attMap = new Map(attStats.map((a) => [a.studentId, a]));

  // Bulk fee status for current month
  const feeRows = await db
    .select({ studentId: feesTable.studentId, status: feesTable.status })
    .from(feesTable)
    .where(and(inArray(feesTable.studentId, studentIds), eq(feesTable.month, currentMonth)));

  const feeMap = new Map(feeRows.map((f) => [f.studentId, f.status]));

  const result = students.map((s) => {
    const att = attMap.get(s.id);
    const total = Number(att?.total ?? 0);
    const present = Number(att?.presentCount ?? 0);
    return {
      ...s,
      createdAt: s.createdAt.toISOString(),
      className: classMap.get(s.classId) ?? "",
      attendancePct: total > 0 ? Math.round((present / total) * 100) : null,
      feeStatus: feeMap.get(s.id) ?? null,
    };
  });

  res.json(result);
});

// Create student
router.post("/students", async (req, res): Promise<void> => {
  const parsed = CreateStudentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [student] = await db.insert(studentsTable).values(parsed.data).returning();
  res.status(201).json({ ...student, createdAt: student.createdAt.toISOString() });
});

// Update student
router.put("/students/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateStudentParams.safeParse({ id: rawId });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const parsed = UpdateStudentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [updated] = await db
    .update(studentsTable)
    .set(parsed.data)
    .where(eq(studentsTable.id, params.data.id))
    .returning();

  if (!updated) { res.status(404).json({ error: "Student not found" }); return; }
  res.json(UpdateStudentResponse.parse({ ...updated, createdAt: updated.createdAt.toISOString() }));
});

// Delete student
router.delete("/students/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteStudentParams.safeParse({ id: rawId });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  await db.delete(studentsTable).where(eq(studentsTable.id, params.data.id));
  res.sendStatus(204);
});

// Student profile — full history
router.get("/students/:id/profile", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const [student] = await db
    .select()
    .from(studentsTable)
    .where(eq(studentsTable.id, rawId))
    .limit(1);

  if (!student) { res.status(404).json({ error: "Student not found" }); return; }

  const [cls] = await db
    .select()
    .from(classesTable)
    .where(eq(classesTable.id, student.classId))
    .limit(1);

  const attendanceRecords = await db
    .select()
    .from(attendanceTable)
    .where(eq(attendanceTable.studentId, rawId))
    .orderBy(desc(attendanceTable.date))
    .limit(60);

  const total = attendanceRecords.length;
  const present = attendanceRecords.filter((a) => a.status === "present").length;
  const attendancePct = total > 0 ? Math.round((present / total) * 100) : null;

  const feeHistory = await db
    .select()
    .from(feesTable)
    .where(eq(feesTable.studentId, rawId))
    .orderBy(desc(feesTable.month))
    .limit(12);

  const recentHomework = await db
    .select({
      id: homeworkTable.id,
      classId: homeworkTable.classId,
      className: classesTable.name,
      subject: homeworkTable.subject,
      content: homeworkTable.content,
      createdAt: homeworkTable.createdAt,
    })
    .from(homeworkTable)
    .leftJoin(classesTable, eq(classesTable.id, homeworkTable.classId))
    .where(eq(homeworkTable.classId, student.classId))
    .orderBy(desc(homeworkTable.createdAt))
    .limit(10);

  res.json({
    student: { ...student, createdAt: student.createdAt.toISOString() },
    className: cls?.name ?? "",
    attendancePct,
    attendanceRecords,
    feeHistory: feeHistory.map((f) => ({
      ...f,
      paidAt: f.paidAt?.toISOString() ?? null,
      createdAt: f.createdAt.toISOString(),
    })),
    recentHomework: recentHomework.map((h) => ({
      ...h,
      createdAt: h.createdAt.toISOString(),
    })),
  });
});

export default router;
