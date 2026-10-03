export interface IProceso {
    obtenerPid(): number;
    obtenerMemoriaRequerida(): number;
    obtenerCpuTotal(): number;
    obtenerCpuRestante(): number;
}