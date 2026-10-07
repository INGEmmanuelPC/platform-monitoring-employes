import { ActivityIndicator, Text, View } from "react-native";

import { Button } from "@/components/Button";
import Field from "@/components/Field";

import { AuthFormLayout } from "./components/AuthFormLayout";
import { AuthSwitchLink } from "./components/AuthSwitchLink";
import { useLogin } from "./hooks/useLogin";

export default function LoginScreen() {
  const { control, serverError, isSubmitting, submit } = useLogin();

  return (
    <AuthFormLayout title="Iniciar sesión" subtitle="Accede a tus trabajos del día.">
      <View className="gap-4">
        <Field control={control} name="email" label="Correo electrónico" placeholder="tu@correo.com" keyboardType="email-address" autoComplete="email" maxLength={160} rules={{ required: "Ingresa tu correo electrónico.", pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Ingresa un correo válido." } }} />
        <Field control={control} name="password" label="Contraseña" placeholder="Tu contraseña" secureTextEntry autoComplete="password" maxLength={128} rules={{ required: "Ingresa tu contraseña." }} />
      </View>
      {serverError ? <Text className="text-sm text-red-600">{serverError}</Text> : null}
      <Button text={isSubmitting ? "Ingresando..." : "Iniciar sesión"} onPress={submit} disabled={isSubmitting} />
      {isSubmitting ? <ActivityIndicator color="#0a7ea4" /> : null}
      <AuthSwitchLink prompt="¿No tienes una cuenta?" linkText="Regístrate" href="/register" />
    </AuthFormLayout>
  );
}
