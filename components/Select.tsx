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
        <View className="gap-1.5">
          <Text className="font-semibold text-neutral-800">{label}</Text>
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
                    onPress={() => onChange(option.value)}
                    className={`rounded-lg border p-3 active:opacity-70 ${
                      selected
                        ? "border-blue-600 bg-blue-50"
                        : "border-neutral-300 bg-white"
                    }`}
                  >
                    <Text
                      className={`font-medium ${
                        selected ? "text-blue-700" : "text-neutral-700"
                      }`}
                    >
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
