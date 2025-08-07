import { REPORT_LABELS } from './constants.js';
import type { ReportParams, ActivityReportParams, ConversionReportParams } from '../types/interfaces.js';

// Función para obtener el tkIntegracion del contexto
export function getTkIntegracion(request: any): string {
    // Intentar múltiples formas de obtener el token
    const tokenSources = [
        process.env.TK_INTEGRACION,
        process.env.tkIntegracion,
        process.env.TK_INTEGRACION_TOKEN,
    ];

    const tkIntegracion = tokenSources.find(token => token && token.trim().length > 0);

    console.error('=== DEBUG AUTENTICACIÓN ===');
    console.error('Process env TK_INTEGRACION:', process.env.TK_INTEGRACION);
    console.error('Process env tkIntegracion:', process.env.tkIntegracion);
    console.error('Process env TK_INTEGRACION_TOKEN:', process.env.TK_INTEGRACION_TOKEN);
    console.error('Todas las env vars:', Object.keys(process.env).filter(k => k.toLowerCase().includes('integracion') || k.toLowerCase().includes('upnify')));
    console.error('Token final usado:', tkIntegracion);
    console.error('Request meta:', JSON.stringify(request?.meta, null, 2));
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
