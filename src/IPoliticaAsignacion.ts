import type { IBloqueMemoria } from "./IBloqueMemoria.js";

export interface IPoliticaAsignacion {
    seleccionar(
        bloques: readonly IBloqueMemoria[],
        tamano: number
    ): number;
}