import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
  type RegisterOptions,
} from "react-hook-form";
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
  ...input
}: Props<T>) {
  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({
        field: { onChange, onBlur, value },
        fieldState: { error },
      }) => (
        <View className="gap-1">
          <Text className="font-semibold">{label}</Text>
          <TextInput
            className={`rounded-lg border p-3 ${error ? "border-red-600" : "border-neutral-300"}`}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            autoCapitalize="none"
            {...input}
          />
          {!!error && (
            <Text className="text-xs text-red-600">{error.message}</Text>
          )}
        </View>
      )}
    />
  );
}
