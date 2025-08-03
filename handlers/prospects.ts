import { UpnifyAuthenticator } from '../auth/upnifyAuth.js';
import { API_URLS, ENDPOINTS, DEFAULTS, UPNIFY_DEFAULTS } from '../utils/constants.js';
import { createErrorResponse, createSuccessResponse } from '../utils/validators.js';
import type { ProspectData } from '../types/interfaces.js';

export class ProspectsHandler {
    constructor(private auth: UpnifyAuthenticator) {}

    async createProspect(tkIntegracion: string, prospectData: ProspectData) {
        try {
            const { token, userInfo } = await this.auth.getTokenAndUserInfo(tkIntegracion);

            // Obtener el catálogo de fases para prospectos
            let tkFase = UPNIFY_DEFAULTS.TK_FASE;
            try {
                const phases = await this.auth.getProspectPhases(tkIntegracion);
                if (phases && phases.length > 0) {
                    tkFase = phases[0].tkFase;
                }
            } catch (phaseError) {
                // Usar fallback si no se pueden obtener las fases
                console.error('No se pudieron obtener las fases, usando fallback:', phaseError);
            }

            const upnifyPayload = {
                choice_empresa: "",
                search_terms: "",
                empresa: prospectData.empresa || "",
                tkEmpresa: "",
                cp: {
                    estatus: "",
                    validador: "",
                    division: "",
                    tipo: "",
                    gasto: "",
                    periodo: "",
                    tipoDeServicio: "",
                    testFecha: ""
                },
                nombre: prospectData.nombre || "",
                apellidos: prospectData.apellidos || "",
                titulo: "",
                sexo: prospectData.sexo || DEFAULTS.GENDER,
                correo: prospectData.correo || "",
                url: "",
                telefono2LadaPais: DEFAULTS.PHONE_PREFIX,
                telefono2: prospectData.telefono || "",
                movilLadaPais: DEFAULTS.PHONE_PREFIX,
                movil: prospectData.movil || "",
                puesto: prospectData.puesto || "",
                calle: prospectData.calle || "",
                colonia: prospectData.colonia || "",
                idPais: prospectData.idPais || DEFAULTS.COUNTRY,
                idEstado: "",
                idMunicipio: "",
                ciudad: prospectData.ciudad || "",
                codigoPostal: prospectData.codigoPostal || "",
                tkFase: tkFase,
                tkOrigen: "",
                facebook: "",
                twitter: "",
                skype: "",
                linkedIn: "",
                googlePlus: "",
                etiquetas: "",
                tkEtiquetas: ""
            };

            const response = await fetch(`${API_URLS.UPNIFY_BASE}${ENDPOINTS.PROSPECTS}`, {
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
                throw new Error(`Error al crear prospecto: ${response.status} ${response.statusText}. ${errorText}`);
            }

            const result = await response.text();
            return {
                success: true,
                message: 'Prospecto creado exitosamente',
                response: result,
                tkEmpresa: userInfo.tkEmpresa
            };
        } catch (error) {
            throw new Error(`Error al crear prospecto en Upnify: ${error instanceof Error ? error.message : error}`);
        }
    }

    async searchContacts(tkIntegracion: string, searchParams: { buscar: string; cantidadRegistros: number }) {
        try {
            const { token, userInfo } = await this.auth.getTokenAndUserInfo(tkIntegracion);

            const queryParams = new URLSearchParams({
                buscar: searchParams.buscar,
                cantidadRegistros: searchParams.cantidadRegistros.toString(),
                secciones: DEFAULTS.SEARCH_SECTIONS
            });

            const response = await fetch(`${API_URLS.UPNIFY_BASE}${ENDPOINTS.SEARCH}?${queryParams}`, {
                method: 'GET',
                headers: {
                    'token': token,
                    'Content-Type': 'application/json',
                    'User-Agent': 'UpnifyMCP/1.0'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Parámetros enviados:', searchParams);
                console.error('Token usado:', token);
                console.error('Respuesta del servidor:', errorText);
                throw new Error(`Error al buscar contactos: ${response.status} ${response.statusText}. ${errorText}`);
            }

            const resultados = await response.json();

            if (!Array.isArray(resultados) || resultados.length < 2) {
                return {
                    success: true,
                    message: 'Búsqueda completada sin resultados',
                    termino: searchParams.buscar,
                    total: 0,
                    resumen: { prospectos: 0, clientes: 0 },
                    contactos: [],
                    tkEmpresa: userInfo.tkEmpresa
                };
            }

            // resultados[0] contiene el resumen, resultados[1] contiene los datos
            const resumen = resultados[0][0] || {};
            const contactosRaw = resultados[1] || [];

            // Filtrar y formatear solo prospectos y clientes
            const contactos = contactosRaw
                .filter((item: any) => item.seccion === 'prospectos' || item.seccion === 'clientes')
                .map((contacto: any) => ({
                    seccion: contacto.seccion,
                    tkProspecto: contacto.tkProspecto,
                    contacto: contacto.contacto,
                    correo: contacto.correo,
                    telefono: contacto.telefono,
                    movil: contacto.movil,
                    ejecutivo: contacto.ejecutivo,
                    ejecutivoIniciales: contacto.ejecutivoIniciales,
                    empresa: contacto.empresa || '',
                    id: `${contacto.seccion}-${contacto.tkProspecto}`
                }));

            return {
                success: true,
                message: 'Búsqueda completada exitosamente',
                termino: searchParams.buscar,
                total: contactos.length,
                resumen: {
                    prospectos: resumen.prospectos || 0,
                    clientes: resumen.clientes || 0
                },
                contactos: contactos,
                mensaje: contactos.length > 1
                    ? `Se encontraron ${contactos.length} contactos. Para crear una oportunidad, especifica el tkProspecto del contacto deseado.`
                    : contactos.length === 1
                        ? 'Se encontró 1 contacto exacto'
                        : 'No se encontraron contactos',
                tkEmpresa: userInfo.tkEmpresa
            };

        } catch (error) {
            throw new Error(`Error al buscar contactos en Upnify: ${error instanceof Error ? error.message : error}`);
        }
    }
}
