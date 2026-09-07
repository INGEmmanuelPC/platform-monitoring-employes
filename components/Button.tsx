import { Pressable, Text } from "react-native";

interface ButtonProps {
  text: string;
  className?: string;
  onPress: () => void;
  disabled?: boolean;
}

export function Button({ text, className, onPress, disabled }: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`items-center rounded-lg bg-blue-600 p-3 active:opacity-80 disabled:opacity-50 ${className ?? ""}`}
    >
      <Text className="font-semibold text-white">{text}</Text>
    </Pressable>
  );
}

export default Button;
