import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router";
import type { Route } from "./+types/layout";
import supabase from "~/lib/supabase";

export interface AdminLayoutContext {
  user: any;
}

export default function AdminLayout({}: Route.ComponentProps) {
  const navigate = useNavigate();

  // Authentication State: null = checking, true = authenticated, false = unauthenticated
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    let mounted = true;

    async function checkAuthSession() {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error || !session?.user) {
          setIsAuthenticated(false);
          navigate("/admin/login", { replace: true });
          return;
        }

        setCurrentUser(session.user);
        setIsAuthenticated(true);
      } catch (err) {
        if (mounted) {
          setIsAuthenticated(false);
          navigate("/admin/login", { replace: true });
        }
      }
    }

    checkAuthSession();

    // Subscribe to auth state changes (e.g. sign out or session termination)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;

        if (!session?.user) {
          setIsAuthenticated(false);
          setCurrentUser(null);
          navigate("/admin/login", { replace: true });
        } else {
          setCurrentUser(session.user);
          setIsAuthenticated(true);
        }
      },
    );

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [navigate]);

  // While checking authentication or if unauthenticated, NEVER render children (<Outlet />)
  if (isAuthenticated === null || isAuthenticated === false) {
    return (
      <div className="min-h-screen bg-[#1c1815] text-[#ede5d8] flex flex-col items-center justify-center p-6 select-none">
        <div className="flex flex-col items-center gap-3 text-center animate-fade-in">
          <span className="font-serif text-2xl tracking-[0.28em] text-[#f5ede3] font-normal">
            SIARAH
          </span>
          <div className="flex items-center gap-2 text-xs text-[#caa982] uppercase tracking-[0.2em] font-light">
            <RefreshCw size={13} className="animate-spin" />
            <span>Verifying admin credentials...</span>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated: Render admin workspace
  return (
    <Outlet context={{ user: currentUser } satisfies AdminLayoutContext} />
  );
}
