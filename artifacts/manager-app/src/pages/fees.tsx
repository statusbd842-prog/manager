import { useState, useEffect } from "react";
import {
  useListClasses,
  useListFees,
  useUpdateFeeStatus,
  getListFeesQueryKey,
} from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { BadgeIndianRupee, CheckCircle2, XCircle } from "lucide-react";

function getCurrentMonth() {
  return format(new Date(), "yyyy-MM");
}

function getMonthLabel(yyyyMM: string) {
  const [y, m] = yyyyMM.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleString("default", { month: "long", year: "numeric" });
}

function buildMonthOptions() {
  const opts: string[] = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    opts.push(format(d, "yyyy-MM"));
  }
  return opts;
}

export default function Fees() {
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth());
  const months = buildMonthOptions();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: classes, isLoading: isLoadingClasses } = useListClasses();

  const feesKey = getListFeesQueryKey({ classId: selectedClassId, month: selectedMonth });
  const { data: fees, isLoading: isLoadingFees } = useListFees(
    { classId: selectedClassId, month: selectedMonth },
    { query: { enabled: !!selectedClassId, queryKey: feesKey } }
  );

  const updateFee = useUpdateFeeStatus();

  const handleToggle = (feeId: string, currentStatus: string) => {
    const newStatus = currentStatus === "paid" ? "due" : "paid";
    updateFee.mutate(
      { id: feeId, data: { status: newStatus } },
      {
        onSuccess: (updated) => {
          queryClient.invalidateQueries({ queryKey: feesKey });
          if (newStatus === "paid") {
            toast({
              title: `✓ Marked as Paid`,
              description: `${updated.studentName} — ${getMonthLabel(selectedMonth)}`,
            });
          }
        },
        onError: () => {
          toast({ title: "Failed to update fee", variant: "destructive" });
        },
      }
    );
  };

  const dueCount = fees?.filter((f) => f.status === "due").length ?? 0;
  const paidCount = fees?.filter((f) => f.status === "paid").length ?? 0;
  const totalAmount = fees?.reduce((sum, f) => sum + f.amount, 0) ?? 0;
  const collectedAmount = fees?.filter((f) => f.status === "paid").reduce((sum, f) => sum + f.amount, 0) ?? 0;

  return (
    <AppLayout title="Fee Management">
      <div className="p-4 flex flex-col gap-4">
        {/* Filters */}
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Select Class & Month</p>
          {isLoadingClasses ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
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
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-full bg-white/60 border-white/40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m} value={m}>{getMonthLabel(m)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Summary bar */}
        {selectedClassId && fees && fees.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            <div className="glass-card rounded-2xl p-3 text-center">
              <p className="text-xs text-muted-foreground">Due</p>
              <p className="text-xl font-bold text-rose-500">{dueCount}</p>
            </div>
            <div className="glass-card rounded-2xl p-3 text-center">
              <p className="text-xs text-muted-foreground">Paid</p>
              <p className="text-xl font-bold text-emerald-600">{paidCount}</p>
            </div>
            <div className="glass-card rounded-2xl p-3 text-center">
              <p className="text-xs text-muted-foreground">Collected</p>
              <p className="text-lg font-bold text-indigo-600">৳{collectedAmount.toLocaleString()}</p>
            </div>
          </div>
        )}

        {/* Fee list */}
        {!selectedClassId ? (
          <div className="flex items-center justify-center text-center py-20 text-muted-foreground text-sm">
            Select a class to manage fees
          </div>
        ) : isLoadingFees ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-2xl" />
            ))}
          </div>
        ) : !fees || fees.length === 0 ? (
          <div className="flex items-center justify-center text-center py-20 text-muted-foreground text-sm">
            No students in this class.
          </div>
        ) : (
          <div className="space-y-2 pb-4">
            <p className="text-xs text-muted-foreground px-1">Tap to toggle paid / due</p>
            {fees.map((fee) => {
              const isPaid = fee.status === "paid";
              return (
                <button
                  key={fee.id}
                  onClick={() => handleToggle(fee.id, fee.status)}
                  disabled={updateFee.isPending}
                  className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-150 active:scale-[0.98] ${
                    isPaid
                      ? "bg-emerald-50/80 border-emerald-200/60"
                      : "bg-white/70 border-white/50 shadow-sm"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                      isPaid ? "bg-emerald-100" : "bg-rose-50"
                    }`}>
                      <BadgeIndianRupee className={`w-5 h-5 ${isPaid ? "text-emerald-600" : "text-rose-400"}`} />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-sm text-foreground">{fee.studentName}</p>
                      <p className="text-[11px] text-muted-foreground">
                        Monthly fee: ৳{fee.amount.toLocaleString()}
                        {fee.paidAt && ` • Paid ${new Date(fee.paidAt).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                    isPaid
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-rose-100 text-rose-600"
                  }`}>
                    {isPaid
                      ? <><CheckCircle2 className="w-3.5 h-3.5" /> Paid</>
                      : <><XCircle className="w-3.5 h-3.5" /> Due</>}
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
