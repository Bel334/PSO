import { BloqueMemoria } from "./BloqueMemoria.js";
import { FirstFit } from "./FirstFit.js";
import type {
    IGestorMemoria,
    VistaBloque
} from "./IGestorMemoria.js";
import type { IPoliticaAsignacion } from "./IPoliticaAsignacion.js";

export class GestorMemoria implements IGestorMemoria {
    private readonly total: number;
    private readonly politica: IPoliticaAsignacion;
    private bloques: BloqueMemoria[];

    constructor(
        total: number,
        politica: IPoliticaAsignacion = new FirstFit()
    ) {
        this.total = Number.isInteger(total) && total > 0
            ? total
            : this.rechazar("La memoria total debe ser un entero positivo");

        this.politica = politica;
        this.bloques = [new BloqueMemoria(0, this.total)];
    }

    obtenerTotal(): number {
        return this.total;
    }

    obtenerMapa(): readonly VistaBloque[] {
        return this.bloques.map(bloque => ({
            inicio: bloque.obtenerInicio(),
            tamano: bloque.obtenerTamano(),
            pid: bloque.obtenerPid()
        }));
    }

    asignar(pid: number, tamano: number): boolean {
        Number.isInteger(pid) && pid > 0
            ? undefined
            : this.rechazar("El PID debe ser un entero positivo");

        Number.isInteger(tamano) && tamano > 0 && tamano <= this.total
            ? undefined
            : this.rechazar("El tamano solicitado es invalido");

        this.bloques.some(bloque => bloque.obtenerPid() === pid)
            ? this.rechazar("El proceso ya tiene memoria")
            : undefined;

        const indice = this.politica.seleccionar(this.bloques, tamano);

        return indice === -1
            ? false
            : this.ocupar(indice, pid, tamano);
    }

    private ocupar(indice: number, pid: number, tamano: number): boolean {
        const bloque = this.bloques[indice]
            ?? this.rechazar("La politica selecciono un bloque inexistente");

        const inicio = bloque.obtenerInicio();
        const sobrante = bloque.obtenerTamano() - tamano;

        const nuevos = sobrante > 0
            ? [
                new BloqueMemoria(inicio, tamano, pid),
                new BloqueMemoria(inicio + tamano, sobrante)
            ]
            : [new BloqueMemoria(inicio, tamano, pid)];

        this.bloques.splice(indice, 1, ...nuevos);
        return true;
    }

    liberar(pid: number): void {
        this.bloques.some(bloque => bloque.obtenerPid() === pid)
            ? undefined
            : this.rechazar("El proceso no tiene memoria asignada");

        this.bloques = this.bloques.map(bloque =>
            bloque.obtenerPid() === pid
                ? new BloqueMemoria(
                    bloque.obtenerInicio(),
                    bloque.obtenerTamano()
                )
                : bloque
        );

        this.coalescer();
    }

    private coalescer(): void {
        const resultado: BloqueMemoria[] = [];

        for (const bloque of this.bloques) {
            const anterior = resultado[resultado.length - 1];

            const puedeFusionarse =
                anterior !== undefined &&
                anterior.estaLibre() &&
                bloque.estaLibre() &&
                anterior.obtenerInicio() + anterior.obtenerTamano() ===
                    bloque.obtenerInicio();

            puedeFusionarse && anterior !== undefined
                ? resultado.splice(
                    resultado.length - 1,
                    1,
                    new BloqueMemoria(
                        anterior.obtenerInicio(),
                        anterior.obtenerTamano() + bloque.obtenerTamano()
                    )
                )
                : resultado.push(bloque);
        }

        this.bloques = resultado;
    }

    private rechazar(mensaje: string): never {
        throw new Error(mensaje);
    }
}