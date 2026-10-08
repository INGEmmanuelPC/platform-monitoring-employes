import { useRouter } from "expo-router";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { getAuthErrorMessage, register } from "@/src/api/auth";

export type RegisterForm = {
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
};

export function useRegister() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    watch,
    formState: { isSubmitting },
  } = useForm<RegisterForm>({
    defaultValues: { name: "", email: "", password: "", passwordConfirmation: "" },
  });
  const password = watch("password");

  const submit = handleSubmit(async (values) => {
    setServerError(null);
    const { data, error } = await register(values);

    if (error) {
      setServerError(getAuthErrorMessage(error, "register"));
      return;
    }

    router.replace(data.session ? "/" : "/login");
  });

  return { control, isSubmitting, password, serverError, submit };
}
