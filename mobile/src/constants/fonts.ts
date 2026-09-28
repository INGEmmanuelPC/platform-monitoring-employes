// Tipografía de marca. Dos familias, tres pesos: ni una más.
//
// Archivo (bold) para lo que representa a Cuadrilla como marca: el nombre y
// los títulos de pantalla/menú. Geométrica y segura, para que se reconozca
// de un vistazo aunque el técnico la vea de pie y de reojo.
//
// IBM Plex Sans para el eslogan y los botones: es una tipografía diseñada
// para documentación técnica, pensada para leerse rápido y sin ambigüedad.
// Encaja con lo que Cuadrilla promete: que el técnico se comunique con su
// jefe sin importar la conectividad, no que se vea bonito nada más.
//
// Los nombres de la derecha son literales: React Native no sintetiza pesos
// de una fuente custom (no hay "bold" automático), así que cada peso que se
// use en la app tiene que cargarse y nombrarse por separado con useFonts.
export const Fonts = {
  /** Nombre de marca "Cuadrilla" y títulos de pantalla/menú. */
  display: "Archivo_700Bold",
  /** Eslogan y texto de apoyo bajo el nombre de marca. */
  slogan: "IBMPlexSans_400Regular",
  /** Texto de botones. */
  button: "IBMPlexSans_600SemiBold",
} as const;
