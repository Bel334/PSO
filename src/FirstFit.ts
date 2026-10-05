import type { IBloqueMemoria } from "./IBloqueMemoria.js";
import type { IPoliticaAsignacion } from "./IPoliticaAsignacion.js";

export class FirstFit implements IPoliticaAsignacion {
    seleccionar(
        bloques: readonly IBloqueMemoria[],
        tamano: number
    ): number {
        return bloques.findIndex(
            bloque => bloque.estaLibre() &&
                bloque.obtenerTamano() >= tamano
        );
    }
}