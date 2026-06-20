import { useParams } from "wouter";
import { useState } from "react";
import { 
  useGetClass, 
  useListStudentsByClass, 
  useDeleteStudent,
  useListHomework,
  useCreateHomework,
  getListStudentsByClassQueryKey,
  getGetClassQueryKey,
  getListHomeworkQueryKey,
  getListAllStudentsQueryKey,
} from "@workspace/api-client-react";
import type { Student } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/app-layout";
import { AddStudentModal } from "@/components/add-student-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus, Phone, User, BookOpen, Pencil } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function ClassDetail() {
  const { id } = useParams();
  const classId = id as string;
  
  const { data: classData, isLoading: isLoadingClass } = useGetClass(classId, { query: { enabled: !!classId, queryKey: getGetClassQueryKey(classId) } });
  const { data: students, isLoading: isLoadingStudents } = useListStudentsByClass(classId, { query: { enabled: !!classId, queryKey: getListStudentsByClassQueryKey(classId) } });
  const { data: homework, isLoading: isLoadingHomework } = useListHomework({ classId }, { query: { enabled: !!classId, queryKey: getListHomeworkQueryKey({ classId }) } });
  
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  
  const [isAddHomeworkOpen, setIsAddHomeworkOpen] = useState(false);
  const [newHwSubject, setNewHwSubject] = useState("");
  const [newHwContent, setNewHwContent] = useState("");

  const deleteStudent = useDeleteStudent();
  const createHomework = useCreateHomework();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleDeleteStudent = (studentId: string) => {
    if (!confirm("Remove this student?")) return;
    
    deleteStudent.mutate(
      { id: studentId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListStudentsByClassQueryKey(classId) });
          queryClient.invalidateQueries({ queryKey: getListAllStudentsQueryKey() });
          toast({ title: "Student removed" });
        },
        onError: () => {
          toast({ title: "Failed to remove student", variant: "destructive" });
        }
      }
    );
  };

  const handleAddHomework = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHwSubject.trim() || !newHwContent.trim()) return;

    createHomework.mutate(
      { data: { classId, subject: newHwSubject, content: newHwContent } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListHomeworkQueryKey({ classId }) });
          setIsAddHomeworkOpen(false);
          setNewHwSubject("");
          setNewHwContent("");
          toast({ title: "Homework added successfully" });
        },
        onError: () => {
          toast({ title: "Failed to add homework", variant: "destructive" });
        }
      }
    );
  };

  if (isLoadingClass) {
    return (
      <AppLayout showBack>
        <div className="p-4 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-64 w-full rounded-xl mt-8" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showBack title={classData?.name}>
      <div className="p-4">
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">{classData?.subject || 'No specific subject'}</p>
        </div>

        <Tabs defaultValue="students" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="homework">Homework</TabsTrigger>
          </TabsList>
          
          <TabsContent value="students" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Student List</h3>
              <Button
                variant="secondary"
                size="sm"
                className="h-8 rounded-full px-3"
                onClick={() => setIsAddStudentOpen(true)}
              >
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </div>

            <div className="space-y-2 pb-8">
              {isLoadingStudents ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))
              ) : students?.length === 0 ? (
                <div className="text-center p-8 bg-muted/30 rounded-xl border border-dashed border-border">
                  <User className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground">No students in this class yet.</p>
                </div>
              ) : (
                students?.map((student) => (
                  <Card key={student.id} className="shadow-sm border-border overflow-hidden">
                    <CardContent className="p-0 flex items-center">
                      <Link href={`/students/${student.id}`} className="flex-1 p-4">
                        <p className="font-medium">{student.name}</p>
                        <div className="flex items-center gap-3 mt-1">
                          {student.roll && <span className="text-xs text-muted-foreground">Roll {student.roll}</span>}
                          {student.phone && (
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Phone className="w-3 h-3 mr-1" /> {student.phone}
                            </div>
                          )}
                        </div>
                      </Link>
                      <div className="flex items-center h-full">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-full px-3 text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50"
                          onClick={() => setEditStudent(student)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-full rounded-none px-4 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteStudent(student.id)}
                          disabled={deleteStudent.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="homework" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Homework History</h3>
              <Dialog open={isAddHomeworkOpen} onOpenChange={setIsAddHomeworkOpen}>
                <DialogTrigger asChild>
                  <Button variant="secondary" size="sm" className="h-8 rounded-full px-3">
                    <Plus className="w-4 h-4 mr-1" /> Add
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Assign Homework</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddHomework} className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="hwSubject">Topic / Title</Label>
                      <Input 
                        id="hwSubject" 
                        value={newHwSubject} 
                        onChange={(e) => setNewHwSubject(e.target.value)} 
                        placeholder="e.g. Chapter 4 Exercises"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hwContent">Details</Label>
                      <Textarea 
                        id="hwContent" 
                        value={newHwContent} 
                        onChange={(e) => setNewHwContent(e.target.value)} 
                        placeholder="Complete questions 1-10 on page 42"
                        className="min-h-[100px]"
                        required
                      />
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={createHomework.isPending} className="w-full sm:w-auto">
                        {createHomework.isPending ? "Assigning..." : "Assign"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-3 pb-8">
              {isLoadingHomework ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-xl" />
                ))
              ) : homework?.length === 0 ? (
                <div className="text-center p-8 bg-muted/30 rounded-xl border border-dashed border-border">
                  <BookOpen className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground">No homework assigned yet.</p>
                </div>
              ) : (
                homework?.map((hw) => (
                  <Card key={hw.id} className="shadow-sm border-border bg-card">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <h4 className="font-medium leading-none">{hw.subject}</h4>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(hw.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{hw.content}</p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <AddStudentModal
        open={isAddStudentOpen}
        onClose={() => setIsAddStudentOpen(false)}
        defaultClassId={classId}
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
