import {
  useGetDashboardSummary,
  useListClasses,
  useGetTodayAttendance,
  useGetRecentHomework,
  getListClassesQueryKey,
  useCreateClass,
} from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  BookOpen,
  Plus,
  ChevronRight,
  BadgeIndianRupee,
  ClipboardCheck,
  BookOpenCheck,
  CheckCircle2,
} from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary();
  const { data: classes, isLoading: isLoadingClasses } = useListClasses();
  const { data: attendance } = useGetTodayAttendance();
  const { data: homework } = useGetRecentHomework();

  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newClassSubject, setNewClassSubject] = useState("");

  const createClass = useCreateClass();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    createClass.mutate(
      { data: { name: newClassName, subject: newClassSubject } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListClassesQueryKey() });
          setIsAddClassOpen(false);
          setNewClassName("");
          setNewClassSubject("");
          toast({ title: "Class created" });
        },
        onError: () => toast({ title: "Failed to create class", variant: "destructive" }),
      }
    );
  };

  // Compute daily tasks
  const classesWithNoAttendance = (attendance || []).filter(
    (a) => a.presentCount === 0 && a.absentCount === 0 && a.totalStudents > 0
  );
  const dueFees = summary?.dueFeeCount ?? 0;

  return (
    <AppLayout>
      <div className="p-4 space-y-5 pb-6">
        {/* Welcome */}
        <div className="space-y-0.5 pt-1">
          {isLoadingSummary ? (
            <Skeleton className="h-7 w-40" />
          ) : (
            <h1 className="text-xl font-semibold tracking-tight">
              Good {getGreeting()}, {summary?.teacherName || "Teacher"} 👋
            </h1>
          )}
          <p className="text-sm text-muted-foreground">{format(new Date(), "EEEE, MMMM d")}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="glass-card rounded-2xl p-3 flex flex-col gap-1.5">
            <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center">
              <Users className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Students</p>
            {isLoadingSummary ? <Skeleton className="h-6 w-8" /> : (
              <p className="text-2xl font-bold leading-none">{summary?.totalStudents ?? 0}</p>
            )}
          </div>
          <div className="glass-card rounded-2xl p-3 flex flex-col gap-1.5">
            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Classes</p>
            {isLoadingSummary ? <Skeleton className="h-6 w-8" /> : (
              <p className="text-2xl font-bold leading-none">{summary?.totalClasses ?? 0}</p>
            )}
          </div>
          <div className="glass-card rounded-2xl p-3 flex flex-col gap-1.5">
            <div className="w-7 h-7 rounded-full bg-rose-100 flex items-center justify-center">
              <BadgeIndianRupee className="w-3.5 h-3.5 text-rose-500" />
            </div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Due Fees</p>
            {isLoadingSummary ? <Skeleton className="h-6 w-8" /> : (
              <p className={`text-2xl font-bold leading-none ${dueFees > 0 ? "text-rose-500" : ""}`}>{dueFees}</p>
            )}
          </div>
        </div>

        {/* Today's Tasks */}
        {(classesWithNoAttendance.length > 0 || dueFees > 0 || (homework && homework.length === 0)) && (
          <div className="glass-card rounded-2xl p-4 space-y-2.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Today's Tasks</p>
            {classesWithNoAttendance.map((cls) => (
              <Link key={cls.classId} href="/attendance" className="flex items-center gap-3 group">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <ClipboardCheck className="w-4 h-4 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium group-hover:text-indigo-600 transition-colors">
                    Take attendance — {cls.className}
                  </p>
                  <p className="text-xs text-muted-foreground">{cls.totalStudents} students pending</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-indigo-500" />
              </Link>
            ))}
            {dueFees > 0 && (
              <Link href="/fees" className="flex items-center gap-3 group">
                <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                  <BadgeIndianRupee className="w-4 h-4 text-rose-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium group-hover:text-indigo-600 transition-colors">
                    Collect fees
                  </p>
                  <p className="text-xs text-muted-foreground">{dueFees} students with due fees this month</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-indigo-500" />
              </Link>
            )}
          </div>
        )}

        {/* Classes */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold tracking-tight">Your Classes</h2>
            <Dialog open={isAddClassOpen} onOpenChange={setIsAddClassOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 px-2 text-indigo-600">
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Class</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddClass} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="className">Class Name</Label>
                    <Input
                      id="className"
                      value={newClassName}
                      onChange={(e) => setNewClassName(e.target.value)}
                      placeholder="e.g. Grade 10 Math"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject (Optional)</Label>
                    <Input
                      id="subject"
                      value={newClassSubject}
                      onChange={(e) => setNewClassSubject(e.target.value)}
                      placeholder="e.g. Mathematics"
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={createClass.isPending} className="w-full">
                      {createClass.isPending ? "Adding…" : "Add Class"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-2">
            {isLoadingClasses ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-18 w-full rounded-2xl" />)
            ) : classes?.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm border border-dashed rounded-2xl">
                No classes yet. Add your first class!
              </div>
            ) : (
              classes?.map((cls) => (
                <Link key={cls.id} href={`/class/${cls.id}`} className="block">
                  <div className="glass-card rounded-2xl p-4 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer group">
                    <div>
                      <h3 className="font-semibold text-sm group-hover:text-indigo-600 transition-colors">{cls.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {cls.subject ? `${cls.subject} · ` : ""}{cls.studentCount ?? 0} students
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-indigo-500" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent Homework */}
        {homework && homework.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold tracking-tight">Recent Homework</h2>
              <Link href="/homework" className="text-xs text-indigo-600 hover:underline">See all</Link>
            </div>
            <div className="space-y-2">
              {homework.slice(0, 3).map((hw) => (
                <div key={hw.id} className="glass-card rounded-2xl p-3.5">
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                      <BookOpenCheck className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-muted-foreground truncate">{hw.className} · {hw.subject}</p>
                        <p className="text-[10px] text-muted-foreground shrink-0">{new Date(hw.createdAt).toLocaleDateString()}</p>
                      </div>
                      <p className="text-sm mt-0.5 line-clamp-2">{hw.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
