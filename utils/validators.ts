import { REPORT_LABELS } from './constants.js';
import type { ReportParams, ActivityReportParams, ConversionReportParams } from '../types/interfaces.js';

// Función para obtener el tkIntegracion del contexto
export function getTkIntegracion(request: any): string {
    // Usar directamente la variable de entorno como respaldo
    const tkIntegracion = process.env.TK_INTEGRACION || 'P074243F238-9BD5-4EA1-8DD9-D05E890EA024';

    console.error('=== DEBUG AUTENTICACIÓN ===');
    console.error('Process env TK_INTEGRACION:', process.env.TK_INTEGRACION);
    console.error('Token final usado:', tkIntegracion);
    console.error('Request meta:', JSON.stringify(request.meta, null, 2));
    console.error('=== FIN DEBUG ===');

    if (!tkIntegracion) {
        throw new Error('tkIntegracion no configurado. Por favor configura tu token de integración.');
    }
    return tkIntegracion;
}

// Validaciones para reportes
export function validateReportParams(params: any): params is ReportParams {
    return (
        params.agrupacion !== undefined &&
        params.periodicidad !== undefined &&
        params.anio !== undefined &&
        params.impuestos !== undefined
    );
}

export function validateActivityReportParams(params: any): params is ActivityReportParams {
    return (
        params.agrupacion !== undefined &&
        params.periodo !== undefined
    );
}

export function validateConversionReportParams(params: any): params is ConversionReportParams {
    return (
        params.agrupacion !== undefined &&
        params.periodo !== undefined &&
        params.situacion !== undefined
    );
}

// Helpers para formatear respuestas de reportes
export function formatReportParameters(params: ReportParams) {
    return {
        agrupacion: `${params.agrupacion} (${REPORT_LABELS.AGRUPACION[params.agrupacion as keyof typeof REPORT_LABELS.AGRUPACION] || 'Desconocido'})`,
        periodicidad: `${params.periodicidad} (${REPORT_LABELS.PERIODICIDAD[params.periodicidad as keyof typeof REPORT_LABELS.PERIODICIDAD] || 'Desconocido'})`,
        anio: params.anio,
        impuestos: params.impuestos === 1 ? 'Incluir' : 'Excluir'
    };
}

export function formatPendingPaymentsParameters(params: Pick<ReportParams, 'agrupacion' | 'periodicidad'>) {
    return {
        agrupacion: `${params.agrupacion} (${REPORT_LABELS.AGRUPACION[params.agrupacion as keyof typeof REPORT_LABELS.AGRUPACION] || 'Desconocido'})`,
        periodicidad: `${params.periodicidad} (${REPORT_LABELS.PERIODICIDAD[params.periodicidad as keyof typeof REPORT_LABELS.PERIODICIDAD] || 'Desconocido'})`
    };
}

// Helper para crear respuestas de error estándar
export function createErrorResponse(error: unknown, context: string) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({
                    success: false,
                    error: `${context}: ${errorMessage}`
                }, null, 2)
            }
        ]
    };
}

// Helper para crear respuestas de éxito estándar
export function createSuccessResponse(data: any) {
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify(data, null, 2)
            }
        ]
    };
}
