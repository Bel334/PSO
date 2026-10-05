import type { IBloqueMemoria } from "./IBloqueMemoria.js";

export class BloqueMemoria implements IBloqueMemoria {
    private readonly inicio: number;
    private readonly tamano: number;
    private readonly pid: number | null;

    constructor(inicio: number, tamano: number, pid: number | null = null) {
        this.inicio = Number.isInteger(inicio) && inicio >= 0
            ? inicio
            : this.rechazar("El inicio debe ser un entero no negativo");

        this.tamano = Number.isInteger(tamano) && tamano > 0
            ? tamano
            : this.rechazar("El tamano debe ser un entero positivo");

        this.pid = pid === null || (Number.isInteger(pid) && pid > 0)
            ? pid
            : this.rechazar("El PID debe ser un entero positivo");
    }

    obtenerInicio(): number {
        return this.inicio;
    }

    obtenerTamano(): number {
        return this.tamano;
    }

    obtenerPid(): number | null {
        return this.pid;
    }

    estaLibre(): boolean {
        return this.pid === null;
    }

    private rechazar(mensaje: string): never {
        throw new Error(mensaje);
    }
}