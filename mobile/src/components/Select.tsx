import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
  type RegisterOptions,
} from "react-hook-form";
import { Pressable, Text, View } from "react-native";

type Option = { value: string; label: string };

type Props<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label: string;
  options: Option[];
  empty?: string;
  rules?: RegisterOptions<T, Path<T>>;
};

// Selección de una sola opción entre una lista corta (categoría, cliente...).
// Sigue el mismo contrato que Field: control + name + label + rules, y pinta
// el error debajo igual que un campo de texto.
export default function Select<T extends FieldValues>({
  control,
  name,
  label,
  options,
  empty,
  rules,
}: Props<T>) {
  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <View
          className="gap-2 rounded-2xl border border-slate-300 bg-slate-50 p-3"
          style={{
            backgroundColor: "#f8fafc",
            borderColor: "#cbd5e1",
            borderRadius: 16,
            borderWidth: 1,
            padding: 12,
          }}
        >
          <Text style={{ color: "#0f172a", fontSize: 15, fontWeight: "700" }}>
            {label}
          </Text>
          <Text style={{ color: "#475569", fontSize: 12 }}>
            Selecciona una opción
          </Text>
          {options.length === 0 ? (
            <Text className="rounded-lg bg-amber-50 p-3 text-amber-800">
              {empty ?? "No hay opciones disponibles."}
            </Text>
          ) : (
            <View className="gap-2">
              {options.map((option) => {
                const selected = value === option.value;
                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    onPress={() => onChange(option.value)}
                    className="active:opacity-70"
                    style={{
                      backgroundColor: selected ? "#eff6ff" : "#ffffff",
                      borderColor: selected ? "#1d4ed8" : "#64748b",
                      borderWidth: 2,
                      borderRadius: 12,
                      minHeight: 52,
                      paddingHorizontal: 12,
                      paddingVertical: 12,
                      width: "100%",
                    }}
                  >
                    <Text style={{ color: selected ? "#1d4ed8" : "#334155", fontSize: 15, fontWeight: "600" }}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
          {!!error && (
            <Text className="text-xs text-red-600">{error.message}</Text>
          )}
        </View>
      )}
    />
  );
}
