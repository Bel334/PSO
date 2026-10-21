import type { VistaBloque } from "./IGestorMemoria.js";
import type { ResultadoTickCpu } from "./IPlanificador.js";
import type { IMetricas, VistaMetricas } from "./IMetricas.js";

export class Metricas implements IMetricas {
    private readonly memoriaTotal: number;
    private ticksTranscurridos: number = 0;
    private ticksOcupados: number = 0;
    private cambiosContexto: number = 0;
    private memoriaLibreTotal: number;
    private mayorBloqueLibre: number;

    constructor(memoriaTotal: number) {
        this.memoriaTotal =
            Number.isInteger(memoriaTotal) && memoriaTotal > 0
                ? memoriaTotal
                : this.rechazarConfiguracion();

        this.memoriaLibreTotal = this.memoriaTotal;
        this.mayorBloqueLibre = this.memoriaTotal;
    }

    actualizar(
        resultado: ResultadoTickCpu,
        bloques: readonly VistaBloque[]
    ): void {
        this.ticksTranscurridos++;

        this.ticksOcupados += resultado.pidEjecutado === null ? 0 : 1;
        this.cambiosContexto += resultado.cambioContexto ? 1 : 0;

        const libres = bloques.filter(bloque => bloque.pid === null);

        this.memoriaLibreTotal = libres.reduce(
            (total, bloque) => total + bloque.tamano,
            0
        );

        this.mayorBloqueLibre = libres.reduce(
            (mayor, bloque) => Math.max(mayor, bloque.tamano),
            0
        );
    }

    consultar(): VistaMetricas {
        return {
            ocupacionMemoria:
                100 * (this.memoriaTotal - this.memoriaLibreTotal) /
                this.memoriaTotal,

            utilizacionCpu: this.ticksTranscurridos === 0
                ? 0
                : 100 * this.ticksOcupados / this.ticksTranscurridos,

            cambiosContexto: this.cambiosContexto,

            memoriaLibreTotal: this.memoriaLibreTotal,

            mayorBloqueLibre: this.mayorBloqueLibre,

            fragmentacionExterna: this.memoriaLibreTotal === 0
                ? 0
                : 100 * (
                    1 - this.mayorBloqueLibre / this.memoriaLibreTotal
                )
        };
    }

    private rechazarConfiguracion(): never {
        throw new Error("La memoria total debe ser un entero positivo");
    }
}