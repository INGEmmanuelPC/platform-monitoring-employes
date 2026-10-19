import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
  type RegisterOptions,
} from "react-hook-form";
import { useState } from "react";
import { Text, TextInput, View, type TextInputProps } from "react-native";

type Props<T extends FieldValues> = TextInputProps & {
  control: Control<T>;
  name: Path<T>;
  label: string;
  rules?: RegisterOptions<T, Path<T>>;
};

export default function Field<T extends FieldValues>({
  control,
  name,
  label,
  rules,
  className: inputClassName,
  editable = true,
  ...input
}: Props<T>) {
  const [focused, setFocused] = useState(false);
  const placeholder = input.placeholder ?? `Escribe ${label.toLowerCase()}`;

  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({
        field: { onChange, onBlur, value },
        fieldState: { error },
      }) => (
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
          <TextInput
            editable={editable}
            {...input}
            placeholder={placeholder}
            placeholderTextColor="#475569"
            onFocus={(event) => {
              setFocused(true);
              input.onFocus?.(event);
            }}
            onBlur={(event) => {
              setFocused(false);
              input.onBlur?.(event);
              onBlur();
            }}
            style={{
              color: editable ? "#111827" : "#6b7280",
              backgroundColor: editable ? (focused ? "#eff6ff" : "#ffffff") : "#f3f4f6",
              borderColor: error ? "#dc2626" : focused ? "#1d4ed8" : "#64748b",
              borderWidth: 2,
              borderRadius: 12,
              fontSize: 16,
              height: input.multiline ? 128 : 56,
              minHeight: input.multiline ? 128 : 52,
              paddingHorizontal: 12,
              paddingVertical: 12,
              width: "100%",
              textAlignVertical: input.multiline ? "top" : "center",
              ...(input.multiline ? { paddingTop: 14 } : {}),
            }}
            value={value}
            onChangeText={onChange}
            autoCapitalize="none"
          />
          {!!error && (
            <Text style={{ color: "#b91c1c", fontSize: 12, fontWeight: "600" }}>
              {error.message}
            </Text>
          )}
        </View>
      )}
    />
  );
}
