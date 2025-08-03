// Interfaces para el cache de tokens
export interface TokenCache {
    [tkIntegracion: string]: {
        token: string;
        expiry: Date;
        userInfo: any;
    };
}

// Interfaces para datos de prospectos
export interface ProspectData {
    nombre: string;
    correo: string;
    apellidos?: string;
    sexo?: 'H' | 'M';
    telefono?: string;
    movil?: string;
    puesto?: string;
    empresa?: string;
    ciudad?: string;
    idPais?: string;
    calle?: string;
    colonia?: string;
    codigoPostal?: string;
    comentarios?: string;
}

// Interfaces para oportunidades
export interface OpportunityData {
    concepto: string;
    tkProspecto: string;
    monto: number;
    comision: number;
}

// Interfaces para reportes
export interface ReportParams {
    agrupacion: number;
    periodicidad: number;
    anio?: number;
    impuestos?: number;
}

export interface ActivityReportParams {
    agrupacion: number;
    periodo: number;
}

export interface ConversionReportParams {
    agrupacion: number;
    periodo: number;
    situacion: number;
}

// Interfaces para búsqueda de contactos
export interface SearchParams {
    buscar: string;
    cantidadRegistros: number;
}

// Interfaces para recordatorios
export interface ReminderData {
    asunto: string;
    descripcion: string;
    fechaInicio: string;
}

// Respuestas estándar
export interface UpnifyResponse {
    success: boolean;
    message: string;
    data?: any;
    error?: string;
}

export interface AuthInfo {
    token: string;
    userInfo: any;
}
