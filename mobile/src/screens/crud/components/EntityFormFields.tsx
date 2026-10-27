import type { Control } from "react-hook-form";

import FieldInput from "@/components/Field";
import Select from "@/components/Select";
import type { EntityName, EntityRecord } from "@/src/api/entities";

import { fieldRules, type FieldDef } from "../entityDefinitions";

type Props = {
  entity: EntityName;
  fields: FieldDef[];
  control: Control<Record<string, string>>;
  clients: EntityRecord[];
  technicians: EntityRecord[];
};

export function EntityFormFields({ entity, fields, control, clients, technicians }: Props) {
  return fields.map((field) => {
    if (entity === "ordenes" && field.key === "cliente_id") {
      return (
        <Select
          key={field.key}
          control={control}
          name="cliente_id"
          label="Cliente"
          options={clients.map((client) => ({
            value: client.id,
            label: String(client.nombre ?? "Sin nombre"),
          }))}
          empty="Crea primero un cliente."
          rules={field.required ? { required: "Selecciona un cliente." } : undefined}
        />
      );
    }
    if (entity === "ordenes" && field.key === "tecnico_id") {
      return (
        <Select
          key={field.key}
          control={control}
          name="tecnico_id"
          label="Técnico"
          options={technicians.map((tech) => ({
            value: tech.id,
            label: String(tech.nombre ?? tech.full_name ?? "Sin nombre"),
          }))}
          empty="Crea primero un técnico."
          rules={field.required ? { required: "Selecciona un técnico." } : undefined}
        />
      );
    }
    return (
      <FieldInput
        key={field.key}
        control={control}
        name={field.key}
        label={field.label}
        placeholder={`Escribe ${field.label.toLowerCase()}`}
        multiline={field.multiline}
        numberOfLines={field.multiline ? 5 : undefined}
        textAlignVertical={field.multiline ? "top" : undefined}
        className={field.multiline ? "h-32" : undefined}
        maxLength={field.maxLength}
        autoCapitalize={field.key === "nombre" ? "words" : "none"}
        keyboardType={field.key === "email" ? "email-address" : "default"}
        autoComplete={field.key === "email" ? "email" : undefined}
        rules={fieldRules(field)}
      />
    );
  });
}
