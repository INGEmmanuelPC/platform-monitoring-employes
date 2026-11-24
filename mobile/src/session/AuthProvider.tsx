import type { Session } from "@supabase/supabase-js";
import { useNetworkState } from "expo-network";
import { createContext, useContext, useEffect, useRef, useState, type PropsWithChildren } from "react";

import { logout } from "@/src/api/auth";
import { savePushToken } from "@/src/api/push";
import { supabase } from "@/src/api/client";
import { hayRed } from "@/src/domain/autoSync";

export type ProfileRole = "admin" | "tecnico";

type Profile = {
  id: string;
  role: ProfileRole;
  full_name: string | null;
};

type AuthContextValue = {
  session: Session | null;
  profile: Profile | null;
  profileError: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // Si el perfil no se pudo cargar (por ejemplo, la app se abrió sin señal), se
  // reintenta cuando vuelve la red: sin el rol no se puede sincronizar.
  const [intentoPerfil, setIntentoPerfil] = useState(0);
  const conRed = hayRed(useNetworkState());
  const perfilFallo = useRef(false);

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
      setProfileError(null);
      return;
    }
    setProfile(null);
    setProfileError(null);
    supabase
      .from("profiles")
      .select("id, role, full_name")
      .eq("id", userId)
      .single()
      .then(({ data, error }) => {
        if (!active) return;
        if (error || !data) {
          setProfileError("No se pudo verificar el rol de esta cuenta.");
          return;
        }
        setProfile(data as Profile);
      }, () => {
        if (active) setProfileError("No se pudo verificar el rol de esta cuenta.");
      });
    return () => {
      active = false;
    };
  }, [session?.user.id, intentoPerfil]);

  useEffect(() => {
    perfilFallo.current = profileError !== null;
  }, [profileError]);

  useEffect(() => {
    if (conRed && perfilFallo.current) setIntentoPerfil((n) => n + 1);
  }, [conRed]);

  const signOut = async () => {
    // Antes de cerrar sesión: después ya no hay token de sesión para avisar al
    // servidor. Sin red se cierra igual (regla 1).
    await savePushToken(null).catch(() => undefined);
    await logout();
  };

  return (
    <AuthContext.Provider value={{ session, profile, profileError, loading, signOut }}>
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
