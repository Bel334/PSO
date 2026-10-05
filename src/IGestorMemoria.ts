export interface VistaBloque {
    readonly inicio: number;
    readonly tamano: number;
    readonly pid: number | null;
}

export interface IGestorMemoria {
    asignar(pid: number, tamano: number): boolean;
    liberar(pid: number): void;
    obtenerMapa(): readonly VistaBloque[];
    obtenerTotal(): number;
}