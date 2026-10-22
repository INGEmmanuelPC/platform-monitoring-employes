import { createContext, useContext, useMemo, useState, type PropsWithChildren } from "react";
import { Modal, Pressable, Text, View } from "react-native";

import { MIN_TOUCH_TARGET } from "@/constants/design";

type AlertKind = "success" | "error" | "warning" | "info";
type AlertOptions = {
  title: string;
  message: string;
  kind?: AlertKind;
  confirmText?: string;
  onConfirm?: () => void;
};

type AlertContextValue = {
  showAlert: (options: AlertOptions) => void;
  closeAlert: () => void;
};

const AlertContext = createContext<AlertContextValue | undefined>(undefined);

const kindStyles: Record<AlertKind, { panel: string; title: string; button: string }> = {
  success: { panel: "border-emerald-200 bg-emerald-50", title: "text-emerald-950", button: "bg-emerald-700" },
  error: { panel: "border-red-200 bg-red-50", title: "text-red-950", button: "bg-red-700" },
  warning: { panel: "border-amber-200 bg-amber-50", title: "text-amber-950", button: "bg-amber-700" },
  info: { panel: "border-blue-200 bg-blue-50", title: "text-blue-950", button: "bg-blue-700" },
};

export function AppAlertProvider({ children }: PropsWithChildren) {
  const [alert, setAlert] = useState<AlertOptions | null>(null);
  const value = useMemo(
    () => ({ showAlert: setAlert, closeAlert: () => setAlert(null) }),
    [],
  );
  const kind = alert?.kind ?? "info";
  const styles = kindStyles[kind];

  return (
    <AlertContext.Provider value={value}>
      {children}
      <Modal visible={alert !== null} transparent animationType="fade" onRequestClose={() => setAlert(null)}>
        <View className="flex-1 items-center justify-center bg-black/50 p-6">
          <View
            accessibilityViewIsModal
            className={`w-full max-w-md gap-4 rounded-2xl border p-5 shadow-xl ${styles.panel}`}
          >
            <Text accessibilityRole="header" className={`text-xl font-bold ${styles.title}`}>
              {alert?.title}
            </Text>
            <Text className="text-base leading-6 text-neutral-800">{alert?.message}</Text>
            <Pressable
              accessibilityRole="button"
              className={`items-center justify-center rounded-xl px-4 active:opacity-80 ${styles.button}`}
              style={({ pressed }) => [
                { minHeight: MIN_TOUCH_TARGET },
                pressed ? { opacity: 0.8 } : undefined,
              ]}
              onPress={() => {
                const onConfirm = alert?.onConfirm;
                setAlert(null);
                onConfirm?.();
              }}
            >
              <Text className="font-semibold text-white">{alert?.confirmText ?? "Aceptar"}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </AlertContext.Provider>
  );
}

export function useAppAlert() {
  const context = useContext(AlertContext);
  if (!context) throw new Error("useAppAlert debe usarse dentro de AppAlertProvider");
  return context;
}
