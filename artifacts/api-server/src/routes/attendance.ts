import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, attendanceTable, studentsTable } from "@workspace/db";
import {
  ListAttendanceQueryParams,
  ListAttendanceResponse,
  SaveAttendanceBody,
  SaveAttendanceResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/attendance", async (req, res): Promise<void> => {
  const params = ListAttendanceQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const conditions = [eq(attendanceTable.classId, params.data.classId)];
  if (params.data.date) {
    conditions.push(eq(attendanceTable.date, params.data.date));
  }

  const rows = await db
    .select({
      id: attendanceTable.id,
      studentId: attendanceTable.studentId,
      studentName: studentsTable.name,
      classId: attendanceTable.classId,
      date: attendanceTable.date,
      status: attendanceTable.status,
    })
    .from(attendanceTable)
    .leftJoin(studentsTable, eq(studentsTable.id, attendanceTable.studentId))
    .where(and(...conditions))
    .orderBy(attendanceTable.date);

  res.json(ListAttendanceResponse.parse(rows));
});

router.post("/attendance", async (req, res): Promise<void> => {
  const parsed = SaveAttendanceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { classId, date, records } = parsed.data;

  // Delete existing records for this class/date, then re-insert
  await db
    .delete(attendanceTable)
    .where(and(eq(attendanceTable.classId, classId), eq(attendanceTable.date, date)));

  if (records.length === 0) {
    res.json([]);
    return;
  }

  const inserted = await db
    .insert(attendanceTable)
    .values(
      records.map((r) => ({
        studentId: r.studentId,
        classId,
        date,
        status: r.status,
      }))
    )
    .returning();

  // Fetch with student names
  const studentIds = inserted.map((r) => r.studentId);
  const students = await db
    .select()
    .from(studentsTable)
    .where(
      eq(studentsTable.id, studentIds[0])
    );

  const studentMap = new Map(students.map((s) => [s.id, s.name]));

  const result = inserted.map((r) => ({
    ...r,
    studentName: studentMap.get(r.studentId) ?? null,
  }));

  res.json(SaveAttendanceResponse.parse(result));
});

export default router;
