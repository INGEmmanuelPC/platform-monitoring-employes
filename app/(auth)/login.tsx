import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";

import { Button } from "@/components/Button";
import Field from "@/components/Field";
import { getAuthErrorMessage, login } from "@/src/api/auth";

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
    <KeyboardAvoidingView
      className="flex-1 bg-neutral-50"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerClassName="flex-grow justify-center p-6">
        <View className="gap-6 rounded-xl border border-neutral-200 bg-white p-5">
          <View className="gap-1">
            <Text className="text-3xl font-bold text-neutral-900">Iniciar sesión</Text>
            <Text className="text-sm text-neutral-600">Accede a tus trabajos del día.</Text>
          </View>

          <View className="gap-4">
            <Field
              control={control}
              name="email"
              label="Correo electrónico"
              placeholder="tu@correo.com"
              keyboardType="email-address"
              autoComplete="email"
              rules={{
                required: "Ingresa tu correo electrónico.",
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Ingresa un correo válido." },
              }}
            />
            <Field
              control={control}
              name="password"
              label="Contraseña"
              placeholder="Tu contraseña"
              secureTextEntry
              autoComplete="password"
              rules={{ required: "Ingresa tu contraseña." }}
            />
          </View>

          {serverError ? <Text className="text-sm text-red-600">{serverError}</Text> : null}

          <Button
            text={isSubmitting ? "Ingresando..." : "Iniciar sesión"}
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
          />
          {isSubmitting ? <ActivityIndicator color="#0a7ea4" /> : null}

          <View className="flex-row justify-center gap-1">
            <Text className="text-sm text-neutral-600">¿No tienes una cuenta?</Text>
            <Link href="/register" className="text-sm font-semibold text-blue-700">
              Regístrate
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
