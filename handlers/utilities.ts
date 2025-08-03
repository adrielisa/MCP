import { UpnifyAuthenticator } from '../auth/upnifyAuth.js';
import { API_URLS, ENDPOINTS } from '../utils/constants.js';
import type { ReminderData } from '../types/interfaces.js';

export class UtilitiesHandler {
    constructor(private auth: UpnifyAuthenticator) {}

    async createReminder(tkIntegracion: string, reminderData: ReminderData) {
        try {
            const { token, userInfo } = await this.auth.getTokenAndUserInfo(tkIntegracion);

            const upnifyPayload = {
                key: "tkCarpeta",
                tipoCarpeta: "1",
                tkOportunidad: "",
                asunto: reminderData.asunto || "",
                gmt: "10",
                tkProspecto: "",
                search_terms: "",
                descripcion: reminderData.descripcion || "",
                idTipoPendiente: "1",
                frecuencia: "",
                recurrencia: "1",
                terminar: "0",
                diasMes: "1",
                diasRecurrencia: "",
                fechaInicio: reminderData.fechaInicio || ""
            };

            const response = await fetch(`${API_URLS.UPNIFY_BASE}${ENDPOINTS.REMINDERS}`, {
                method: 'POST',
                headers: {
                    'token': token,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(upnifyPayload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Payload enviado:', JSON.stringify(upnifyPayload, null, 2));
                console.error('Token usado:', token);
                console.error('Respuesta del servidor:', errorText);
                throw new Error(`Error al crear recordatorio: ${response.status} ${response.statusText}. ${errorText}`);
            }

            const result = await response.json();
            return {
                success: true,
                message: 'Recordatorio agendado exitosamente',
                data: result,
                tkEmpresa: userInfo.tkEmpresa
            };
        } catch (error) {
            throw new Error(`Error al agendar recordatorio en Upnify: ${error instanceof Error ? error.message : error}`);
        }
    }
}
