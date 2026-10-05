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

    private rechazarTransicion(): never {
        throw new Error("El cambio de estado no esta permitido");
    }
    private quantumConsumido: number = 0;
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

    esperarMemoria(): void {
        this.estado = this.estado === EstadoProceso.Nuevo
            ? EstadoProceso.EsperandoMemoria
            : this.rechazarTransicion();
    }

    admitir(): void {
        const puedeAdmitirse =
            this.estado === EstadoProceso.Nuevo ||
            this.estado === EstadoProceso.EsperandoMemoria;

        this.estado = puedeAdmitirse
            ? EstadoProceso.Listo
            : this.rechazarTransicion();
    }

  despachar(): void {
    this.estado = this.estado === EstadoProceso.Listo
        ? EstadoProceso.Ejecutando
        : this.rechazarTransicion();

    this.quantumConsumido = 0;
}
obtenerQuantumConsumido(): number {
    return this.quantumConsumido;
}

ejecutarTick(): void {
    this.estado === EstadoProceso.Ejecutando
        ? this.consumirCpu()
        : this.rechazarTransicion();
}

private consumirCpu(): void {
    this.cpuRestante--;
    this.quantumConsumido++;

    this.estado = this.cpuRestante === 0
        ? EstadoProceso.Terminado
        : EstadoProceso.Ejecutando;
}
reencolar(): void {
    this.estado = this.estado === EstadoProceso.Ejecutando
        ? EstadoProceso.Listo
        : this.rechazarTransicion();
}
renovarQuantum(): void {
    this.estado === EstadoProceso.Ejecutando
        ? this.quantumConsumido = 0
        : this.rechazarTransicion();
}
}
