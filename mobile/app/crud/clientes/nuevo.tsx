import { EntityFormScreen } from "@/src/screens/crud/EntityFormScreen";

export default function NuevoClienteScreen() {
  return <EntityFormScreen entity="clientes" edit={false} />;
}
