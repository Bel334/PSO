import type { IProceso } from "./IProceso.js";

export interface ResultadoTickCpu {
    readonly pidEjecutado: number | null;
    readonly pidTerminado: number | null;
    readonly cambioContexto: boolean;
}

export interface IPlanificador {
    encolar(proceso: IProceso): void;
    ejecutarTick(): ResultadoTickCpu;
    obtenerPidEnCpu(): number | null;
    obtenerListos(): readonly number[];
}