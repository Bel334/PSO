import type { IProceso } from "./IProceso.js";
import { EstadoProceso } from "./EstadoProceso.js";

export class Proceso implements IProceso {
    private pid: number;
    private memoriaRequerida: number;
    private cpuTotal: number;
    private cpuRestante: number;
    private estado: EstadoProceso = EstadoProceso.Nuevo;

    constructor(pid: number, memoriaRequerida: number, cpuTotal: number) {
        this.pid = Number.isInteger(pid) && pid > 0
            ? pid
            : this.rechazarPid();

        this.memoriaRequerida =
            Number.isInteger(memoriaRequerida) && memoriaRequerida > 0
                ? memoriaRequerida
                : this.rechazarMemoria();

        this.cpuTotal = Number.isInteger(cpuTotal) && cpuTotal > 0
            ? cpuTotal
            : this.rechazarCpu();

        this.cpuRestante = this.cpuTotal;
    }

    private rechazarPid(): never {
        throw new Error("El PID tiene que ser un entero positivo");
    }

    private rechazarMemoria(): never {
        throw new Error("La memoria tiene que ser un entero positivo");
    }

    private rechazarCpu(): never {
        throw new Error("La CPU tiene que ser un entero positivo");
    }

    obtenerPid(): number {
        return this.pid;
    }

    obtenerMemoriaRequerida(): number {
        return this.memoriaRequerida;
    }

    obtenerCpuTotal(): number {
        return this.cpuTotal;
    }

    obtenerCpuRestante(): number {
        return this.cpuRestante;
    }

    obtenerEstado(): EstadoProceso {
        return this.estado;
    }
}