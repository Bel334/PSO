export interface IBloqueMemoria {
    obtenerInicio(): number;
    obtenerTamano(): number;
    obtenerPid(): number | null;
    estaLibre(): boolean;
}