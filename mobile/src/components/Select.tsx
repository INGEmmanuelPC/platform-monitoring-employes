import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
  type RegisterOptions,
} from "react-hook-form";
import { Pressable, Text, View } from "react-native";

import { DESIGN, RAISED_SURFACE } from "@/constants/design";

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
          className="gap-2 rounded-2xl border p-3"
          style={{
            backgroundColor: DESIGN.colors.inset,
            borderColor: DESIGN.colors.border,
            borderRadius: DESIGN.radius.card,
            borderWidth: 1,
            borderBottomWidth: 3,
            borderBottomColor: DESIGN.colors.borderSubtle,
            padding: 12,
            ...RAISED_SURFACE,
          }}
        >
          <Text style={{ color: DESIGN.colors.text, fontSize: 15, fontWeight: "700" }}>
            {label}
          </Text>
          <Text style={{ color: DESIGN.colors.textSecondary, fontSize: 12 }}>
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
                    className="w-full"
                    style={({ pressed }) => [
                      {
                        backgroundColor: selected ? "#E8F1F5" : DESIGN.colors.surface,
                        borderColor: selected ? DESIGN.colors.brand : DESIGN.colors.border,
                        borderWidth: 1,
                        borderBottomWidth: 3,
                        borderBottomColor: selected
                          ? DESIGN.colors.brandPressed
                          : DESIGN.colors.borderSubtle,
                        borderRadius: DESIGN.radius.control,
                        minHeight: 52,
                        paddingHorizontal: 12,
                        paddingVertical: 12,
                        width: "100%",
                        ...RAISED_SURFACE,
                      },
                      pressed ? { opacity: 0.86, elevation: 1 } : undefined,
                    ]}
                  >
                    <Text style={{ color: selected ? DESIGN.colors.brand : DESIGN.colors.text, fontSize: 15, fontWeight: "600" }}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
          {!!error && (
            <Text className="text-xs" style={{ color: DESIGN.colors.error }}>{error.message}</Text>
          )}
        </View>
      )}
    />
  );
}
