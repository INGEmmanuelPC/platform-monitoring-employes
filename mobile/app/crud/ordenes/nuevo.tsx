import { EntityFormScreen } from "@/src/screens/crud/EntityFormScreen";

export default function NuevaOrdenScreen() {
  return <EntityFormScreen entity="ordenes" edit={false} />;
}
