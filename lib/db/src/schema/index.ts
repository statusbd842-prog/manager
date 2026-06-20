import { pgTable, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const attendanceStatusEnum = pgEnum("attendance_status", ["present", "absent"]);

export const classesTable = pgTable("classes", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  subject: text("subject"),
  teacherId: text("teacher_id").notNull().default("default-teacher"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const studentsTable = pgTable("students", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  phone: text("phone"),
  parentPhone: text("parent_phone"),
  roll: text("roll"),
  monthlyFee: integer("monthly_fee"),
  admissionDate: text("admission_date"), // YYYY-MM-DD
  notes: text("notes"),
  isArchived: boolean("is_archived").notNull().default(false),
  classId: text("class_id").notNull().references(() => classesTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const attendanceTable = pgTable("attendance", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  studentId: text("student_id").notNull().references(() => studentsTable.id, { onDelete: "cascade" }),
  classId: text("class_id").notNull().references(() => classesTable.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  status: attendanceStatusEnum("status").notNull().default("present"),
});

export const homeworkTable = pgTable("homework", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  classId: text("class_id").notNull().references(() => classesTable.id, { onDelete: "cascade" }),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const feesTable = pgTable("fees", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  studentId: text("student_id").notNull().references(() => studentsTable.id, { onDelete: "cascade" }),
  classId: text("class_id").notNull().references(() => classesTable.id, { onDelete: "cascade" }),
  teacherId: text("teacher_id").notNull(),
  amount: integer("amount").notNull().default(0),
  month: text("month").notNull(),
  status: text("status").notNull().default("due"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertClassSchema = createInsertSchema(classesTable).omit({ id: true, createdAt: true });
export const insertStudentSchema = createInsertSchema(studentsTable).omit({ id: true, createdAt: true });
export const insertAttendanceSchema = createInsertSchema(attendanceTable).omit({ id: true });
export const insertHomeworkSchema = createInsertSchema(homeworkTable).omit({ id: true, createdAt: true });
export const insertFeeSchema = createInsertSchema(feesTable).omit({ id: true, createdAt: true });

export type Class = typeof classesTable.$inferSelect;
export type InsertClass = z.infer<typeof insertClassSchema>;
export type Student = typeof studentsTable.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Attendance = typeof attendanceTable.$inferSelect;
export type Homework = typeof homeworkTable.$inferSelect;
export type InsertHomework = z.infer<typeof insertHomeworkSchema>;
export type Fee = typeof feesTable.$inferSelect;
