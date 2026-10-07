import { useRouter } from "expo-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { ActivityIndicator, Text, View } from "react-native";

import { Button } from "@/components/Button";
import Field from "@/components/Field";
import { getAuthErrorMessage, login } from "@/src/api/auth";

import { AuthFormLayout } from "./components/AuthFormLayout";
import { AuthSwitchLink } from "./components/AuthSwitchLink";

type LoginForm = {
  email: string;
  password: string;
};

export default function LoginScreen() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const { control, handleSubmit, formState: { isSubmitting } } = useForm<LoginForm>({
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginForm) => {
    setServerError(null);
    const { error } = await login(values.email, values.password);

    if (error) {
      setServerError(getAuthErrorMessage(error, "login"));
      return;
    }

    router.replace("/");
  };

  return (
    <AuthFormLayout title="Iniciar sesión" subtitle="Accede a tus trabajos del día.">
      <View className="gap-4">
        <Field control={control} name="email" label="Correo electrónico" placeholder="tu@correo.com" keyboardType="email-address" autoComplete="email" maxLength={160} rules={{ required: "Ingresa tu correo electrónico.", pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Ingresa un correo válido." } }} />
        <Field control={control} name="password" label="Contraseña" placeholder="Tu contraseña" secureTextEntry autoComplete="password" maxLength={128} rules={{ required: "Ingresa tu contraseña." }} />
      </View>
      {serverError ? <Text className="text-sm text-red-600">{serverError}</Text> : null}
      <Button text={isSubmitting ? "Ingresando..." : "Iniciar sesión"} onPress={handleSubmit(onSubmit)} disabled={isSubmitting} />
      {isSubmitting ? <ActivityIndicator color="#0a7ea4" /> : null}
      <AuthSwitchLink prompt="¿No tienes una cuenta?" linkText="Regístrate" href="/register" />
    </AuthFormLayout>
  );
}
