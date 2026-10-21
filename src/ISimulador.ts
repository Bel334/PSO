import type { EstadoProceso } from "./EstadoProceso.js";
import type { EventoES } from "./EventoES.js";
import type { VistaBloque } from "./IGestorMemoria.js";
import type { ResultadoTickCpu } from "./IPlanificador.js";
import type { VistaMetricas } from "./IMetricas.js";

export interface VistaProceso {
    readonly pid: number;
    readonly memoriaRequerida: number;
    readonly cpuTotal: number;
    readonly cpuRestante: number;
    readonly estado: EstadoProceso;
    readonly quantumConsumido: number;
    readonly bloqueoRestante: number;
}

export interface VistaSistema {
    readonly tick: number;
    readonly pidEnCpu: number | null;
    readonly listos: readonly number[];
    readonly esperandoMemoria: readonly number[];
    readonly bloqueados: readonly number[];
    readonly terminados: readonly number[];
    readonly procesos: readonly VistaProceso[];
    readonly memoria: readonly VistaBloque[];
}

export interface ISimulador {
    registrarProceso(
        pid: number,
        memoria: number,
        cpu: number,
        evento?: EventoES
    ): void;

    avanzarTick(): ResultadoTickCpu;
    consultarEstado(): VistaSistema;
    consultarMetricas(): VistaMetricas;
}