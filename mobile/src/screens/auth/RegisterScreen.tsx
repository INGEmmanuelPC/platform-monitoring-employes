import { useRouter } from "expo-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { ActivityIndicator, Text, View } from "react-native";

import { Button } from "@/components/Button";
import Field from "@/components/Field";
import { getAuthErrorMessage, register } from "@/src/api/auth";

import { AuthFormLayout } from "./components/AuthFormLayout";
import { AuthSwitchLink } from "./components/AuthSwitchLink";

type RegisterForm = {
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
};

export default function RegisterScreen() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const { control, handleSubmit, watch, formState: { isSubmitting } } = useForm<RegisterForm>({
    defaultValues: { name: "", email: "", password: "", passwordConfirmation: "" },
  });
  const password = watch("password");

  const onSubmit = async (values: RegisterForm) => {
    setServerError(null);
    const { data, error } = await register(values);

    if (error) {
      setServerError(getAuthErrorMessage(error, "register"));
      return;
    }

    router.replace(data.session ? "/" : "/login");
  };

  return (
    <AuthFormLayout title="Crear cuenta" subtitle="Regístrate para usar la aplicación.">
      <View className="gap-4">
        <Field control={control} name="name" label="Nombre" placeholder="Tu nombre" autoCapitalize="words" maxLength={120} rules={{ required: "Ingresa tu nombre." }} />
        <Field control={control} name="email" label="Correo electrónico" placeholder="tu@correo.com" keyboardType="email-address" autoComplete="email" maxLength={160} rules={{ required: "Ingresa tu correo electrónico.", pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Ingresa un correo válido." } }} />
        <Field control={control} name="password" label="Contraseña" placeholder="Mínimo 6 caracteres" secureTextEntry autoComplete="new-password" maxLength={128} rules={{ required: "Ingresa una contraseña.", minLength: { value: 6, message: "Usa al menos 6 caracteres." } }} />
        <Field control={control} name="passwordConfirmation" label="Confirmar contraseña" placeholder="Repite tu contraseña" secureTextEntry autoComplete="new-password" maxLength={128} rules={{ required: "Confirma tu contraseña.", validate: (value) => value === password || "Las contraseñas no coinciden." }} />
      </View>
      {serverError ? <Text className="text-sm text-red-600">{serverError}</Text> : null}
      <Button text={isSubmitting ? "Creando cuenta..." : "Crear cuenta"} onPress={handleSubmit(onSubmit)} disabled={isSubmitting} />
      {isSubmitting ? <ActivityIndicator color="#0a7ea4" /> : null}
      <AuthSwitchLink prompt="¿Ya tienes una cuenta?" linkText="Inicia sesión" href="/login" />
    </AuthFormLayout>
  );
}
