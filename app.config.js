const appJson = require("./app.json");

module.exports = {
  ...appJson,
  expo: {
    ...appJson.expo,
    plugins: [...(appJson.expo.plugins ?? []), "expo-sqlite"],
    extra: {
      ...appJson.expo.extra,
      supabaseUrl:
        process.env.EXPO_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey:
        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    },
  },
};
