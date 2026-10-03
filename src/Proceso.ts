import type { IProceso } from "./IProceso.js";

export class Proceso implements IProceso {
    private pid: number;
    private memoriaRequerida: number;

    constructor(pid: number, memoriaRequerida: number) {
        this.pid = Number.isInteger(pid) && pid > 0
            ? pid
            : this.rechazarPid();

        this.memoriaRequerida =
    Number.isInteger(memoriaRequerida) && memoriaRequerida > 0
        ? memoriaRequerida
        : this.rechazarMemoria();
    }

    private rechazarPid(): never {
        throw new Error("El PID tiene que ser un entero positivo");
    }
    private rechazarMemoria(): never {
    throw new Error("La memoria tiene que ser un entero positivo");
}

    obtenerPid(): number {
        return this.pid;
    }

    obtenerMemoriaRequerida(): number {
        return this.memoriaRequerida;
    }
}