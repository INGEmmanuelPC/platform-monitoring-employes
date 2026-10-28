import 'dotenv/config';

module.exports = ({ config }) => ({
 ...config,
 android: {
   ...(config.android ?? {}),
   package: "com.icxrvajals.platformmonitoringemployes",
 },
 plugins: [...(config.plugins ?? []), "expo-sqlite"],
 extra: {
   ...(config.extra ?? {}),
   apiUrl: process.env.EXPO_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_API_URL,
   supabaseUrl:
     process.env.EXPO_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
   supabaseAnonKey:
     process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
     process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
     process.env.NEXT_PUBLIC_PUBLISHABLE_KEY,
 },
});
