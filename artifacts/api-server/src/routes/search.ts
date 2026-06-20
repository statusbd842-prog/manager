import { Router, type IRouter } from "express";
import { eq, ilike, or, and, sql } from "drizzle-orm";
import { db, studentsTable, classesTable, attendanceTable, feesTable } from "@workspace/db";
import { extractTeacherId } from "../middleware/auth";

const router: IRouter = Router();

router.get("/search", async (req, res): Promise<void> => {
  const teacherId = extractTeacherId(req.headers.authorization);
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";

  if (q.length < 1) { res.json([]); return; }

  const pattern = `%${q}%`;

  const classes = await db
    .select()
    .from(classesTable)
    .where(eq(classesTable.teacherId, teacherId));

  if (classes.length === 0) { res.json([]); return; }

  const classMap = new Map(classes.map((c) => [c.id, c.name]));
  const classIds = classes.map((c) => c.id);

  const students = await db
    .select()
    .from(studentsTable)
    .where(
      and(
        sql`${studentsTable.classId} = ANY(ARRAY[${sql.join(classIds.map((id) => sql`${id}`), sql`, `)}])`,
        or(
          ilike(studentsTable.name, pattern),
          ilike(studentsTable.phone, pattern),
          ilike(studentsTable.parentPhone, pattern),
          ilike(studentsTable.roll, pattern)
        )
      )
    )
    .limit(20);

  const currentMonth = new Date().toISOString().slice(0, 7);

  const results = await Promise.all(
    students.map(async (s) => {
      const attRows = await db
        .select({ status: attendanceTable.status })
        .from(attendanceTable)
        .where(eq(attendanceTable.studentId, s.id));

      const total = attRows.length;
      const present = attRows.filter((a) => a.status === "present").length;
      const attendancePct = total > 0 ? Math.round((present / total) * 100) : null;

      const feeRows = await db
        .select({ status: feesTable.status })
        .from(feesTable)
        .where(and(eq(feesTable.studentId, s.id), eq(feesTable.month, currentMonth)))
        .limit(1);

      return {
        id: s.id,
        name: s.name,
        roll: s.roll,
        phone: s.phone,
        parentPhone: s.parentPhone,
        monthlyFee: s.monthlyFee,
        classId: s.classId,
        className: classMap.get(s.classId) ?? "",
        feeStatus: feeRows[0]?.status ?? null,
        attendancePct,
      };
    })
  );

  res.json(results);
});

export default router;
