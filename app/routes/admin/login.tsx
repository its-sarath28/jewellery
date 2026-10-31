import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import type { Route } from "./+types/login";
import supabase from "~/lib/supabase";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Admin Portal Sign In - Siarah Studio" },
    {
      name: "description",
      content:
        "Secure administrative login for Siarah luxury jewellery management.",
    },
  ];
}

export default function AdminLoginPage() {
  const navigate = useNavigate();

  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [isCheckingInitialSession, setIsCheckingInitialSession] =
    useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check if user is already authenticated
  useEffect(() => {
    let mounted = true;

    async function checkExistingSession() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!mounted) return;

        if (session?.user) {
          navigate("/admin", { replace: true });
        }
      } catch (err) {
        console.error("Session check error:", err);
      } finally {
        if (mounted) setIsCheckingInitialSession(false);
      }
    }

    checkExistingSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user && mounted) {
          navigate("/admin", { replace: true });
        }
      },
    );

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [navigate]);

  // Handle Sign In Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setErrorMessage("Please enter both email address and password.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        if (error.message.toLowerCase().includes("invalid login credentials")) {
          setErrorMessage(
            "Invalid email or password. Please verify your administrator credentials.",
          );
        } else {
          setErrorMessage(error.message);
        }
        return;
      }

      if (data.session) {
        setSuccessMessage("Authenticated successfully! Redirecting...");
        setTimeout(() => {
          navigate("/admin", { replace: true });
        }, 400);
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      setErrorMessage(
        err?.message ||
          "An unexpected authentication error occurred. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (isCheckingInitialSession) {
    return (
      <div className="min-h-screen bg-[#161311] text-[#ede5d8] flex flex-col items-center justify-center p-6 select-none">
        <div className="flex flex-col items-center gap-3 text-center animate-fade-in">
          <span className="font-serif text-2xl tracking-[0.28em] text-[#f5ede3] font-normal">
            SIARAH
          </span>
          <div className="flex items-center gap-2 text-xs text-[#caa982] uppercase tracking-[0.2em] font-light">
            <RefreshCw size={13} className="animate-spin" />
            <span>Checking session...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141210] text-[#ede5d8] flex flex-col justify-between relative overflow-hidden select-none">
      {/* Background ambient luxury lighting */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 25%, rgba(202, 169, 130, 0.16) 0%, rgba(20, 18, 16, 0) 70%)",
        }}
      />
      <div
        className="pointer-events-none absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-20 blur-3xl"
        style={{ background: "#caa982" }}
      />

      {/* Top Bar with Return to Store */}
      <header className="relative z-10 px-6 sm:px-10 py-6 flex items-center justify-between border-b border-[#29231c]">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#a89684] hover:text-[#f4eee4] transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Return to Store</span>
        </Link>

        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-[#caa982]">
          <ShieldCheck size={14} />
          <span className="hidden sm:inline">Secure Studio Portal</span>
        </div>
      </header>

      {/* Main Login Card Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-115 bg-[#1c1815] border border-[#332b23] shadow-2xl p-7 sm:p-10 animate-fade-in">
          {/* Brand & Studio Title */}
          <div className="text-center mb-8">
            <h1 className="font-serif text-3xl sm:text-4xl text-[#f5ede3] tracking-[0.24em] font-normal">
              SIARAH
            </h1>
            <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.3em] text-[#caa982] font-medium mt-1">
              Admin Studio · Private Access
            </p>
            <p className="text-xs text-[#9c8e7e] font-light mt-3 leading-relaxed">
              Sign in with your administrator credentials to manage catalogue,
              products & inventory.
            </p>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="mb-5 p-3.5 bg-red-950/40 border border-red-800/50 text-red-200 text-xs flex items-start gap-2.5 leading-relaxed animate-fade-in">
              <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Alert */}
          {successMessage && (
            <div className="mb-5 p-3.5 bg-emerald-950/40 border border-emerald-800/50 text-emerald-200 text-xs flex items-start gap-2.5 leading-relaxed animate-fade-in">
              <CheckCircle2
                size={16}
                className="text-emerald-400 shrink-0 mt-0.5"
              />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Authentication Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs text-[#baa998] font-normal mb-1.5">
                Admin email *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#7d6f61]">
                  <Mail size={15} />
                </div>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="admin@siarah.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#151210] border border-[#382f25] text-[#ede5d8] placeholder:text-[#6a5e52] pl-9 pr-3.5 py-2.5 text-xs sm:text-sm focus:border-[#caa982] focus:bg-[#191512] outline-none transition-colors"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs text-[#baa998] font-normal mb-1.5">
                Password *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#7d6f61]">
                  <Lock size={15} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#151210] border border-[#382f25] text-[#ede5d8] placeholder:text-[#6a5e52] pl-9 pr-10 py-2.5 text-xs sm:text-sm focus:border-[#caa982] focus:bg-[#191512] outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#7d6f61] hover:text-[#ded5c8] cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Remember Me Option */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-[#9e8d7d]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 accent-[#caa982] rounded-xs cursor-pointer"
                />
                <span>Keep me signed in</span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#caa982] hover:bg-[#d8b894] disabled:opacity-60 text-[#1f1a16] font-medium text-xs sm:text-[13px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                {loading ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Studio</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-4 text-center text-[11px] text-[#6d6154] tracking-wider border-t border-[#251f19]">
        <span>
          © {new Date().getFullYear()} SIARAH Luxury Jewellery. Internal
          Management Portal.
        </span>
      </footer>
    </div>
  );
}
