// Textos de la cancelación de un trabajo (administrador). Nada de texto en componentes.
export const TEXTOS_CANCELACION = {
  abrir: "Cancelar trabajo",
  titulo: "Cancelar este trabajo",
  campo: "Motivo de la cancelación",
  placeholder: "Por ejemplo: el cliente no estaba en el sitio.",
  ayuda: "El motivo es obligatorio. El técnico lo verá en su aviso y el trabajo ya no se podrá retomar.",
  confirmar: "Confirmar cancelación",
  cancelando: "Cancelando…",
  volver: "Volver",
  motivoVacio: "Escribe el motivo de la cancelación.",
  motivoLargo: "El motivo no puede pasar de 1000 caracteres.",
  requiereConexion: "Cancelar requiere conexión: se guarda directamente en el servidor.",
  error: "No se pudo cancelar el trabajo.",
} as const;
