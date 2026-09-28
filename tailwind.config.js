/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      // Nombres literales de constants/fonts.ts: React Native no sintetiza
      // pesos de una fuente custom, así que cada clase mapea a un peso ya
      // cargado con useFonts en app/_layout.tsx, no a una familia genérica.
      fontFamily: {
        display: ["Archivo_700Bold"],
        slogan: ["IBMPlexSans_400Regular"],
        button: ["IBMPlexSans_600SemiBold"],
      },
    },
  },
  plugins: [],
};
