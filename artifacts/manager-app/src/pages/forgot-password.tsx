import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;

    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (authError) {
      setError(authError.message);
      setIsLoading(false);
      return;
    }

    setSent(true);
    setIsLoading(false);
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
          <h1 className="font-brand font-bold text-3xl text-white tracking-tight">Reset Password</h1>
          <p className="text-white/65 text-center mt-2 text-sm">We'll send a reset link to your email</p>
        </div>

        <div className="glass-auth rounded-3xl p-7">
          {sent ? (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-300" />
              <div>
                <p className="text-white font-semibold text-lg">Email sent!</p>
                <p className="text-white/65 text-sm mt-1">Check your inbox for the password reset link. It may take a minute to arrive.</p>
              </div>
              <Link href="/">
                <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 mt-2 gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Sign In
                </Button>
              </Link>
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
                  <label className="text-white/75 text-sm font-medium" htmlFor="email">Email address</label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="teacher@school.edu"
                    required
                    className="glass-input rounded-xl h-11"
                    autoComplete="email"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 mt-2 rounded-xl bg-white text-indigo-700 font-semibold hover:bg-white/90 border-0 shadow-lg"
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Send Reset Link
                </Button>
              </form>
            </div>
          )}
        </div>

        {!sent && (
          <p className="text-center text-white/55 text-sm mt-6">
            Remember your password?{" "}
            <Link href="/" className="text-white/90 font-medium hover:text-white transition-colors underline underline-offset-2">
              Sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
