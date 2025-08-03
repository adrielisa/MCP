import { UpnifyAuthenticator } from '../auth/upnifyAuth.js';
import { API_URLS, ENDPOINTS } from '../utils/constants.js';
import type { ReportParams, ActivityReportParams, ConversionReportParams } from '../types/interfaces.js';

export class ReportsHandler {
    constructor(private auth: UpnifyAuthenticator) {}

    async getSalesReport(tkIntegracion: string, reportParams: ReportParams) {
        try {
            const { token, userInfo } = await this.auth.getTokenAndUserInfo(tkIntegracion);

            // Construir URL con parámetros de query
            const queryParams = new URLSearchParams({
                agrupacion: reportParams.agrupacion.toString(),
                periodicidad: reportParams.periodicidad.toString(),
                anio: reportParams.anio!.toString(),
                impuestos: reportParams.impuestos!.toString()
            });

            const response = await fetch(`${API_URLS.UPNIFY_BASE}${ENDPOINTS.REPORTS.SALES}?${queryParams}`, {
                method: 'GET',
                headers: {
                    'token': token,
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Parámetros enviados:', reportParams);
                console.error('Token usado:', token);
                console.error('Respuesta del servidor:', errorText);
                throw new Error(`Error al obtener reporte de ventas: ${response.status} ${response.statusText}. ${errorText}`);
            }

            const result = await response.json();
            return {
                success: true,
                message: 'Reporte de ventas obtenido exitosamente',
                data: result,
                parameters: reportParams,
                tkEmpresa: userInfo.tkEmpresa
            };
        } catch (error) {
            throw new Error(`Error al obtener reporte de ventas de Upnify: ${error instanceof Error ? error.message : error}`);
        }
    }

    async getPendingPayments(tkIntegracion: string, reportParams: Pick<ReportParams, 'agrupacion' | 'periodicidad'>) {
        try {
            const { token, userInfo } = await this.auth.getTokenAndUserInfo(tkIntegracion);

            // Construir URL con parámetros de query para cobros pendientes
            const queryParams = new URLSearchParams({
                agrupacion: reportParams.agrupacion.toString(),
                periodicidad: reportParams.periodicidad.toString()
            });

            const response = await fetch(`${API_URLS.UPNIFY_BASE}${ENDPOINTS.REPORTS.PENDING_PAYMENTS}?${queryParams}`, {
                method: 'GET',
                headers: {
                    'token': token,
                    'Content-Type': 'application/json',
                    'User-Agent': 'UpnifyMCP/1.0'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Parámetros enviados:', reportParams);
                console.error('Token usado:', token);
                console.error('Respuesta del servidor:', errorText);
                throw new Error(`Error al obtener cobros pendientes: ${response.status} ${response.statusText}. ${errorText}`);
            }

            const result = await response.json();
            return {
                success: true,
                message: 'Cobros pendientes obtenidos exitosamente',
                data: result,
                parameters: reportParams,
                total: result.length || 0,
                tkEmpresa: userInfo.tkEmpresa
            };
        } catch (error) {
            throw new Error(`Error al obtener cobros pendientes de Upnify: ${error instanceof Error ? error.message : error}`);
        }
    }

    async getActivityReport(tkIntegracion: string, params: ActivityReportParams) {
        try {
            const { token, userInfo } = await this.auth.getTokenAndUserInfo(tkIntegracion);
            
            const queryParams = new URLSearchParams({
                agrupacion: params.agrupacion.toString(),
                periodo: params.periodo.toString()
            });
            
            const response = await fetch(`${API_URLS.UPNIFY_BASE}${ENDPOINTS.REPORTS.ACTIVITIES}?${queryParams}`, {
                method: 'GET',
                headers: {
                    'token': token,
                    'Content-Type': 'application/json',
                }
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Error al obtener reporte de actividades: ${response.status} ${response.statusText}. ${errorText}`);
            }
            
            const result = await response.json();
            return {
                success: true,
                message: 'Reporte de actividades obtenido exitosamente',
                data: result,
                parameters: params,
                tkEmpresa: userInfo.tkEmpresa
            };
        } catch (error) {
            throw new Error(`Error al obtener reporte de actividades de Upnify: ${error instanceof Error ? error.message : error}`);
        }
    }

    async getConversionReport(tkIntegracion: string, params: ConversionReportParams) {
        try {
            const { token, userInfo } = await this.auth.getTokenAndUserInfo(tkIntegracion);
            
            const queryParams = new URLSearchParams({
                agrupacion: params.agrupacion.toString(),
                periodo: params.periodo.toString(),
                situacion: params.situacion.toString()
            });
            
            const response = await fetch(`${API_URLS.UPNIFY_BASE}${ENDPOINTS.REPORTS.CONVERSIONS}?${queryParams}`, {
                method: 'GET',
                headers: {
                    'token': token,
                    'Content-Type': 'application/json',
                }
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Error al obtener reporte de conversiones: ${response.status} ${response.statusText}. ${errorText}`);
            }
            
            const result = await response.json();
            return {
                success: true,
                message: 'Reporte de conversiones obtenido exitosamente',
                data: result,
                parameters: params,
                tkEmpresa: userInfo.tkEmpresa
            };
        } catch (error) {
            throw new Error(`Error al obtener reporte de conversiones de Upnify: ${error instanceof Error ? error.message : error}`);
        }
    }
}
