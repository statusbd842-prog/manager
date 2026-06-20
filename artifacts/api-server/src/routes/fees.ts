import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, feesTable, studentsTable } from "@workspace/db";
import { extractTeacherId } from "../middleware/auth";
import { ListFeesQueryParams, UpdateFeeStatusParams, UpdateFeeStatusBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/fees", async (req, res): Promise<void> => {
  const teacherId = extractTeacherId(req.headers.authorization);
  const parsed = ListFeesQueryParams.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { classId, month } = parsed.data;

  // Get all students in the class
  const students = await db
    .select()
    .from(studentsTable)
    .where(eq(studentsTable.classId, classId))
    .orderBy(studentsTable.createdAt);

  if (students.length === 0) { res.json([]); return; }

  // Get existing fee records
  const existing = await db
    .select()
    .from(feesTable)
    .where(and(eq(feesTable.classId, classId), eq(feesTable.month, month), eq(feesTable.teacherId, teacherId)));

  const existingMap = new Map(existing.map((f) => [f.studentId, f]));

  // Auto-create missing fee records
  const missing = students.filter((s) => !existingMap.has(s.id));
  if (missing.length > 0) {
    const newRecords = await db
      .insert(feesTable)
      .values(
        missing.map((s) => ({
          studentId: s.id,
          classId,
          teacherId,
          amount: s.monthlyFee ?? 0,
          month,
          status: "due" as const,
        }))
      )
      .returning();
    newRecords.forEach((r) => existingMap.set(r.studentId, r));
  }

  // Build response with student names
  const studentMap = new Map(students.map((s) => [s.id, s]));
  const result = students.map((s) => {
    const fee = existingMap.get(s.id)!;
    return {
      ...fee,
      studentName: s.name,
      paidAt: fee.paidAt?.toISOString() ?? null,
      createdAt: fee.createdAt.toISOString(),
    };
  });

  res.json(result);
});

router.patch("/fees/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateFeeStatusParams.safeParse({ id: rawId });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const parsed = UpdateFeeStatusBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const paidAt = parsed.data.status === "paid" ? new Date() : null;

  const [updated] = await db
    .update(feesTable)
    .set({ status: parsed.data.status, paidAt })
    .where(eq(feesTable.id, params.data.id))
    .returning();

  if (!updated) { res.status(404).json({ error: "Fee record not found" }); return; }

  const student = await db.select().from(studentsTable).where(eq(studentsTable.id, updated.studentId)).limit(1);

  res.json({
    ...updated,
    studentName: student[0]?.name ?? null,
    paidAt: updated.paidAt?.toISOString() ?? null,
    createdAt: updated.createdAt.toISOString(),
  });
});

export default router;
