import { useRouter } from "expo-router";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { getAuthErrorMessage, login } from "@/src/api/auth";

export type LoginForm = {
  email: string;
  password: string;
};

export function useLogin() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const { control, handleSubmit, formState: { isSubmitting } } = useForm<LoginForm>({
    defaultValues: { email: "", password: "" },
  });

  const submit = handleSubmit(async (values) => {
    setServerError(null);
    const { error } = await login(values.email, values.password);

    if (error) {
      setServerError(getAuthErrorMessage(error, "login"));
      return;
    }

    router.replace("/");
  });

  return { control, serverError, isSubmitting, submit };
}
