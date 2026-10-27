import type { Session } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState, type PropsWithChildren } from "react";

import { logout } from "@/src/api/auth";
import { supabase } from "@/src/api/client";

export type ProfileRole = "admin" | "tecnico";

type Profile = {
  id: string;
  role: ProfileRole;
  full_name: string | null;
};

type AuthContextValue = {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (mounted) {
          setSession(data.session);
        }
      })
      .catch(() => {
        if (mounted) {
          setSession(null);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (mounted) {
          setSession(nextSession);
          setLoading(false);
        }
      },
    );

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  // El rol vive en public.profiles; la RLS "profiles_select_own_or_admin" deja
  // que cada usuario lea su propia fila. Lo cargamos acá para que la UI pueda
  // mostrar "Administrador" o "Técnico" sin que cada pantalla consulte Supabase.
  useEffect(() => {
    let active = true;
    const userId = session?.user.id;
    if (!userId) {
      setProfile(null);
      return;
    }
    supabase
      .from("profiles")
      .select("id, role, full_name")
      .eq("id", userId)
      .single()
      .then(({ data }) => {
        if (active && data) setProfile(data as Profile);
      });
    return () => {
      active = false;
    };
  }, [session?.user.id]);

  const signOut = async () => {
    await logout();
  };

  return (
    <AuthContext.Provider value={{ session, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }

  return context;
}
