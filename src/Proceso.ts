import type { IProceso } from "./IProceso.js";
import { EstadoProceso } from "./EstadoProceso.js";
import type { EventoES } from "./EventoES.js";

export class Proceso implements IProceso {
    private pid: number;
    private memoriaRequerida: number;
    private cpuTotal: number;
    private cpuRestante: number;
    private estado: EstadoProceso = EstadoProceso.Nuevo;
    private quantumConsumido: number = 0;
    private eventoES: EventoES | null = null;
    private bloqueoRestante: number = 0;

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

    obtenerQuantumConsumido(): number {
        return this.quantumConsumido;
    }

    obtenerBloqueoRestante(): number {
        return this.bloqueoRestante;
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

    ejecutarTick(): void {
        this.estado === EstadoProceso.Ejecutando
            ? this.consumirCpu()
            : this.rechazarTransicion();
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

    configurarES(despuesDeCpu: number, duracion: number): void {
        const valido =
            this.estado === EstadoProceso.Nuevo &&
            this.eventoES === null &&
            Number.isInteger(despuesDeCpu) &&
            despuesDeCpu > 0 &&
            despuesDeCpu <= this.cpuTotal &&
            Number.isInteger(duracion) &&
            duracion > 0;

        valido
            ? this.eventoES = { despuesDeCpu, duracion }
            : this.rechazarEventoES();
    }

    actualizarBloqueo(): void {
        this.estado === EstadoProceso.Bloqueado
            ? this.descontarBloqueo()
            : this.rechazarTransicion();
    }

    private consumirCpu(): void {
        this.cpuRestante--;
        this.quantumConsumido++;

        this.cpuRestante === 0
            ? this.estado = EstadoProceso.Terminado
            : this.revisarES();
    }

    private revisarES(): void {
        const consumida = this.cpuTotal - this.cpuRestante;
        const evento = this.eventoES;

        evento !== null && consumida === evento.despuesDeCpu
            ? this.bloquearPorES(evento.duracion)
            : undefined;
    }

    private bloquearPorES(duracion: number): void {
        this.bloqueoRestante = duracion;
        this.estado = EstadoProceso.Bloqueado;
        this.eventoES = null;
    }

    private descontarBloqueo(): void {
        this.bloqueoRestante--;

        this.estado = this.bloqueoRestante === 0
            ? EstadoProceso.Listo
            : EstadoProceso.Bloqueado;
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

    private rechazarEventoES(): never {
        throw new Error("El evento de E/S es invalido");
    }
}