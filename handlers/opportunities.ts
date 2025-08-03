import { UpnifyAuthenticator } from '../auth/upnifyAuth.js';
import { API_URLS, ENDPOINTS, UPNIFY_DEFAULTS } from '../utils/constants.js';
import type { OpportunityData } from '../types/interfaces.js';

export class OpportunitiesHandler {
    constructor(private auth: UpnifyAuthenticator) {}

    async createOpportunity(tkIntegracion: string, opportunityData: OpportunityData) {
        try {
            const { token, userInfo } = await this.auth.getTokenAndUserInfo(tkIntegracion);

            // Calcular comisionMonto automáticamente
            const comisionMonto = parseFloat(opportunityData.monto.toString()) * parseFloat(opportunityData.comision.toString());

            // Crear fecha de cierre estimado (30 días desde hoy)
            const cierreEstimado = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

            const payload = {
                'cp.fechaDeEntrega': '',
                concepto: opportunityData.concepto,
                tkFase: UPNIFY_DEFAULTS.TK_FASE_OPPORTUNITY,
                tkLinea: UPNIFY_DEFAULTS.TK_LINEA,
                tkMoneda: UPNIFY_DEFAULTS.TK_MONEDA,
                monto: parseFloat(opportunityData.monto.toString()),
                tipoCambio: 1,
                comision: parseFloat(opportunityData.comision.toString()),
                comisionMonto: comisionMonto,
                cierreEstimado: cierreEstimado,
                tkCerteza: UPNIFY_DEFAULTS.TK_CERTEZA,
                cantidad: '',
                tkProspecto: opportunityData.tkProspecto,
                cp: JSON.stringify({ fechaDeEntrega: '' })
            };

            // Convertir a URLSearchParams para form-encoded
            const formData = new URLSearchParams();
            for (const [key, value] of Object.entries(payload)) {
                if (value !== undefined && value !== null) {
                    formData.append(key, value.toString());
                }
            }

            const response = await fetch(`${API_URLS.UPNIFY_BASE}${ENDPOINTS.OPPORTUNITIES}`, {
                method: 'POST',
                headers: {
                    'token': token,
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'User-Agent': 'UpnifyMCP/1.0'
                },
                body: formData.toString()
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Payload enviado:', payload);
                console.error('Token usado:', token);
                console.error('Respuesta del servidor:', errorText);
                throw new Error(`Error al crear oportunidad: ${response.status} ${response.statusText}. ${errorText}`);
            }

            const result = await response.json();
            return {
                success: true,
                message: 'Oportunidad creada exitosamente',
                oportunidad: result,
                detalles: {
                    concepto: opportunityData.concepto,
                    monto: parseFloat(opportunityData.monto.toString()),
                    comision: parseFloat(opportunityData.comision.toString()),
                    comisionMonto: comisionMonto,
                    tkProspecto: opportunityData.tkProspecto,
                    cierreEstimado: cierreEstimado
                },
                tkEmpresa: userInfo.tkEmpresa
            };
        } catch (error) {
            throw new Error(`Error al crear oportunidad en Upnify: ${error instanceof Error ? error.message : error}`);
        }
    }
}
