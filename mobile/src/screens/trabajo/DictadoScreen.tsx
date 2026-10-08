import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput } from "react-native";

import { Button } from "@/components/Button";
import { IconSymbol } from "@/components/ui/icon-symbol";

import { useWorkNote } from "./hooks/useWorkNote";

export default function DictadoScreen() {
  const { error, note, saveNote, setNote } = useWorkNote();

  return (
    <KeyboardAvoidingView className="flex-1 bg-neutral-50" behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView
        contentContainerClassName="min-h-full items-center justify-center gap-6 p-6"
        keyboardShouldPersistTaps="handled"
      >
        <IconSymbol size={72} name="mic.fill" color="#1B4965" />
        <Text className="text-center text-lg text-neutral-700">Cuenta con tus palabras qué encontraste y qué hiciste.</Text>
        <TextInput className="min-h-28 w-full rounded-lg border border-neutral-300 bg-white p-3" placeholder="Escribe qué encontraste y qué hiciste" multiline value={note} onChangeText={setNote} />
        {error ? <Text className="text-sm text-red-600">{error}</Text> : null}
        <Button text="Guardar nota" onPress={() => void saveNote()} className="w-full" />
        <Text className="text-center text-xs text-neutral-400">El reporte lo redacta el sistema después. Nadie lo escribe a mano.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}