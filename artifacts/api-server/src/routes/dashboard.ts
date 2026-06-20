import { Router, type IRouter } from "express";
import { eq, count, sql } from "drizzle-orm";
import { db, classesTable, studentsTable, attendanceTable, homeworkTable, feesTable } from "@workspace/db";
import {
  GetDashboardSummaryResponse,
  GetTodayAttendanceResponse,
  GetRecentHomeworkResponse,
} from "@workspace/api-zod";
import { extractTeacherId } from "../middleware/auth";

const router: IRouter = Router();

function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function anyOf(ids: string[]) {
  return sql`= ANY(ARRAY[${sql.join(ids.map((id) => sql`${id}`), sql`, `)}])`;
}

router.get("/dashboard/summary", async (req, res): Promise<void> => {
  const teacherId = extractTeacherId(req.headers.authorization);

  const classes = await db
    .select({ id: classesTable.id })
    .from(classesTable)
    .where(eq(classesTable.teacherId, teacherId));

  const classIds = classes.map((c) => c.id);

  let totalStudents = 0;
  let totalHomework = 0;
  let dueFeeCount = 0;

  if (classIds.length > 0) {
    const [studentResult] = await db
      .select({ total: count(studentsTable.id) })
      .from(studentsTable)
      .where(sql`${studentsTable.classId} ${anyOf(classIds)}`);
    totalStudents = studentResult?.total ?? 0;

    const [hwResult] = await db
      .select({ total: count(homeworkTable.id) })
      .from(homeworkTable)
      .where(sql`${homeworkTable.classId} ${anyOf(classIds)}`);
    totalHomework = hwResult?.total ?? 0;

    const [feeResult] = await db
      .select({ total: count(feesTable.id) })
      .from(feesTable)
      .where(
        sql`${feesTable.classId} ${anyOf(classIds)} AND ${feesTable.status} = 'due' AND ${feesTable.month} = ${getCurrentMonth()}`
      );
    dueFeeCount = feeResult?.total ?? 0;
  }

  res.json(
    GetDashboardSummaryResponse.parse({
      teacherName: "Teacher",
      totalClasses: classIds.length,
      totalStudents,
      totalHomework,
      dueFeeCount,
    })
  );
});

router.get("/dashboard/today-attendance", async (req, res): Promise<void> => {
  const teacherId = extractTeacherId(req.headers.authorization);
  const today = getTodayStr();

  const classes = await db
    .select({ id: classesTable.id, name: classesTable.name })
    .from(classesTable)
    .where(eq(classesTable.teacherId, teacherId));

  const result = await Promise.all(
    classes.map(async (cls) => {
      const [studentCount] = await db
        .select({ total: count(studentsTable.id) })
        .from(studentsTable)
        .where(eq(studentsTable.classId, cls.id));

      const todayRows = await db
        .select({ status: attendanceTable.status })
        .from(attendanceTable)
        .where(
          sql`${attendanceTable.classId} = ${cls.id} AND ${attendanceTable.date} = ${today}`
        );

      const presentCount = todayRows.filter((a) => a.status === "present").length;
      const absentCount = todayRows.filter((a) => a.status === "absent").length;

      return {
        classId: cls.id,
        className: cls.name,
        totalStudents: studentCount?.total ?? 0,
        presentCount,
        absentCount,
      };
    })
  );

  res.json(GetTodayAttendanceResponse.parse(result));
});

router.get("/dashboard/recent-homework", async (req, res): Promise<void> => {
  const teacherId = extractTeacherId(req.headers.authorization);

  const classes = await db
    .select({ id: classesTable.id })
    .from(classesTable)
    .where(eq(classesTable.teacherId, teacherId));

  const classIds = classes.map((c) => c.id);
  if (classIds.length === 0) { res.json([]); return; }

  const rows = await db
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
    .where(sql`${homeworkTable.classId} ${anyOf(classIds)}`)
    .orderBy(sql`${homeworkTable.createdAt} DESC`)
    .limit(5);

  res.json(GetRecentHomeworkResponse.parse(rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }))));
});

export default router;
