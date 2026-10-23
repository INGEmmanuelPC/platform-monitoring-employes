import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
  type RegisterOptions,
} from "react-hook-form";
import { useState } from "react";
import {
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";

import { DESIGN, MIN_TOUCH_TARGET, RAISED_SURFACE } from "@/constants/design";

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
  style: inputStyle,
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
          <TextInput
            editable={editable}
            {...input}
            className={inputClassName}
            placeholder={placeholder}
            accessibilityLabel={label}
            placeholderTextColor={DESIGN.colors.textSecondary}
            onFocus={(event) => {
              setFocused(true);
              input.onFocus?.(event);
            }}
            onBlur={(event) => {
              setFocused(false);
              input.onBlur?.(event);
              onBlur();
            }}
            style={[
              inputStyle,
              {
                color: editable ? DESIGN.colors.text : DESIGN.colors.disabledText,
                backgroundColor: editable
                  ? focused
                    ? DESIGN.colors.selected
                    : DESIGN.colors.surface
                  : DESIGN.colors.disabled,
                borderColor: error
                  ? DESIGN.colors.error
                  : focused
                    ? DESIGN.colors.brand
                    : DESIGN.colors.border,
                borderWidth: 1,
                borderBottomWidth: 3,
                borderBottomColor: error ? DESIGN.colors.error : DESIGN.colors.border,
                borderRadius: DESIGN.radius.control,
                fontSize: 16,
                height: input.multiline ? 128 : MIN_TOUCH_TARGET + 8,
                minHeight: input.multiline ? 128 : MIN_TOUCH_TARGET + 4,
                paddingHorizontal: 12,
                paddingVertical: 12,
                width: "100%",
                textAlignVertical: input.multiline ? "top" : "center",
                ...(input.multiline ? { paddingTop: 14 } : {}),
              },
            ]}
            value={value}
            onChangeText={onChange}
            autoCapitalize="none"
          />
          {!!error && (
            <Text style={{ color: DESIGN.colors.error, fontSize: 12, fontWeight: "600" }}>
              {error.message}
            </Text>
          )}
        </View>
      )}
    />
  );
}
