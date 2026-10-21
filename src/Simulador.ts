import { EstadoProceso } from "./EstadoProceso.js";
import { GestorMemoria } from "./GestorMemoria.js";
import { PlanificadorRoundRobin } from "./PlanificadorRoundRobin.js";
import { Proceso } from "./Proceso.js";
import { Metricas } from "./Metricas.js";
import type { EventoES } from "./EventoES.js";
import type { IGestorMemoria } from "./IGestorMemoria.js";
import type { IMetricas, VistaMetricas } from "./IMetricas.js";
import type {
    IPlanificador,
    ResultadoTickCpu
} from "./IPlanificador.js";
import type { IProceso } from "./IProceso.js";
import type {
    ISimulador,
    VistaProceso,
    VistaSistema
} from "./ISimulador.js";

export class Simulador implements ISimulador {
    private readonly memoria: IGestorMemoria;
    private readonly planificador: IPlanificador;
    private readonly metricas: IMetricas;
    private readonly procesos: Map<number, IProceso> = new Map();
    private tick: number = 0;

    constructor(memoriaTotal: number, quantum: number) {
        this.memoria = new GestorMemoria(memoriaTotal);
        this.planificador = new PlanificadorRoundRobin(quantum);
        this.metricas = new Metricas(memoriaTotal);
    }

    registrarProceso(
        pid: number,
        memoria: number,
        cpu: number,
        evento?: EventoES
    ): void {
        this.procesos.has(pid)
            ? this.rechazar("El PID ya esta registrado")
            : undefined;

        memoria > this.memoria.obtenerTotal()
            ? this.rechazar("El proceso supera la memoria total")
            : undefined;

        const proceso = new Proceso(pid, memoria, cpu);

        evento === undefined
            ? undefined
            : proceso.configurarES(evento.despuesDeCpu, evento.duracion);

        this.procesos.set(pid, proceso);
    }

    avanzarTick(): ResultadoTickCpu {
        this.admitirPendientes();
        this.actualizarBloqueados();

        const resultado = this.planificador.ejecutarTick();

        resultado.pidTerminado === null
            ? undefined
            : this.memoria.liberar(resultado.pidTerminado);

        this.tick++;
        this.metricas.actualizar(resultado, this.memoria.obtenerMapa());

        return resultado;
    }

    consultarMetricas(): VistaMetricas {
        return this.metricas.consultar();
    }

    consultarEstado(): VistaSistema {
        return {
            tick: this.tick,
            pidEnCpu: this.planificador.obtenerPidEnCpu(),
            listos: this.planificador.obtenerListos(),
            esperandoMemoria: this.pidsConEstado(
                EstadoProceso.EsperandoMemoria
            ),
            bloqueados: this.pidsConEstado(EstadoProceso.Bloqueado),
            terminados: this.pidsConEstado(EstadoProceso.Terminado),
            procesos: Array.from(
                this.procesos.values(),
                proceso => this.crearVista(proceso)
            ),
            memoria: this.memoria.obtenerMapa()
        };
    }

    private admitirPendientes(): void {
        for (const proceso of this.procesos.values()) {
            const pendiente =
                proceso.obtenerEstado() === EstadoProceso.Nuevo ||
                proceso.obtenerEstado() === EstadoProceso.EsperandoMemoria;

            pendiente
                ? this.intentarAdmision(proceso)
                : undefined;
        }
    }

    private intentarAdmision(proceso: IProceso): void {
        const asignada = this.memoria.asignar(
            proceso.obtenerPid(),
            proceso.obtenerMemoriaRequerida()
        );

        asignada
            ? this.admitir(proceso)
            : this.dejarEsperando(proceso);
    }

    private admitir(proceso: IProceso): void {
        proceso.admitir();
        this.planificador.encolar(proceso);
    }

    private dejarEsperando(proceso: IProceso): void {
        proceso.obtenerEstado() === EstadoProceso.Nuevo
            ? proceso.esperarMemoria()
            : undefined;
    }

    private actualizarBloqueados(): void {
        const bloqueados = Array.from(this.procesos.values()).filter(
            proceso => proceso.obtenerEstado() === EstadoProceso.Bloqueado
        );

        for (const proceso of bloqueados) {
            proceso.actualizarBloqueo();

            proceso.obtenerEstado() === EstadoProceso.Listo
                ? this.planificador.encolar(proceso)
                : undefined;
        }
    }

    private pidsConEstado(estado: EstadoProceso): number[] {
        return Array.from(this.procesos.values())
            .filter(proceso => proceso.obtenerEstado() === estado)
            .map(proceso => proceso.obtenerPid());
    }

    private crearVista(proceso: IProceso): VistaProceso {
        return {
            pid: proceso.obtenerPid(),
            memoriaRequerida: proceso.obtenerMemoriaRequerida(),
            cpuTotal: proceso.obtenerCpuTotal(),
            cpuRestante: proceso.obtenerCpuRestante(),
            estado: proceso.obtenerEstado(),
            quantumConsumido: proceso.obtenerQuantumConsumido(),
            bloqueoRestante: proceso.obtenerBloqueoRestante()
        };
    }

    private rechazar(mensaje: string): never {
        throw new Error(mensaje);
    }
}