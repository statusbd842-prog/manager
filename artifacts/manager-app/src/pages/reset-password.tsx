import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const form = e.currentTarget;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    const confirm = (form.elements.namedItem("confirm") as HTMLInputElement).value;

    if (password !== confirm) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setIsLoading(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setIsLoading(false);
      return;
    }

    setDone(true);
    setIsLoading(false);

    setTimeout(() => {
      setLocation("/dashboard");
    }, 2500);
  };

  return (
    <div className="auth-gradient min-h-[100dvh] flex flex-col items-center justify-center p-5 relative overflow-hidden">
      <div className="blob-1" />
      <div className="blob-2" />

      <div className="w-full max-w-sm relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-lg mb-4">
            <span className="font-brand font-bold text-4xl text-white leading-none mt-1">M</span>
          </div>
          <h1 className="font-brand font-bold text-3xl text-white tracking-tight">New Password</h1>
          <p className="text-white/65 text-center mt-2 text-sm">Choose a strong new password</p>
        </div>

        <div className="glass-auth rounded-3xl p-7">
          {done ? (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-300" />
              <div>
                <p className="text-white font-semibold text-lg">Password updated!</p>
                <p className="text-white/65 text-sm mt-1">Redirecting you to the dashboard…</p>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {error && (
                <div className="flex items-start gap-2.5 bg-red-500/20 border border-red-400/30 rounded-xl px-3.5 py-3 text-sm text-white">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-300" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-white/75 text-sm font-medium" htmlFor="password">New Password</label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Min. 6 characters"
                    required
                    className="glass-input rounded-xl h-11"
                    autoComplete="new-password"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-white/75 text-sm font-medium" htmlFor="confirm">Confirm Password</label>
                  <Input
                    id="confirm"
                    name="confirm"
                    type="password"
                    placeholder="Repeat new password"
                    required
                    className="glass-input rounded-xl h-11"
                    autoComplete="new-password"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 mt-2 rounded-xl bg-white text-indigo-700 font-semibold hover:bg-white/90 border-0 shadow-lg"
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Update Password
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
