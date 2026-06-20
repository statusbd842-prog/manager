import { useState, useEffect, useRef, useCallback } from "react";
import {
  useListClasses,
  useListStudentsByClass,
  useListAttendance,
  useSaveAttendance,
  getListAttendanceQueryKey,
  getListStudentsByClassQueryKey,
} from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Check, X, Wifi } from "lucide-react";

export default function Attendance() {
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const todayStr = format(new Date(), "yyyy-MM-dd");

  const { data: classes, isLoading: isLoadingClasses } = useListClasses();
  const { data: students, isLoading: isLoadingStudents } = useListStudentsByClass(
    selectedClassId,
    { query: { enabled: !!selectedClassId, queryKey: getListStudentsByClassQueryKey(selectedClassId) } }
  );
  const { data: attendanceData, isLoading: isLoadingAttendance } = useListAttendance(
    { classId: selectedClassId, date: todayStr },
    { query: { enabled: !!selectedClassId, queryKey: getListAttendanceQueryKey({ classId: selectedClassId, date: todayStr }) } }
  );

  const saveAttendance = useSaveAttendance();
  const [attendanceState, setAttendanceState] = useState<Record<string, "present" | "absent">>({});
  const [isSaving, setIsSaving] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef(attendanceState);
  stateRef.current = attendanceState;

  useEffect(() => {
    if (students && attendanceData !== undefined) {
      const initial: Record<string, "present" | "absent"> = {};
      students.forEach((s) => { initial[s.id] = "present"; });
      attendanceData.forEach((r) => { initial[r.studentId] = r.status; });
      setAttendanceState(initial);
    }
  }, [students, attendanceData, selectedClassId]);

  const doSave = useCallback(
    (state: Record<string, "present" | "absent">) => {
      if (!selectedClassId || !students || students.length === 0) return;
      setIsSaving(true);
      const records = Object.entries(state).map(([studentId, status]) => ({ studentId, status }));
      saveAttendance.mutate(
        { data: { classId: selectedClassId, date: todayStr, records } },
        { onSettled: () => setIsSaving(false) }
      );
    },
    [selectedClassId, students, todayStr, saveAttendance]
  );

  const toggleStatus = (studentId: string) => {
    setAttendanceState((prev) => {
      const newStatus: "present" | "absent" = prev[studentId] === "absent" ? "present" : "absent";
      const next: Record<string, "present" | "absent"> = { ...prev, [studentId]: newStatus };
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => doSave(next), 400);
      return next;
    });
  };

  const presentCount = Object.values(attendanceState).filter((s) => s === "present").length;
  const absentCount = Object.values(attendanceState).filter((s) => s === "absent").length;
  const total = presentCount + absentCount;
  const pct = total > 0 ? Math.round((presentCount / total) * 100) : 100;

  return (
    <AppLayout title="Attendance">
      <div className="p-4 flex flex-col gap-4">
        {/* Class selector */}
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium uppercase tracking-wider">
            <span>Select Class</span>
            <span>{format(new Date(), "EEE, MMM d")}</span>
          </div>
          {isLoadingClasses ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Select value={selectedClassId} onValueChange={(v) => { setSelectedClassId(v); setAttendanceState({}); }}>
              <SelectTrigger className="w-full bg-white/60 border-white/40">
                <SelectValue placeholder="Choose a class…" />
              </SelectTrigger>
              <SelectContent>
                {classes?.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {selectedClassId && total > 0 && (
            <div className="flex items-center gap-3 pt-1">
              <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex items-center gap-3 text-sm font-medium shrink-0">
                <span className="text-emerald-600">{presentCount} P</span>
                <span className="text-rose-500">{absentCount} A</span>
                {isSaving && <Wifi className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />}
              </div>
            </div>
          )}
        </div>

        {/* Student list */}
        {!selectedClassId ? (
          <div className="flex-1 flex items-center justify-center text-center py-20 text-muted-foreground text-sm">
            Select a class to start taking attendance
          </div>
        ) : isLoadingStudents || isLoadingAttendance ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-2xl" />
            ))}
          </div>
        ) : !students || students.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-center py-20 text-muted-foreground text-sm">
            No students in this class yet.
          </div>
        ) : (
          <div className="space-y-2 pb-4">
            <p className="text-xs text-muted-foreground px-1">Tap a student to mark absent</p>
            {students.map((student, i) => {
              const isPresent = attendanceState[student.id] !== "absent";
              return (
                <button
                  key={student.id}
                  onClick={() => toggleStatus(student.id)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-150 active:scale-[0.98] ${
                    isPresent
                      ? "bg-white/70 border-white/50 shadow-sm"
                      : "bg-rose-50/80 border-rose-200/60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      isPresent ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-600"
                    }`}>
                      {student.roll || String(i + 1).padStart(2, "0")}
                    </div>
                    <div className="text-left">
                      <p className={`font-medium text-sm ${!isPresent ? "text-rose-700" : "text-foreground"}`}>
                        {student.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {isPresent ? "Present" : "Absent"}
                      </p>
                    </div>
                  </div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    isPresent ? "bg-emerald-500" : "bg-rose-500"
                  }`}>
                    {isPresent
                      ? <Check className="w-4 h-4 text-white" />
                      : <X className="w-4 h-4 text-white" />}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
