import { createContext, useContext, useMemo, useState, type PropsWithChildren } from "react";
import { Modal, Pressable, Text, View } from "react-native";

import { DESIGN, MIN_TOUCH_TARGET, RAISED_SURFACE } from "@/constants/design";

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

const kindStyles: Record<AlertKind, { panel: string; title: string; button: string; buttonBorder: string }> = {
  success: {
    panel: DESIGN.status.trabajo.COMPLETADO.background,
    title: DESIGN.status.trabajo.COMPLETADO.foreground,
    button: DESIGN.status.trabajo.COMPLETADO.foreground,
    buttonBorder: DESIGN.status.trabajo.COMPLETADO.foreground,
  },
  error: {
    panel: DESIGN.colors.errorSurface,
    title: DESIGN.colors.error,
    button: DESIGN.colors.error,
    buttonBorder: DESIGN.colors.dangerPressed,
  },
  warning: {
    panel: DESIGN.status.trabajo.EN_SITIO.background,
    title: DESIGN.status.trabajo.EN_SITIO.foreground,
    button: DESIGN.status.trabajo.EN_SITIO.foreground,
    buttonBorder: DESIGN.status.trabajo.EN_SITIO.foreground,
  },
  info: {
    panel: DESIGN.status.trabajo.EN_CAMINO.background,
    title: DESIGN.status.trabajo.EN_CAMINO.foreground,
    button: DESIGN.status.trabajo.EN_CAMINO.foreground,
    buttonBorder: DESIGN.status.trabajo.EN_CAMINO.foreground,
  },
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
        <View className="flex-1 items-center justify-center p-6" style={{ backgroundColor: DESIGN.colors.backdrop }}>
          <View
            accessibilityViewIsModal
            className="w-full max-w-md gap-4 rounded-2xl border p-5"
            style={{ backgroundColor: styles.panel, borderColor: DESIGN.colors.border, ...RAISED_SURFACE }}
          >
            <Text accessibilityRole="header" className="text-xl font-bold" style={{ color: styles.title }}>
              {alert?.title}
            </Text>
            <Text className="text-base leading-6" style={{ color: DESIGN.colors.text }}>{alert?.message}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={alert?.confirmText ?? "Aceptar"}
              className="items-center justify-center rounded-xl px-4"
              style={({ pressed }) => [
                { backgroundColor: styles.button, borderColor: styles.buttonBorder, borderBottomWidth: 3, borderRadius: DESIGN.radius.control, minHeight: MIN_TOUCH_TARGET, ...RAISED_SURFACE },
                pressed ? { opacity: 0.8 } : undefined,
              ]}
              onPress={() => {
                const onConfirm = alert?.onConfirm;
                setAlert(null);
                onConfirm?.();
              }}
            >
              <Text className="font-semibold" style={{ color: DESIGN.colors.surface }}>{alert?.confirmText ?? "Aceptar"}</Text>
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
