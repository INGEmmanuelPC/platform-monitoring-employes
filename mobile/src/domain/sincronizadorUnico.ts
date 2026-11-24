// Candado único de sincronización. Código puro y genérico para poder probarlo.
//
// La cola se puede disparar desde varios sitios a la vez (al enfocar una lista,
// el botón manual, volver la red, volver a primer plano). Sin un candado, dos
// ejecuciones simultáneas enviarían la misma cola dos veces. Aquí, si ya hay una
// en curso para la misma cuenta, el segundo llamador espera ESA misma ejecución
// y recibe su resultado; si es otra cuenta, espera su turno.

type Ejecutar<D, R extends string> = (database: D, actorId: string, role: R) => Promise<number>;

export function crearSincronizadorUnico<D, R extends string>(ejecutar: Ejecutar<D, R>) {
  let actual: { clave: string; promesa: Promise<number> } | null = null;
  const oyentes = new Set<() => void>();

  async function sincronizar(database: D, actorId: string, role: R): Promise<number> {
    const clave = `${actorId}:${role}`;
    while (actual) {
      if (actual.clave === clave) return actual.promesa;
      await actual.promesa.catch(() => undefined);
    }
    const promesa: Promise<number> = ejecutar(database, actorId, role).finally(() => {
      if (actual?.promesa === promesa) actual = null;
    });
    actual = { clave, promesa };
    return promesa;
  }

  return {
    sincronizar,
    enCurso: () => actual !== null,
    // Avisa a las pantallas que la sincronización automática cambió datos.
    suscribir(oyente: () => void) {
      oyentes.add(oyente);
      return () => {
        oyentes.delete(oyente);
      };
    },
    notificar() {
      for (const oyente of [...oyentes]) oyente();
    },
  };
}
