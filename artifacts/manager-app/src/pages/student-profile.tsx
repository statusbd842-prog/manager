import { useState } from "react";
import { useParams, useLocation } from "wouter";
import {
  useGetStudentProfile,
  useDeleteStudent,
  useUpdateStudent,
  getListAllStudentsQueryKey,
  getListStudentsByClassQueryKey,
  getGetStudentProfileQueryKey,
} from "@workspace/api-client-react";
import type { Student } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/app-layout";
import { AddStudentModal } from "@/components/add-student-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Phone,
  MessageCircle,
  Pencil,
  Trash2,
  Archive,
  CheckCircle2,
  XCircle,
  BookOpenCheck,
  BadgeIndianRupee,
  Users,
  Calendar,
  StickyNote,
} from "lucide-react";
import { format } from "date-fns";

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function StudentProfilePage() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editOpen, setEditOpen] = useState(false);

  const { data: profile, isLoading } = useGetStudentProfile(id as string, {
    query: { enabled: !!id, queryKey: getGetStudentProfileQueryKey(id as string) },
  });

  const deleteStudent = useDeleteStudent();
  const updateStudent = useUpdateStudent();

  const student = profile?.student;

  const callPhone = (phone: string) => { window.location.href = `tel:${phone}`; };
  const whatsapp = (phone: string, name: string) => {
    const num = phone.replace(/\D/g, "");
    window.open(`https://wa.me/${num.startsWith("0") ? "88" + num : num}?text=Assalamu+Alaikum+${encodeURIComponent(name)}`, "_blank");
  };

  const handleDelete = () => {
    if (!student) return;
    if (!confirm(`Permanently delete ${student.name}?`)) return;
    deleteStudent.mutate(
      { id: student.id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAllStudentsQueryKey() });
          if (student.classId) queryClient.invalidateQueries({ queryKey: getListStudentsByClassQueryKey(student.classId) });
          navigate("/students");
          toast({ title: `${student.name} deleted` });
        },
      }
    );
  };

  const handleArchive = () => {
    if (!student) return;
    const archiving = !student.isArchived;
    updateStudent.mutate(
      { id: student.id, data: { isArchived: archiving } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetStudentProfileQueryKey(student.id) });
          queryClient.invalidateQueries({ queryKey: getListAllStudentsQueryKey() });
          toast({ title: archiving ? `${student.name} archived` : `${student.name} unarchived` });
        },
      }
    );
  };

  if (isLoading || !profile) {
    return (
      <AppLayout showBack title="Student Profile">
        <div className="p-4 space-y-4">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      </AppLayout>
    );
  }

  const { student: s, className, attendancePct, attendanceRecords, feeHistory, recentHomework } = profile;

  return (
    <AppLayout showBack title={s.name}>
      <div className="p-4 flex flex-col gap-4 pb-8">
        {/* Profile header card */}
        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xl shrink-0">
              {getInitials(s.name)}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-lg leading-tight">{s.name}</h1>
              <p className="text-sm text-muted-foreground">{className}{s.roll ? ` · Roll ${s.roll}` : ""}</p>
              {s.monthlyFee && <p className="text-sm text-muted-foreground">৳{s.monthlyFee.toLocaleString()}/month</p>}
              {s.isArchived && (
                <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full mt-1">
                  <Archive className="w-3 h-3" /> Archived
                </span>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="bg-white/60 rounded-xl p-2.5 text-center">
              <p className="text-xs text-muted-foreground">Attendance</p>
              <p className={`text-lg font-bold ${(attendancePct ?? 0) >= 75 ? "text-emerald-600" : "text-rose-500"}`}>
                {attendancePct !== null ? `${attendancePct}%` : "—"}
              </p>
            </div>
            <div className="bg-white/60 rounded-xl p-2.5 text-center">
              <p className="text-xs text-muted-foreground">Days</p>
              <p className="text-lg font-bold">{attendanceRecords?.length ?? 0}</p>
            </div>
            <div className="bg-white/60 rounded-xl p-2.5 text-center">
              <p className="text-xs text-muted-foreground">Fees Paid</p>
              <p className="text-lg font-bold text-emerald-600">
                {feeHistory?.filter((f) => f.status === "paid").length ?? 0}
              </p>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex gap-2 mt-3">
            {s.parentPhone && (
              <>
                <button
                  onClick={() => callPhone(s.parentPhone!)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-indigo-50 hover:bg-indigo-100 rounded-xl text-sm font-medium text-indigo-700 transition-colors"
                >
                  <Phone className="w-4 h-4" /> Call
                </button>
                <button
                  onClick={() => whatsapp(s.parentPhone!, s.name)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-50 hover:bg-emerald-100 rounded-xl text-sm font-medium text-emerald-700 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </button>
              </>
            )}
            <button
              onClick={() => setEditOpen(true)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-sm font-medium text-slate-700 transition-colors"
            >
              <Pencil className="w-4 h-4" /> Edit
            </button>
          </div>
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleArchive}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-amber-50 hover:bg-amber-100 rounded-xl text-sm font-medium text-amber-700 transition-colors"
            >
              <Archive className="w-4 h-4" /> {s.isArchived ? "Unarchive" : "Archive"}
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-rose-50 hover:bg-rose-100 rounded-xl text-sm font-medium text-rose-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white/60 rounded-xl">
            <TabsTrigger value="info" className="text-xs">Info</TabsTrigger>
            <TabsTrigger value="attendance" className="text-xs">
              <Users className="w-3.5 h-3.5 mr-1" />Att.
            </TabsTrigger>
            <TabsTrigger value="fees" className="text-xs">
              <BadgeIndianRupee className="w-3.5 h-3.5 mr-1" />Fees
            </TabsTrigger>
            <TabsTrigger value="homework" className="text-xs">
              <BookOpenCheck className="w-3.5 h-3.5 mr-1" />HW
            </TabsTrigger>
          </TabsList>

          {/* INFO TAB */}
          <TabsContent value="info" className="mt-3">
            <div className="glass-card rounded-2xl p-4 space-y-3">
              <InfoRow label="Class" value={className} />
              {s.roll && <InfoRow label="Roll Number" value={s.roll} />}
              {s.phone && <InfoRow label="Student Phone" value={s.phone} />}
              {s.parentPhone && <InfoRow label="Parent Phone" value={s.parentPhone} />}
              {s.monthlyFee && <InfoRow label="Monthly Fee" value={`৳${s.monthlyFee.toLocaleString()}`} />}
              {s.admissionDate && <InfoRow label="Admission Date" value={s.admissionDate} />}
              <InfoRow label="Joined" value={new Date(s.createdAt).toLocaleDateString()} />
              {s.notes && (
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-start gap-2">
                    <StickyNote className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <p className="text-sm text-muted-foreground">{s.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ATTENDANCE TAB */}
          <TabsContent value="attendance" className="mt-3 space-y-2">
            {!attendanceRecords || attendanceRecords.length === 0 ? (
              <EmptyState icon={<Users className="w-7 h-7 text-slate-300" />} text="No attendance records yet" />
            ) : (
              attendanceRecords.map((a) => (
                <div key={a.id} className={`flex items-center justify-between p-3 rounded-xl ${
                  a.status === "present" ? "bg-emerald-50/80" : "bg-rose-50/80"
                }`}>
                  <div className="flex items-center gap-2">
                    <Calendar className={`w-4 h-4 ${a.status === "present" ? "text-emerald-500" : "text-rose-400"}`} />
                    <span className="text-sm font-medium">{a.date}</span>
                  </div>
                  {a.status === "present"
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    : <XCircle className="w-4 h-4 text-rose-400" />}
                </div>
              ))
            )}
          </TabsContent>

          {/* FEES TAB */}
          <TabsContent value="fees" className="mt-3 space-y-2">
            {!feeHistory || feeHistory.length === 0 ? (
              <EmptyState icon={<BadgeIndianRupee className="w-7 h-7 text-slate-300" />} text="No fee records yet" />
            ) : (
              feeHistory.map((f) => (
                <div key={f.id} className={`flex items-center justify-between p-3 rounded-xl ${
                  f.status === "paid" ? "bg-emerald-50/80" : "bg-rose-50/80"
                }`}>
                  <div>
                    <p className="text-sm font-medium">{f.month}</p>
                    <p className="text-xs text-muted-foreground">৳{f.amount.toLocaleString()}</p>
                  </div>
                  <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                    f.status === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-600"
                  }`}>
                    {f.status === "paid" ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {f.status === "paid" ? "Paid" : "Due"}
                  </span>
                </div>
              ))
            )}
          </TabsContent>

          {/* HOMEWORK TAB */}
          <TabsContent value="homework" className="mt-3 space-y-2">
            {!recentHomework || recentHomework.length === 0 ? (
              <EmptyState icon={<BookOpenCheck className="w-7 h-7 text-slate-300" />} text="No homework for this class yet" />
            ) : (
              recentHomework.map((hw) => (
                <div key={hw.id} className="glass-card rounded-xl p-3.5">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-semibold text-indigo-600">{hw.subject}</span>
                    <span className="text-[10px] text-muted-foreground">{new Date(hw.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-foreground">{hw.content}</p>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {editOpen && student && (
        <AddStudentModal
          open={editOpen}
          onClose={() => {
            setEditOpen(false);
            queryClient.invalidateQueries({ queryKey: getGetStudentProfileQueryKey(student.id) });
          }}
          student={student}
        />
      )}
    </AppLayout>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-xs text-muted-foreground shrink-0">{label}</p>
      <p className="text-sm font-medium text-right truncate">{value}</p>
    </div>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center gap-2 glass-card rounded-2xl">
      {icon}
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
