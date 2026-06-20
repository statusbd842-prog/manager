import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useCreateStudent,
  useUpdateStudent,
  useListClasses,
  getListStudentsByClassQueryKey,
  getListAllStudentsQueryKey,
} from "@workspace/api-client-react";
import type { Student } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface AddStudentModalProps {
  open: boolean;
  onClose: () => void;
  defaultClassId?: string;
  student?: Student | null;
}

const empty = {
  name: "",
  roll: "",
  classId: "",
  monthlyFee: "",
  phone: "",
  parentPhone: "",
  admissionDate: "",
  notes: "",
};

export function AddStudentModal({ open, onClose, defaultClassId, student }: AddStudentModalProps) {
  const isEdit = !!student;
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: classes } = useListClasses();
  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      if (student) {
        setForm({
          name: student.name,
          roll: student.roll ?? "",
          classId: student.classId,
          monthlyFee: student.monthlyFee?.toString() ?? "",
          phone: student.phone ?? "",
          parentPhone: student.parentPhone ?? "",
          admissionDate: student.admissionDate ?? "",
          notes: student.notes ?? "",
        });
      } else {
        setForm({ ...empty, classId: defaultClassId ?? "" });
      }
      setErrors({});
    }
  }, [open, student, defaultClassId]);

  const set = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.roll.trim()) e.roll = "Roll number is required";
    if (!form.classId) e.classId = "Class is required";
    if (!form.monthlyFee || isNaN(Number(form.monthlyFee)) || Number(form.monthlyFee) < 0)
      e.monthlyFee = "Valid monthly fee is required";
    if (!form.parentPhone.trim()) e.parentPhone = "Parent phone is required";
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    const data = {
      name: form.name.trim(),
      roll: form.roll.trim(),
      classId: form.classId,
      monthlyFee: Number(form.monthlyFee),
      phone: form.phone.trim() || undefined,
      parentPhone: form.parentPhone.trim(),
      admissionDate: form.admissionDate || undefined,
      notes: form.notes.trim() || undefined,
    };

    const onSuccess = (verb: string) => {
      queryClient.invalidateQueries({ queryKey: getListAllStudentsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getListStudentsByClassQueryKey(form.classId) });
      onClose();
      if (navigator.vibrate) navigator.vibrate(50);
      toast({ title: `✓ Student ${verb} successfully` });
    };

    if (isEdit) {
      updateStudent.mutate(
        { id: student!.id, data },
        {
          onSuccess: () => onSuccess("updated"),
          onError: () => toast({ title: "Failed to update student", variant: "destructive" }),
        }
      );
    } else {
      createStudent.mutate(
        { data },
        {
          onSuccess: () => onSuccess("added"),
          onError: () => toast({ title: "Failed to add student", variant: "destructive" }),
        }
      );
    }
  };

  const isPending = createStudent.isPending || updateStudent.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm max-h-[90dvh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg">{isEdit ? "Edit Student" : "Add New Student"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2 pb-1">
          <Field label="Student Name *" error={errors.name}>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Full name" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Roll Number *" error={errors.roll}>
              <Input value={form.roll} onChange={(e) => set("roll", e.target.value)} placeholder="e.g. 15" />
            </Field>
            <Field label="Monthly Fee (৳) *" error={errors.monthlyFee}>
              <Input
                value={form.monthlyFee}
                onChange={(e) => set("monthlyFee", e.target.value)}
                placeholder="1500"
                type="number"
                min="0"
              />
            </Field>
          </div>

          <Field label="Class *" error={errors.classId}>
            <Select
              value={form.classId}
              onValueChange={(v) => set("classId", v)}
              disabled={isEdit}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select class…" />
              </SelectTrigger>
              <SelectContent>
                {classes?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Parent Phone *" error={errors.parentPhone}>
            <Input
              value={form.parentPhone}
              onChange={(e) => set("parentPhone", e.target.value)}
              placeholder="01XXXXXXXXX"
              type="tel"
            />
          </Field>

          <Field label="Student Phone (optional)">
            <Input
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="01XXXXXXXXX"
              type="tel"
            />
          </Field>

          <Field label="Admission Date (optional)">
            <Input
              value={form.admissionDate}
              onChange={(e) => set("admissionDate", e.target.value)}
              type="date"
            />
          </Field>

          <Field label="Notes (optional)">
            <Textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Any additional notes…"
              className="min-h-[70px] resize-none"
            />
          </Field>

          <Button type="submit" disabled={isPending} className="w-full h-11 text-base">
            {isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {isEdit ? "Saving…" : "Adding…"}</>
            ) : (
              isEdit ? "Save Changes" : "Add Student"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-slate-700">{label}</Label>
      {children}
      {error && <p className="text-xs text-rose-500">{error}</p>}
    </div>
  );
}
