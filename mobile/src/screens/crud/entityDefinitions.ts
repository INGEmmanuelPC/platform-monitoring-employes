import type { RegisterOptions } from "react-hook-form";

import type { EntityName, EntityRecord } from "@/src/api/entities";

// FieldDef describe el campo (metadata para armar el formulario). No
// confundir con el componente `Field`, que es el que de verdad se
// dibuja: uno es dato, el otro es UI.
export type FieldDef = {
  key: string;
  label: string;
  required?: boolean;
  multiline?: boolean;
  maxLength?: number;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Mismas reglas que login/register: requerido + patrón de correo con el
// mismo mensaje. Si el campo no es obligatorio (email de un cliente), el
// patrón solo se exige cuando el usuario escribió algo.
export function fieldRules(field: FieldDef): RegisterOptions<Record<string, string>> {
  const rules: RegisterOptions<Record<string, string>> = {};
  if (field.required) {
    rules.required = `Ingresa ${field.label.toLowerCase()}.`;
  }
  if (field.key === "email") {
    if (field.required) {
      rules.pattern = { value: EMAIL_PATTERN, message: "Ingresa un correo válido." };
    } else {
      rules.validate = (value) =>
        !value || EMAIL_PATTERN.test(value) || "Ingresa un correo válido.";
    }
  }
  return rules;
}

export const definitions: Record<EntityName, { title: string; fields: FieldDef[]; summary: (item: EntityRecord) => string }> = {
  tecnicos: {
    title: "Técnicos",
    fields: [
      { key: "nombre", label: "Nombre", required: true, maxLength: 120 },
      { key: "telefono", label: "Teléfono", maxLength: 40 },
      { key: "especialidad", label: "Especialidad", maxLength: 120 },
    ],
    summary: (item) => String(item.nombre ?? item.full_name ?? "Sin nombre"),
  },
  clientes: {
    title: "Clientes",
    fields: [
      { key: "nombre", label: "Nombre", required: true, maxLength: 120 },
      { key: "email", label: "Correo", maxLength: 160 },
      { key: "telefono", label: "Teléfono", maxLength: 40 },
      { key: "direccion", label: "Dirección", maxLength: 240 },
    ],
    summary: (item) => String(item.nombre ?? "Sin nombre"),
  },
  ordenes: {
    title: "Órdenes de trabajo",
    fields: [
      { key: "cliente_id", label: "ID del cliente", required: true },
      { key: "descripcion", label: "Descripción", required: true, multiline: true, maxLength: 1000 },
      { key: "direccion", label: "Dirección", maxLength: 240 },
      { key: "observaciones", label: "Observaciones", multiline: true, maxLength: 2000 },
    ],
    summary: (item) => String(item.descripcion ?? "Sin descripción"),
  },
};

export const createPaths = {
  tecnicos: "/crud/tecnicos/nuevo",
  clientes: "/crud/clientes/nuevo",
  ordenes: "/crud/ordenes/nuevo",
} as const;

export function detailPath(entity: EntityName, id: string) {
  if (entity === "tecnicos") return { pathname: "/crud/tecnicos/[id]" as const, params: { id } };
  if (entity === "clientes") return { pathname: "/crud/clientes/[id]" as const, params: { id } };
  return { pathname: "/crud/ordenes/[id]" as const, params: { id } };
}
