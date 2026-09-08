import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";

import { Button } from "@/components/Button";
import Field from "@/components/Field";
import { getAuthErrorMessage, register } from "@/src/api/auth";

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

    if (data.session) {
      router.replace("/");
      return;
    }

    router.replace("/login");
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-neutral-50"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerClassName="flex-grow justify-center p-6">
        <View className="gap-6 rounded-xl border border-neutral-200 bg-white p-5">
          <View className="gap-1">
            <Text className="text-3xl font-bold text-neutral-900">Crear cuenta</Text>
            <Text className="text-sm text-neutral-600">Regístrate para usar la aplicación.</Text>
          </View>

          <View className="gap-4">
            <Field
              control={control}
              name="name"
              label="Nombre"
              placeholder="Tu nombre"
              autoCapitalize="words"
              rules={{ required: "Ingresa tu nombre." }}
            />
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
              placeholder="Mínimo 6 caracteres"
              secureTextEntry
              autoComplete="new-password"
              rules={{
                required: "Ingresa una contraseña.",
                minLength: { value: 6, message: "Usa al menos 6 caracteres." },
              }}
            />
            <Field
              control={control}
              name="passwordConfirmation"
              label="Confirmar contraseña"
              placeholder="Repite tu contraseña"
              secureTextEntry
              autoComplete="new-password"
              rules={{
                required: "Confirma tu contraseña.",
                validate: (value) => value === password || "Las contraseñas no coinciden.",
              }}
            />
          </View>

          {serverError ? <Text className="text-sm text-red-600">{serverError}</Text> : null}

          <Button
            text={isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
          />
          {isSubmitting ? <ActivityIndicator color="#0a7ea4" /> : null}

          <View className="flex-row justify-center gap-1">
            <Text className="text-sm text-neutral-600">¿Ya tienes una cuenta?</Text>
            <Link href="/login" className="text-sm font-semibold text-blue-700">
              Inicia sesión
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
