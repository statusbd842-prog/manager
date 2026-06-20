import { Router, type IRouter } from "express";
import { eq, count } from "drizzle-orm";
import { db, classesTable, studentsTable } from "@workspace/db";
import {
  CreateClassBody,
  GetClassParams,
  ListClassesResponse,
  GetClassResponse,
} from "@workspace/api-zod";
import { extractTeacherId } from "../middleware/auth";

const router: IRouter = Router();

router.get("/classes", async (req, res): Promise<void> => {
  const teacherId = extractTeacherId(req.headers.authorization);

  const rows = await db
    .select({
      id: classesTable.id,
      name: classesTable.name,
      subject: classesTable.subject,
      teacherId: classesTable.teacherId,
      createdAt: classesTable.createdAt,
      studentCount: count(studentsTable.id),
    })
    .from(classesTable)
    .leftJoin(studentsTable, eq(studentsTable.classId, classesTable.id))
    .where(eq(classesTable.teacherId, teacherId))
    .groupBy(classesTable.id)
    .orderBy(classesTable.createdAt);

  res.json(ListClassesResponse.parse(rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }))));
});

router.post("/classes", async (req, res): Promise<void> => {
  const teacherId = extractTeacherId(req.headers.authorization);
  const parsed = CreateClassBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [cls] = await db
    .insert(classesTable)
    .values({ ...parsed.data, teacherId })
    .returning();

  res.status(201).json(GetClassResponse.parse({ ...cls, createdAt: cls.createdAt.toISOString(), studentCount: 0 }));
});

router.get("/classes/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetClassParams.safeParse({ id: rawId });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const rows = await db
    .select({
      id: classesTable.id,
      name: classesTable.name,
      subject: classesTable.subject,
      teacherId: classesTable.teacherId,
      createdAt: classesTable.createdAt,
      studentCount: count(studentsTable.id),
    })
    .from(classesTable)
    .leftJoin(studentsTable, eq(studentsTable.classId, classesTable.id))
    .where(eq(classesTable.id, params.data.id))
    .groupBy(classesTable.id);

  if (!rows[0]) { res.status(404).json({ error: "Class not found" }); return; }
  res.json(GetClassResponse.parse({ ...rows[0], createdAt: rows[0].createdAt.toISOString() }));
});

export default router;
