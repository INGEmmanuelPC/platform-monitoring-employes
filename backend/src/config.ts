import dotenv from "dotenv";

dotenv.config();
dotenv.config({ path: "../.env.local" });

const required = (name: string) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}.`);
  }
  return value;
};

export const config = {
  port: Number(process.env.PORT ?? 3000),
  supabaseUrl: process.env.SUPABASE_URL ?? required("EXPO_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey:
    process.env.SUPABASE_ANON_KEY ?? required("EXPO_PUBLIC_SUPABASE_ANON_KEY"),
  // Esta clave sólo existe en el proceso confiable del backend. Nunca debe
  // copiarse a Expo ni a una variable EXPO_PUBLIC_*.
  supabaseServiceRoleKey: required("SUPABASE_SERVICE_ROLE_KEY"),
  corsOrigin: process.env.CORS_ORIGIN ?? "*",
};
