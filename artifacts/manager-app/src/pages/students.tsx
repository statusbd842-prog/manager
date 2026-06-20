import { useState, useEffect, useRef } from "react";
import { useLocation, useSearch } from "wouter";
import {
  useListAllStudents,
  useListClasses,
  useDeleteStudent,
  useUpdateStudent,
  getListAllStudentsQueryKey,
  getListStudentsByClassQueryKey,
} from "@workspace/api-client-react";
import type { StudentWithStats } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/app-layout";
import { AddStudentModal } from "@/components/add-student-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  Phone,
  MessageCircle,
  CheckCircle2,
  XCircle,
  ChevronRight,
  GraduationCap,
  Pencil,
  Trash2,
  Plus,
} from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const BG_COLORS = [
  "bg-indigo-100 text-indigo-700",
  "bg-violet-100 text-violet-700",
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
];

function avatarColor(id: string) {
  const n = id.charCodeAt(0) + id.charCodeAt(1);
  return BG_COLORS[n % BG_COLORS.length];
}

export default function Students() {
  const searchRaw = useSearch();
  const params = new URLSearchParams(searchRaw);
  const shouldOpenAdd = params.get("add") === "1";
  const [, navigate] = useLocation();

  const [searchQ, setSearchQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<StudentWithStats | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Open add modal if ?add=1
  useEffect(() => {
    if (shouldOpenAdd) {
      setAddOpen(true);
      navigate("/students", { replace: true });
    }
  }, [shouldOpenAdd, navigate]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQ(searchQ), 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQ]);

  const { data: classes } = useListClasses();
  const { data: students, isLoading } = useListAllStudents(
    {
      search: debouncedQ || undefined,
      classId: classFilter !== "all" ? classFilter : undefined,
    },
    { query: { queryKey: getListAllStudentsQueryKey({ search: debouncedQ, classId: classFilter }) } }
  );

  const deleteStudent = useDeleteStudent();
  const updateStudent = useUpdateStudent();

  const handleDelete = (s: StudentWithStats) => {
    if (!confirm(`Remove ${s.name}? This cannot be undone.`)) return;
    deleteStudent.mutate(
      { id: s.id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAllStudentsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListStudentsByClassQueryKey(s.classId) });
          toast({ title: `${s.name} removed` });
        },
      }
    );
  };

  const handleArchive = (s: StudentWithStats) => {
    updateStudent.mutate(
      { id: s.id, data: { isArchived: !s.isArchived } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAllStudentsQueryKey() });
          toast({ title: s.isArchived ? `${s.name} unarchived` : `${s.name} archived` });
        },
      }
    );
  };

  const callPhone = (phone: string) => { window.location.href = `tel:${phone}`; };
  const whatsapp = (phone: string, name: string) => {
    const num = phone.replace(/\D/g, "");
    window.open(`https://wa.me/${num.startsWith("0") ? "88" + num : num}?text=Assalamu+Alaikum+${encodeURIComponent(name)}`, "_blank");
  };

  return (
    <AppLayout title="Students">
      <div className="p-4 flex flex-col gap-4">
        {/* Search + filter bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Search by name, phone, roll…"
              className="pl-9 bg-white/70 border-white/50"
            />
          </div>
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="w-32 bg-white/70 border-white/50 shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All classes</SelectItem>
              {classes?.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Add button */}
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 w-full p-3.5 rounded-2xl border-2 border-dashed border-indigo-200 text-indigo-600 text-sm font-medium hover:bg-indigo-50/50 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add New Student
        </button>

        {/* Student cards */}
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-2xl" />
            ))}
          </div>
        ) : !students || students.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center">
              <GraduationCap className="w-8 h-8 text-indigo-300" />
            </div>
            <div>
              <p className="font-medium text-slate-600">
                {searchQ ? `No students matching "${searchQ}"` : "No students yet"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {searchQ ? "Try a different search" : "Add your first student to get started"}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2 pb-4">
            <p className="text-xs text-muted-foreground px-1">{students.length} student{students.length !== 1 ? "s" : ""}</p>
            {students.map((s) => (
              <StudentCard
                key={s.id}
                student={s}
                avatarCls={avatarColor(s.id)}
                onCall={() => s.parentPhone && callPhone(s.parentPhone)}
                onWhatsApp={() => s.parentPhone && whatsapp(s.parentPhone, s.name)}
                onEdit={() => setEditStudent(s)}
                onArchive={() => handleArchive(s)}
                onDelete={() => handleDelete(s)}
              />
            ))}
          </div>
        )}
      </div>

      <AddStudentModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        defaultClassId={classFilter !== "all" ? classFilter : undefined}
      />
      {editStudent && (
        <AddStudentModal
          open={!!editStudent}
          onClose={() => setEditStudent(null)}
          student={editStudent}
        />
      )}
    </AppLayout>
  );
}

function StudentCard({
  student: s,
  avatarCls,
  onCall,
  onWhatsApp,
  onEdit,
  onArchive,
  onDelete,
}: {
  student: StudentWithStats;
  avatarCls: string;
  onCall: () => void;
  onWhatsApp: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <Link href={`/students/${s.id}`} className="block p-4 pb-3">
        <div className="flex items-start gap-3">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${avatarCls}`}>
            {getInitials(s.name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-sm truncate">{s.name}</p>
              {s.feeStatus ? (
                <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                  s.feeStatus === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-600"
                }`}>
                  {s.feeStatus === "paid" ? <CheckCircle2 className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
                  {s.feeStatus === "paid" ? "Paid" : "Due"}
                </span>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
              {s.roll && <span className="text-xs text-muted-foreground">Roll {s.roll}</span>}
              <span className="text-xs text-muted-foreground">{s.className}</span>
              {s.monthlyFee ? <span className="text-xs text-muted-foreground">৳{s.monthlyFee.toLocaleString()}/mo</span> : null}
              {s.attendancePct != null && (
                <span className={`text-xs font-medium ${s.attendancePct >= 75 ? "text-emerald-600" : "text-rose-500"}`}>
                  {s.attendancePct}% att.
                </span>
              )}
            </div>
            {s.parentPhone && (
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <Phone className="w-2.5 h-2.5" /> {s.parentPhone}
              </p>
            )}
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-2" />
        </div>
      </Link>

      {/* Quick actions */}
      <div className="border-t border-slate-100/80 flex divide-x divide-slate-100/80">
        {s.parentPhone && (
          <>
            <button onClick={onCall} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs text-slate-500 hover:bg-slate-50/80 hover:text-indigo-600 transition-colors">
              <Phone className="w-3.5 h-3.5" /> Call
            </button>
            <button onClick={onWhatsApp} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs text-slate-500 hover:bg-emerald-50/80 hover:text-emerald-600 transition-colors">
              <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
            </button>
          </>
        )}
        <button onClick={onEdit} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs text-slate-500 hover:bg-indigo-50/80 hover:text-indigo-600 transition-colors">
          <Pencil className="w-3.5 h-3.5" /> Edit
        </button>
        <button onClick={onDelete} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs text-slate-500 hover:bg-rose-50/80 hover:text-rose-500 transition-colors">
          <Trash2 className="w-3.5 h-3.5" /> Delete
        </button>
      </div>
    </div>
  );
}
