import { API_URLS, ENDPOINTS, DEFAULTS, UPNIFY_DEFAULTS } from '../utils/constants.js';
import type { TokenCache, AuthInfo, ProspectData, ReportParams, SearchParams, OpportunityData, ReminderData, ActivityReportParams, ConversionReportParams } from '../types/interfaces.js';

export class UpnifyAuthenticator {
    private tokenCache: TokenCache = {};

    private getCacheKey(tkIntegracion: string): string {
        return tkIntegracion;
    }

    async getTokenAndUserInfo(tkIntegracion: string): Promise<AuthInfo> {
        const cacheKey = this.getCacheKey(tkIntegracion);

        // Verificar si tenemos un token válido en cache
        const cached = this.tokenCache[cacheKey];
        if (cached && new Date() < cached.expiry) {
            return { token: cached.token, userInfo: cached.userInfo };
        }

        try {
            // Hacer login usando tkIntegracion para obtener nuevo token
            const response = await fetch(`${API_URLS.SALESUP_BASE}${ENDPOINTS.LOGIN}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'token': tkIntegracion
                },
                body: JSON.stringify({})
            });

            if (!response.ok) {
                throw new Error(`Error en login con tkIntegracion: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            if (!data || data.length === 0) {
                throw new Error('Token de integración inválido o respuesta inesperada del servidor');
            }

            const userInfo = data[0];
            if (!userInfo.token) {
                throw new Error('Token de sesión no recibido');
            }

            // Calcular fecha de expiración (por defecto 2 horas desde ahora)
            const expiry = new Date(Date.now() + DEFAULTS.CACHE_EXPIRY_HOURS * 60 * 60 * 1000);

            // Guardar en cache
            this.tokenCache[cacheKey] = {
                token: userInfo.token,
                expiry: expiry,
                userInfo: userInfo
            };

            return { token: userInfo.token, userInfo };
        } catch (error) {
            throw new Error(`Error al autenticarse con Upnify usando tkIntegracion: ${error instanceof Error ? error.message : error}`);
        }
    }

    async getProspectPhases(tkIntegracion: string): Promise<any[]> {
        const { token } = await this.getTokenAndUserInfo(tkIntegracion);

        try {
            const queryParams = new URLSearchParams({
                entidad: '0'
            });

            const response = await fetch(`${API_URLS.UPNIFY_BASE}${ENDPOINTS.PHASES}?${queryParams}`, {
                method: 'GET',
                headers: {
                    'token': token,
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Error al obtener catálogo de fases: ${response.status} ${response.statusText}. ${errorText}`);
            }

            const phases = await response.json();
            return phases;
        } catch (error) {
            throw new Error(`Error al obtener catálogo de fases de Upnify: ${error instanceof Error ? error.message : error}`);
        }
    }

    // Limpiar cache de tokens expirados
    cleanExpiredTokens(): void {
        const now = new Date();
        Object.keys(this.tokenCache).forEach(key => {
            if (this.tokenCache[key].expiry <= now) {
                delete this.tokenCache[key];
            }
        });
    }
}
