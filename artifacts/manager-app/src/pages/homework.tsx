import { useState } from "react";
import {
  useListClasses,
  useListHomework,
  useCreateHomework,
  getListHomeworkQueryKey
} from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, BookOpen, MessageCircle } from "lucide-react";
import { shareToWhatsApp } from "@/lib/whatsapp";

export default function Homework() {
  const [selectedClassId, setSelectedClassId] = useState<string>("");

  const { data: classes, isLoading: isLoadingClasses } = useListClasses();

  const { data: homework, isLoading: isLoadingHomework } = useListHomework(
    { classId: selectedClassId },
    { query: { enabled: !!selectedClassId, queryKey: getListHomeworkQueryKey({ classId: selectedClassId }) } }
  );

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");

  const createHomework = useCreateHomework();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const selectedClass = classes?.find(c => c.id === selectedClassId);

  const handleAddHomework = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !subject.trim() || !content.trim()) return;

    createHomework.mutate(
      { data: { classId: selectedClassId, subject, content } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListHomeworkQueryKey({ classId: selectedClassId }) });
          setIsAddOpen(false);
          setSubject("");
          setContent("");
          toast({ title: "Homework assigned successfully" });
        },
        onError: () => {
          toast({ title: "Failed to assign homework", variant: "destructive" });
        }
      }
    );
  };

  return (
    <AppLayout title="Homework">
      <div className="p-4 flex flex-col h-[calc(100vh-7rem)]">
        <div className="space-y-4 mb-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              {isLoadingClasses ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                  <SelectTrigger className="w-full bg-white/70 backdrop-blur-sm border-white/80 rounded-xl">
                    <SelectValue placeholder="Select class…" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes?.map(cls => (
                      <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            {selectedClassId && (
              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild>
                  <Button size="icon" className="shrink-0 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200">
                    <Plus className="w-5 h-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Assign Homework</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddHomework} className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="subject">Topic / Title</Label>
                      <Input
                        id="subject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="e.g. Chapter 4 Exercises"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="content">Details</Label>
                      <Textarea
                        id="content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Complete questions 1-10 on page 42"
                        className="min-h-[120px]"
                        required
                      />
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={createHomework.isPending} className="w-full">
                        {createHomework.isPending ? "Assigning…" : "Assign Homework"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-4">
          {!selectedClassId ? (
            <div className="h-full flex items-center justify-center text-center p-6 text-slate-400 text-sm">
              Select a class to view and assign homework.
            </div>
          ) : isLoadingHomework ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-2xl" />
              ))}
            </div>
          ) : !homework || homework.length === 0 ? (
            <div className="text-center p-8 mt-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/70 border-dashed">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-400">No homework history for this class.</p>
              <Button
                variant="link"
                className="mt-2 text-indigo-600"
                onClick={() => setIsAddOpen(true)}
              >
                Assign first homework
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {homework.map((hw) => (
                <div key={hw.id} className="glass-card rounded-2xl p-4 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <h4 className="font-semibold text-slate-800 leading-tight">{hw.subject}</h4>
                    <span className="text-xs font-medium text-slate-400 bg-slate-100/80 px-2 py-1 rounded-lg whitespace-nowrap">
                      {new Date(hw.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50/80 rounded-xl text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {hw.content}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full h-9 gap-2 text-green-600 hover:text-green-700 hover:bg-green-50/80 rounded-xl border border-green-100 text-sm font-medium"
                    onClick={() => shareToWhatsApp({
                      className: selectedClass?.name ?? "",
                      subject: hw.subject,
                      content: hw.content,
                    })}
                  >
                    <MessageCircle className="w-4 h-4" />
                    Share on WhatsApp
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
