import type { VistaBloque } from "./IGestorMemoria.js";
import type { ResultadoTickCpu } from "./IPlanificador.js";

export interface VistaMetricas {
    readonly ocupacionMemoria: number;
    readonly utilizacionCpu: number;
    readonly cambiosContexto: number;
    readonly memoriaLibreTotal: number;
    readonly mayorBloqueLibre: number;
    readonly fragmentacionExterna: number;
}

export interface IMetricas {
    actualizar(
        resultado: ResultadoTickCpu,
        bloques: readonly VistaBloque[]
    ): void;

    consultar(): VistaMetricas;
}