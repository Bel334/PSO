import type { EstadoProceso } from "./EstadoProceso.js";
export interface IProceso {
    obtenerPid(): number;
    obtenerMemoriaRequerida(): number;
    obtenerCpuTotal(): number;
    obtenerCpuRestante(): number;
    obtenerEstado(): EstadoProceso;
    obtenerQuantumConsumido(): number;
    obtenerBloqueoRestante(): number;
    esperarMemoria(): void;
    admitir(): void;
    despachar(): void;
    ejecutarTick(): void;
    reencolar(): void;
    renovarQuantum(): void;
    configurarES(despuesDeCpu: number, duracion: number): void;
    actualizarBloqueo(): void;
}