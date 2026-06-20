import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { searchStudents } from "@workspace/api-client-react";
import type { SearchResult } from "@workspace/api-client-react";
import { Search, Phone, MessageCircle, Users, CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

export function SearchModal({ open, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery("");
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 1) { setResults([]); return; }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const data = await searchStudents({ q: query.trim() });
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const callPhone = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const whatsappPhone = (phone: string, name: string) => {
    const num = phone.replace(/\D/g, "");
    window.open(`https://wa.me/${num.startsWith("0") ? "88" + num : num}?text=Assalamu+Alaikum+${encodeURIComponent(name)}`, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm p-0 overflow-hidden rounded-2xl border-white/50 bg-white/90 backdrop-blur-xl">
        {/* Search bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, phone, roll…"
            className="border-0 shadow-none focus-visible:ring-0 bg-transparent p-0 h-auto text-sm"
          />
          {isSearching && <Loader2 className="w-4 h-4 text-indigo-500 animate-spin shrink-0" />}
        </div>

        {/* Results */}
        <div className="max-h-[60dvh] overflow-y-auto divide-y divide-slate-50">
          {query.trim().length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground px-4">
              <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              Type a name, phone number, or roll
            </div>
          ) : results.length === 0 && !isSearching ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No students found for "{query}"
            </div>
          ) : (
            results.map((student) => (
              <div key={student.id} className="px-4 py-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm text-foreground truncate">{student.name}</p>
                      {student.roll && (
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full shrink-0">
                          Roll {student.roll}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{student.className}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      {student.attendancePct !== null && (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Users className="w-3 h-3" />
                          {student.attendancePct}% att.
                        </span>
                      )}
                      {student.feeStatus && (
                        <span className={`flex items-center gap-1 text-xs ${
                          student.feeStatus === "paid" ? "text-emerald-600" : "text-rose-500"
                        }`}>
                          {student.feeStatus === "paid"
                            ? <CheckCircle2 className="w-3 h-3" />
                            : <XCircle className="w-3 h-3" />}
                          Fee {student.feeStatus}
                        </span>
                      )}
                      {student.monthlyFee && (
                        <span className="text-xs text-muted-foreground">৳{student.monthlyFee}/mo</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-2 shrink-0">
                    {student.parentPhone && (
                      <>
                        <button
                          onClick={() => callPhone(student.parentPhone!)}
                          className="w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center transition-colors"
                          title="Call parent"
                        >
                          <Phone className="w-3.5 h-3.5 text-slate-600" />
                        </button>
                        <button
                          onClick={() => whatsappPhone(student.parentPhone!, student.name)}
                          className="w-8 h-8 bg-emerald-50 hover:bg-emerald-100 rounded-full flex items-center justify-center transition-colors"
                          title="WhatsApp parent"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
