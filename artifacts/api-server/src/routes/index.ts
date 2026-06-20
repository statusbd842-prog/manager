import { Router, type IRouter } from "express";
import healthRouter from "./health";
import classesRouter from "./classes";
import studentsRouter from "./students";
import attendanceRouter from "./attendance";
import homeworkRouter from "./homework";
import dashboardRouter from "./dashboard";
import feesRouter from "./fees";
import searchRouter from "./search";

const router: IRouter = Router();

router.use(healthRouter);
router.use(classesRouter);
router.use(studentsRouter);
router.use(attendanceRouter);
router.use(homeworkRouter);
router.use(dashboardRouter);
router.use(feesRouter);
router.use(searchRouter);

export default router;
