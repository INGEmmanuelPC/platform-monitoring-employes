import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
  type RegisterOptions,
} from "react-hook-form";
import { Pressable, Text, View } from "react-native";

import { DESIGN, MIN_TOUCH_TARGET, RAISED_SURFACE } from "@/constants/design";

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
            {value ? "Opción elegida (toca otra para cambiarla)" : "Toca una opción para elegirla"}
          </Text>
          {options.length === 0 ? (
            <Text className="rounded-lg p-3" style={{ backgroundColor: DESIGN.status.trabajo.EN_SITIO.background, color: DESIGN.status.trabajo.EN_SITIO.foreground }}>
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
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                        backgroundColor: selected ? DESIGN.colors.selected : DESIGN.colors.surface,
                        borderColor: selected ? DESIGN.colors.brand : DESIGN.colors.border,
                        borderWidth: selected ? 2 : 1,
                        borderBottomWidth: selected ? 4 : 3,
                        borderBottomColor: selected
                          ? DESIGN.colors.brandPressed
                          : DESIGN.colors.borderSubtle,
                        borderRadius: DESIGN.radius.control,
                        minHeight: MIN_TOUCH_TARGET + 4,
                        paddingHorizontal: 12,
                        paddingVertical: 12,
                        width: "100%",
                        ...RAISED_SURFACE,
                      },
                      pressed ? { opacity: 0.86, elevation: 1 } : undefined,
                    ]}
                  >
                    {/* Indicador tipo radio: anillo exterior + punto interior
                        cuando está seleccionado, para que la selección sea
                        inmediata al ojo aunque solo el color de fondo cambie. */}
                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        borderWidth: 2,
                        borderColor: selected ? DESIGN.colors.brand : DESIGN.colors.border,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: DESIGN.colors.surface,
                      }}
                    >
                      {selected ? (
                        <View
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: 6,
                            backgroundColor: DESIGN.colors.brand,
                          }}
                        />
                      ) : null}
                    </View>
                    <Text
                      style={{
                        flex: 1,
                        color: selected ? DESIGN.colors.brand : DESIGN.colors.text,
                        fontSize: 15,
                        fontWeight: selected ? "700" : "600",
                      }}
                    >
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
