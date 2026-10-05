import { EstadoProceso } from "./EstadoProceso.js";
import type { IProceso } from "./IProceso.js";
import type {
    IPlanificador,
    ResultadoTickCpu
} from "./IPlanificador.js";

export class PlanificadorRoundRobin implements IPlanificador {
    private readonly quantum: number;
    private listos: IProceso[] = [];
    private actual: IProceso | null = null;

    constructor(quantum: number) {
        this.quantum = Number.isInteger(quantum) && quantum > 0
            ? quantum
            : this.rechazar("El quantum debe ser un entero positivo");
    }

    encolar(proceso: IProceso): void {
        proceso.obtenerEstado() === EstadoProceso.Listo
            ? undefined
            : this.rechazar("Solo se pueden encolar procesos Listos");

        const pid = proceso.obtenerPid();
        const duplicado =
            this.actual?.obtenerPid() === pid ||
            this.listos.some(listo => listo.obtenerPid() === pid);

        duplicado
            ? this.rechazar("El proceso ya esta en el planificador")
            : this.listos.push(proceso);
    }

    obtenerPidEnCpu(): number | null {
        return this.actual?.obtenerPid() ?? null;
    }

    obtenerListos(): readonly number[] {
        return this.listos.map(proceso => proceso.obtenerPid());
    }

    ejecutarTick(): ResultadoTickCpu {
        this.actual === null
            ? this.despacharSiguiente()
            : undefined;

        return this.actual === null
            ? {
                pidEjecutado: null,
                pidTerminado: null,
                cambioContexto: false
            }
            : this.ejecutarActual(this.actual);
    }

    private despacharSiguiente(): void {
        const siguiente = this.listos.shift();

        siguiente === undefined
            ? undefined
            : siguiente.despachar();

        this.actual = siguiente ?? null;
    }

    private ejecutarActual(proceso: IProceso): ResultadoTickCpu {
        proceso.ejecutarTick();

        return proceso.obtenerEstado() === EstadoProceso.Terminado
            ? this.finalizar(proceso)
            : this.revisarQuantum(proceso);
    }

    private finalizar(proceso: IProceso): ResultadoTickCpu {
        this.actual = null;

        return {
            pidEjecutado: proceso.obtenerPid(),
            pidTerminado: proceso.obtenerPid(),
            cambioContexto: false
        };
    }

    private revisarQuantum(proceso: IProceso): ResultadoTickCpu {
        const agotado =
            proceso.obtenerQuantumConsumido() >= this.quantum;

        return agotado
            ? this.resolverQuantum(proceso)
            : {
                pidEjecutado: proceso.obtenerPid(),
                pidTerminado: null,
                cambioContexto: false
            };
    }

    private resolverQuantum(proceso: IProceso): ResultadoTickCpu {
        return this.listos.length > 0
            ? this.rotar(proceso)
            : this.continuar(proceso);
    }

    private rotar(proceso: IProceso): ResultadoTickCpu {
        proceso.reencolar();
        this.actual = null;
        this.encolar(proceso);

        return {
            pidEjecutado: proceso.obtenerPid(),
            pidTerminado: null,
            cambioContexto: true
        };
    }

    private continuar(proceso: IProceso): ResultadoTickCpu {
        proceso.renovarQuantum();

        return {
            pidEjecutado: proceso.obtenerPid(),
            pidTerminado: null,
            cambioContexto: false
        };
    }

    private rechazar(mensaje: string): never {
        throw new Error(mensaje);
    }
}