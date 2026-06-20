import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, homeworkTable, classesTable } from "@workspace/db";
import {
  ListHomeworkQueryParams,
  ListHomeworkResponse,
  CreateHomeworkBody,
  DeleteHomeworkParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/homework", async (req, res): Promise<void> => {
  const params = ListHomeworkQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

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
    .where(eq(homeworkTable.classId, params.data.classId))
    .orderBy(homeworkTable.createdAt);

  const mapped = rows.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }));
  res.json(ListHomeworkResponse.parse(mapped));
});

router.post("/homework", async (req, res): Promise<void> => {
  const parsed = CreateHomeworkBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [hw] = await db.insert(homeworkTable).values(parsed.data).returning();

  // Fetch class name
  const [cls] = await db
    .select({ name: classesTable.name })
    .from(classesTable)
    .where(eq(classesTable.id, hw.classId));

  res.status(201).json({
    ...hw,
    className: cls?.name ?? null,
    createdAt: hw.createdAt.toISOString(),
  });
});

router.delete("/homework/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteHomeworkParams.safeParse({ id: rawId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(homeworkTable).where(eq(homeworkTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
