import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { ErrorBanner } from "@/components/ErrorBanner";
import { DESIGN, RAISED_SURFACE } from "@/constants/design";
import { TEXTOS_REVISION as T } from "@/constants/revision";
import { ETIQUETA_REPORTE, ETIQUETA_TRABAJO, type EstadoReporte, type EstadoTrabajo } from "@/constants/trabajos";
import { useAuth } from "@/src/session/AuthProvider";

import { useWorkReview } from "./hooks/useWorkReview";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View
      className="gap-2 rounded-2xl border p-4"
      style={{ backgroundColor: DESIGN.colors.surface, borderColor: DESIGN.colors.border, borderBottomWidth: 3, borderRadius: DESIGN.radius.card, ...RAISED_SURFACE }}
    >
      <Text accessibilityRole="header" className="text-base font-semibold" style={{ color: DESIGN.colors.text }}>{title}</Text>
      {children}
    </View>
  );
}

const Linea = ({ children }: { children: string }) => (
  <Text className="text-sm" style={{ color: DESIGN.colors.textSecondary }}>{children}</Text>
);

export default function RevisionScreen() {
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();
  const r = useWorkReview();

  if (profile?.role !== "admin") {
    return (
      <View className="flex-1 items-center justify-center p-6" style={{ backgroundColor: DESIGN.colors.canvas }}>
        <Text className="text-center text-base" style={{ color: DESIGN.colors.textSecondary }}>{T.soloAdmin}</Text>
      </View>
    );
  }
  if (r.loading && !r.revision) {
    return (
      <View className="flex-1 items-center justify-center gap-3 p-6" style={{ backgroundColor: DESIGN.colors.canvas }}>
        <ActivityIndicator color={DESIGN.colors.brand} />
        <Text className="text-sm" style={{ color: DESIGN.colors.textSecondary }}>{T.cargando}</Text>
      </View>
    );
  }
  if (r.loadError || !r.revision || !r.vista) {
    return (
      <View className="flex-1 justify-center p-4" style={{ backgroundColor: DESIGN.colors.canvas }}>
        <ErrorBanner message={T.error} onRetry={() => void r.load()} />
      </View>
    );
  }

  const { trabajo, notas, tiene_firma, fotos_antes, fotos_despues } = r.revision;
  const editable = r.vista === "redactar" || r.vista === "editar_y_aprobar";
  const busy = r.working !== null;

  return (
    <KeyboardAvoidingView className="flex-1" style={{ backgroundColor: DESIGN.colors.canvas }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24, gap: 16 }}
      >
        <Card title={T.secciones.resumen}>
          <Text className="text-base font-semibold" style={{ color: DESIGN.colors.text }}>{trabajo.cliente}</Text>
          {trabajo.direccion ? <Linea>{trabajo.direccion}</Linea> : null}
          <Linea>{`${ETIQUETA_TRABAJO[trabajo.estado as EstadoTrabajo] ?? trabajo.estado} · Reporte: ${ETIQUETA_REPORTE[trabajo.reporte as EstadoReporte] ?? trabajo.reporte}`}</Linea>
        </Card>

        <Card title={T.secciones.evidencia}>
          <Text className="text-sm font-semibold" style={{ color: DESIGN.colors.text }}>{T.evidencia.notas}</Text>
          {notas.length === 0 ? <Linea>{T.evidencia.sinNotas}</Linea> : notas.map((nota, i) => (
            <Text key={i} className="text-sm" style={{ color: DESIGN.colors.textSecondary }}>{`· ${nota}`}</Text>
          ))}
          <Linea>{tiene_firma ? T.evidencia.firmaSi : T.evidencia.firmaNo}</Linea>
          <Linea>{T.evidencia.fotos(fotos_antes, fotos_despues)}</Linea>
        </Card>

        <Card title={T.secciones.reporte}>
          <Text className="text-sm" style={{ color: DESIGN.colors.textSecondary }}>{T.vistas[r.vista]}</Text>
          {r.vista !== "cancelado" && r.vista !== "esperando_trabajo" && r.vista !== "sin_nota" ? (
            <>
              <Text className="text-sm font-semibold" style={{ color: DESIGN.colors.text }}>{T.campo.etiqueta}</Text>
              <TextInput
                accessibilityLabel={T.campo.etiqueta}
                className="min-h-40 rounded-2xl border p-3"
                style={{ color: DESIGN.colors.text, backgroundColor: editable ? DESIGN.colors.inset : DESIGN.colors.disabled, borderColor: DESIGN.colors.border, borderRadius: DESIGN.radius.card, textAlignVertical: "top" }}
                placeholder={T.campo.placeholder}
                placeholderTextColor={DESIGN.colors.textSecondary}
                multiline
                editable={editable && !busy}
                value={r.texto}
                onChangeText={r.setTexto}
              />
              <Text className="text-xs" style={{ color: DESIGN.colors.textSecondary }}>{T.campo.ayuda}</Text>
            </>
          ) : null}
          {trabajo.reporte_aprobado_at ? (
            <Linea>{T.aprobadoPor(new Date(trabajo.reporte_aprobado_at).toLocaleString("es-CO"))}</Linea>
          ) : null}
        </Card>

        {r.actionError ? <ErrorBanner message={r.actionError} /> : null}

        {editable ? (
          <View className="gap-3">
            <Button
              text={r.working === "borrador" ? T.acciones.guardando : T.acciones.guardarBorrador}
              variant={r.vista === "redactar" ? "primary" : "secondary"}
              onPress={() => void r.guardarBorrador()}
              disabled={busy || !r.texto.trim()}
              loading={r.working === "borrador"}
            />
            {r.vista === "editar_y_aprobar" ? (
              <Button
                text={r.working === "aprobar" ? T.acciones.aprobando : T.acciones.aprobar}
                onPress={() => void r.aprobar()}
                disabled={busy || !r.texto.trim()}
                loading={r.working === "aprobar"}
              />
            ) : null}
          </View>
        ) : null}

        {r.vista === "cerrar" ? (
          r.confirmingClose ? (
            <View className="gap-3">
              <Text className="text-sm" style={{ color: DESIGN.colors.text }}>{T.acciones.avisoCierre}</Text>
              <Button
                text={r.working === "cerrar" ? T.acciones.cerrando : T.acciones.confirmarCerrar}
                onPress={() => void r.cerrar()}
                disabled={busy}
                loading={r.working === "cerrar"}
              />
              <Button text={T.acciones.cancelarCierre} variant="secondary" onPress={() => r.setConfirmingClose(false)} disabled={busy} />
            </View>
          ) : (
            <Button text={T.acciones.cerrar} onPress={() => r.setConfirmingClose(true)} disabled={busy} />
          )
        ) : null}

        <Text className="text-center text-xs" style={{ color: DESIGN.colors.textSecondary }}>{T.requiereConexion}</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
