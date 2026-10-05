import type { EstadoProceso } from "./EstadoProceso.js";
export interface IProceso {
    obtenerPid(): number;
    obtenerMemoriaRequerida(): number;
    obtenerCpuTotal(): number;
    obtenerCpuRestante(): number;
    obtenerEstado(): EstadoProceso;
    esperarMemoria(): void;
    admitir(): void;
    despachar(): void;
    obtenerQuantumConsumido(): number;
ejecutarTick(): void;
}