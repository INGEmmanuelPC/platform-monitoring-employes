import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput } from "react-native";

import { Button } from "@/components/Button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { DESIGN, RAISED_SURFACE } from "@/constants/design";

import { useWorkNote } from "./hooks/useWorkNote";

export default function DictadoScreen() {
  const { error, note, saveNote, setNote } = useWorkNote();

  return (
    <KeyboardAvoidingView className="flex-1" style={{ backgroundColor: DESIGN.colors.canvas }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView
        contentContainerClassName="min-h-full items-center justify-center gap-6 p-6"
        keyboardShouldPersistTaps="handled"
      >
        <IconSymbol size={72} name="mic.fill" color={DESIGN.colors.brand} />
        <Text className="text-center text-lg" style={{ color: DESIGN.colors.text }}>Cuenta con tus palabras qué encontraste y qué hiciste.</Text>
        <TextInput className="min-h-28 w-full rounded-2xl border p-3" style={{ color: DESIGN.colors.text, backgroundColor: DESIGN.colors.surface, borderColor: DESIGN.colors.border, borderRadius: DESIGN.radius.card, borderBottomWidth: 3, borderBottomColor: DESIGN.colors.borderSubtle, ...RAISED_SURFACE }} placeholder="Escribe qué encontraste y qué hiciste" placeholderTextColor={DESIGN.colors.textSecondary} multiline value={note} onChangeText={setNote} />
        {error ? <Text className="text-sm" style={{ color: DESIGN.colors.error }}>{error}</Text> : null}
        <Button text="Guardar nota" onPress={() => void saveNote()} className="w-full" />
        <Text className="text-center text-xs" style={{ color: DESIGN.colors.textSecondary }}>El reporte lo redacta el sistema después. Nadie lo escribe a mano.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}