import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Cache de tokens por usuario para evitar logins repetitivos
interface TokenCache {
    [key: string]: {
        token: string;
        expiry: Date;
        userInfo: any;
    };
}

class UpnifyAuthenticator {
    private tokenCache: TokenCache = {};
    private baseUrl = 'https://api.upnify.com';

    private getCacheKey(email: string, password: string): string {
        // Crear una clave única pero no almacenar la contraseña directamente
        return `${email}_${Buffer.from(password).toString('base64').substring(0, 10)}`;
    }

    async getTokenAndUserInfo(email: string, password: string): Promise<{ token: string, userInfo: any }> {
        const cacheKey = this.getCacheKey(email, password);

        // Verificar si tenemos un token válido en cache
        const cached = this.tokenCache[cacheKey];
        if (cached && new Date() < cached.expiry) {
            return { token: cached.token, userInfo: cached.userInfo };
        }

        try {
            // Hacer login para obtener nuevo token
            const response = await fetch(`${this.baseUrl}/v4/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    usuario: email,
                    contrasenia: password
                })
            });

            if (!response.ok) {
                throw new Error(`Error en login: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            if (!data || data.length === 0) {
                throw new Error('Credenciales inválidas o respuesta inesperada del servidor');
            }

            const userInfo = data[0];
            if (!userInfo.tkSesion) {
                throw new Error('Token de sesión no recibido');
            }

            // Guardar en cache
            this.tokenCache[cacheKey] = {
                token: userInfo.tkSesion,
                expiry: new Date(userInfo.expiracion),
                userInfo: userInfo
            };

            return { token: userInfo.tkSesion, userInfo };
        } catch (error) {
            throw new Error(`Error al autenticarse con Upnify: ${error instanceof Error ? error.message : error}`);
        }
    }

    async getProspectPhases(email: string, password: string): Promise<any[]> {
        const { token, userInfo } = await this.getTokenAndUserInfo(email, password);

        try {
            // Construir URL con query parameters
            const queryParams = new URLSearchParams({
                entidad: '0'
            });

            const response = await fetch(`${this.baseUrl}/catalogos/fases?${queryParams}`, {
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

    async createProspect(email: string, password: string, prospectData: any): Promise<any> {
        const { token, userInfo } = await this.getTokenAndUserInfo(email, password);

        try {
            // Obtener el catálogo de fases para prospectos
            let tkFase = prospectData.tkFase;
            if (!tkFase) {
                try {
                    const phases = await this.getProspectPhases(email, password);
                    if (phases && phases.length > 0) {
                        tkFase = phases[0].tkFase; // Usar la primera fase disponible
                        console.log(`Usando fase por defecto: ${phases[0].fase} (${tkFase})`);
                    }
                } catch (phaseError) {
                    console.warn('No se pudo obtener el catálogo de fases, usando valor por defecto');
                    tkFase = "PFAS-AF9C06CD-A4B2-4A68-8383-241935B40E37"; // Fallback al valor original
                }
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
                sexo: prospectData.sexo || "",
                correo: prospectData.correo || "",
                url: prospectData.url || "",
                telefono2LadaPais: "+52",
                telefono2: prospectData.telefono || "",
                movilLadaPais: "+52",
                movil: prospectData.movil || "",
                puesto: prospectData.puesto || "",
                calle: prospectData.calle || "",
                colonia: prospectData.colonia || "",
                idPais: prospectData.idPais || "MX",
                idEstado: prospectData.idEstado || "",
                idMunicipio: prospectData.idMunicipio || "",
                ciudad: prospectData.ciudad || "",
                codigoPostal: prospectData.codigoPostal || "",
                tkFase: tkFase, // Usar la fase obtenida del catálogo o la proporcionada
                tkOrigen: prospectData.tkOrigen || "",
                facebook: prospectData.facebook || "",
                twitter: prospectData.twitter || "",
                skype: prospectData.skype || "",
                linkedIn: prospectData.linkedIn || "",
                googlePlus: prospectData.googlePlus || "",
                etiquetas: prospectData.etiquetas || "",
                tkEtiquetas: prospectData.tkEtiquetas || ""
            };

            const response = await fetch(`${this.baseUrl}/v4/prospectos`, {
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

    async getSalesReport(email: string, password: string, reportParams: any): Promise<any> {
        const { token, userInfo } = await this.getTokenAndUserInfo(email, password);

        try {
            // Construir URL con parámetros de query
            const queryParams = new URLSearchParams({
                agrupacion: reportParams.agrupacion.toString(),
                periodicidad: reportParams.periodicidad.toString(),
                anio: reportParams.anio.toString(),
                impuestos: reportParams.impuestos.toString()
            });

            const response = await fetch(`${this.baseUrl}/v4/reportesnv/ventas/realizadas?${queryParams}`, {
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

    async searchContacts(email: string, password: string, searchParams: any): Promise<any> {
        const { token, userInfo } = await this.getTokenAndUserInfo(email, password);

        try {
            // Construir URL con parámetros de query para búsqueda
            const queryParams = new URLSearchParams({
                buscar: searchParams.buscar,
                cantidadRegistros: searchParams.cantidadRegistros.toString(),
                secciones: ',prospectos,clientes'
            });

            const response = await fetch(`${this.baseUrl}/v4/sistema/buscar?${queryParams}`, {
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

    async createOpportunity(email: string, password: string, opportunityData: any): Promise<any> {
        const { token, userInfo } = await this.getTokenAndUserInfo(email, password);

        try {
            // Calcular comisionMonto automáticamente
            const comisionMonto = parseFloat(opportunityData.monto) * parseFloat(opportunityData.comision);

            // Crear fecha de cierre estimado (30 días desde hoy)
            const cierreEstimado = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

            // Valores por defecto según especificación
            const payload = {
                'cp.fechaDeEntrega': '',
                concepto: opportunityData.concepto,
                tkFase: 'OFAS-F2481C74-02F3-435D-A139-A90EDC05E2E9',
                tkLinea: 'LINP-E302A7F3-C8CD-489B-B9BF-67412CB62D37',
                tkMoneda: 'MON-ED434B3A-A165-4215-94E5-577327C2EF5E',
                monto: parseFloat(opportunityData.monto),
                tipoCambio: 1,
                comision: parseFloat(opportunityData.comision),
                comisionMonto: comisionMonto,
                cierreEstimado: cierreEstimado,
                tkCerteza: 'CER-42A55CB2-776D-49BC-9AAF-185561FBE167',
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

            const response = await fetch(`${this.baseUrl}/v4/oportunidades`, {
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
                    monto: parseFloat(opportunityData.monto),
                    comision: parseFloat(opportunityData.comision),
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

    async getPendingPayments(email: string, password: string, reportParams: any): Promise<any> {
        const { token, userInfo } = await this.getTokenAndUserInfo(email, password);

        try {
            // Construir URL con parámetros de query para cobros pendientes
            const queryParams = new URLSearchParams({
                agrupacion: reportParams.agrupacion.toString(),
                periodicidad: reportParams.periodicidad.toString()
            });

            const response = await fetch(`${this.baseUrl}/v4/reportesnv/clientes/cobrospendientes?${queryParams}`, {
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

    async createReminder(email: string, password: string, reminderData: any): Promise<any> {
        const { token, userInfo } = await this.getTokenAndUserInfo(email, password);

        try {
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

            const response = await fetch(`${this.baseUrl}/v4/agenda/recordatorios`, {
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

    async getActivityReport(email: string, password: string, params: { agrupacion: number, periodo: number }): Promise<any> {
        const { token, userInfo } = await this.getTokenAndUserInfo(email, password);
        try {
            const queryParams = new URLSearchParams({
                agrupacion: params.agrupacion.toString(),
                periodo: params.periodo.toString()
            });
            const response = await fetch(`${this.baseUrl}/v4/reportesnv/actividades/porperiodo?${queryParams}`, {
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

    async getConversionReport(email: string, password: string, params: { agrupacion: number, periodo: number, situacion: number }): Promise<any> {
        const { token, userInfo } = await this.getTokenAndUserInfo(email, password);
        try {
            const queryParams = new URLSearchParams({
                agrupacion: params.agrupacion.toString(),
                periodo: params.periodo.toString(),
                situacion: params.situacion.toString()
            });
            const response = await fetch(`${this.baseUrl}/v4/reportesnv/ventas/conversiones?${queryParams}`, {
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

const upnifyAuth = new UpnifyAuthenticator();

// Limpiar tokens expirados cada 30 minutos
setInterval(() => {
    upnifyAuth.cleanExpiredTokens();
}, 30 * 60 * 1000);

const server = new Server({
    name: 'upnify-server',
    version: '1.0.0',
}, {
    capabilities: {
        tools: {},
    },
});

// Lista de herramientas disponibles
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: 'upnify-login',
                description: 'Login to Upnify and get user information',
                inputSchema: {
                    type: 'object',
                    properties: {
                        email: {
                            type: 'string',
                            description: 'Upnify email address'
                        },
                        password: {
                            type: 'string',
                            description: 'Upnify password'
                        }
                    },
                    required: ['email', 'password']
                }
            },
            {
                name: 'create-upnify-prospect',
                description: 'Create a new prospect in Upnify CRM (requires authentication)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        // Credenciales de autenticación
                        email: {
                            type: 'string',
                            description: 'Upnify email address for authentication'
                        },
                        password: {
                            type: 'string',
                            description: 'Upnify password for authentication'
                        },
                        // Datos del prospecto
                        nombre: {
                            type: 'string',
                            description: 'First name of the prospect'
                        },
                        apellidos: {
                            type: 'string',
                            description: 'Last name of the prospect'
                        },
                        correo: {
                            type: 'string',
                            description: 'Email address of the prospect'
                        },
                        telefono: {
                            type: 'string',
                            description: 'Phone number'
                        },
                        movil: {
                            type: 'string',
                            description: 'Mobile phone number'
                        },
                        sexo: {
                            type: 'string',
                            description: 'Gender (H for male, M for female)',
                            enum: ['H', 'M']
                        },
                        puesto: {
                            type: 'string',
                            description: 'Job position'
                        },
                        empresa: {
                            type: 'string',
                            description: 'Company name'
                        },
                        ciudad: {
                            type: 'string',
                            description: 'City'
                        },
                        idPais: {
                            type: 'string',
                            description: 'Country code (e.g., MX, US)',
                            default: 'MX'
                        },
                        calle: {
                            type: 'string',
                            description: 'Street address'
                        },
                        colonia: {
                            type: 'string',
                            description: 'Neighborhood/Colony'
                        },
                        codigoPostal: {
                            type: 'string',
                            description: 'Postal code'
                        },
                        comentarios: {
                            type: 'string',
                            description: 'Additional comments about the prospect'
                        }
                    },
                    required: ['email', 'password', 'nombre', 'correo']
                }
            },
            {
                name: 'get-upnify-sales-report',
                description: 'Get sales report from Upnify with customizable grouping, period, year and tax options (requires authentication)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        // Credenciales de autenticación
                        email: {
                            type: 'string',
                            description: 'Upnify email address for authentication'
                        },
                        password: {
                            type: 'string',
                            description: 'Upnify password for authentication'
                        },
                        // Parámetros del reporte
                        agrupacion: {
                            type: 'integer',
                            description: 'Group by: 1=Executive, 2=Group, 3=Line, 17=Industry, 4=Origin, 5=Country, 6=Region',
                            enum: [1, 2, 3, 17, 4, 5, 6],
                            default: 17
                        },
                        periodicidad: {
                            type: 'integer',
                            description: 'Period: 4=Monthly, 3=Bimonthly, 2=Quarterly, 1=Semiannual, 5=Biweekly, 6=Weekly',
                            enum: [1, 2, 3, 4, 5, 6],
                            default: 6
                        },
                        anio: {
                            type: 'integer',
                            description: 'Year (2009-2025)',
                            minimum: 2009,
                            maximum: 2025,
                            default: 2025
                        },
                        impuestos: {
                            type: 'integer',
                            description: 'Taxes: 0=Exclude, 1=Include',
                            enum: [0, 1],
                            default: 0
                        }
                    },
                    required: ['email', 'password', 'agrupacion', 'periodicidad', 'anio', 'impuestos']
                }
            },
            {
                name: 'get-upnify-pending-payments',
                description: 'Get pending payments report from Upnify with customizable grouping and period options (requires authentication)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        // Credenciales de autenticación
                        email: {
                            type: 'string',
                            description: 'Upnify email address for authentication'
                        },
                        password: {
                            type: 'string',
                            description: 'Upnify password for authentication'
                        },
                        // Parámetros del reporte
                        agrupacion: {
                            type: 'integer',
                            description: 'Group by: 1=Executive, 2=Group, 3=Line, 17=Industry, 4=Origin, 5=Country, 6=Region',
                            enum: [1, 2, 3, 17, 4, 5, 6],
                            default: 1
                        },
                        periodicidad: {
                            type: 'integer',
                            description: 'Period: 4=Monthly, 3=Bimonthly, 2=Quarterly, 1=Semiannual, 5=Biweekly, 6=Weekly',
                            enum: [1, 2, 3, 4, 5, 6],
                            default: 4
                        }
                    },
                    required: ['email', 'password', 'agrupacion', 'periodicidad']
                }
            },
            {
                name: 'create-upnify-reminder',
                description: 'Create a new reminder in Upnify agenda (requires authentication)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        // Credenciales de autenticación
                        email: {
                            type: 'string',
                            description: 'Upnify email address for authentication'
                        },
                        password: {
                            type: 'string',
                            description: 'Upnify password for authentication'
                        },
                        // Datos del recordatorio
                        asunto: {
                            type: 'string',
                            description: 'Subject/title of the reminder'
                        },
                        descripcion: {
                            type: 'string',
                            description: 'Description or details of the reminder'
                        },
                        fechaInicio: {
                            type: 'string',
                            description: 'Start date and time in format YYYY-MM-DD HH:mm (e.g., "2025-07-26 05:00")'
                        }
                    },
                    required: ['email', 'password', 'asunto', 'descripcion', 'fechaInicio']
                }
            },
            {
                name: 'search-upnify-contacts',
                description: 'Search for contacts (prospects and clients) in Upnify by name, email, or phone (requires authentication)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        // Credenciales de autenticación
                        email: {
                            type: 'string',
                            description: 'Upnify email address for authentication'
                        },
                        password: {
                            type: 'string',
                            description: 'Upnify password for authentication'
                        },
                        // Parámetros de búsqueda
                        buscar: {
                            type: 'string',
                            description: 'Search term: name, email, or phone number'
                        },
                        cantidadRegistros: {
                            type: 'integer',
                            description: 'Number of records to return',
                            default: 10,
                            minimum: 1,
                            maximum: 100
                        }
                    },
                    required: ['email', 'password', 'buscar']
                }
            },
            {
                name: 'create-upnify-opportunity',
                description: 'Create a new opportunity for a prospect in Upnify CRM (requires authentication and tkProspecto from search)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        // Credenciales de autenticación
                        email: {
                            type: 'string',
                            description: 'Upnify email address for authentication'
                        },
                        password: {
                            type: 'string',
                            description: 'Upnify password for authentication'
                        },
                        // Datos de la oportunidad
                        concepto: {
                            type: 'string',
                            description: 'Opportunity concept or description'
                        },
                        tkProspecto: {
                            type: 'string',
                            description: 'Prospect token (obtained from search-upnify-contacts)'
                        },
                        monto: {
                            type: 'number',
                            description: 'Opportunity amount in currency',
                            minimum: 0
                        },
                        comision: {
                            type: 'number',
                            description: 'Commission percentage (as decimal, e.g., 0.15 for 15%)',
                            minimum: 0,
                            maximum: 1
                        }
                    },
                    required: ['email', 'password', 'concepto', 'tkProspecto', 'monto', 'comision']
                }
            },
            {
                name: 'get-upnify-activity-report',
                description: 'Get activity report from Upnify by group or executive and period (requires authentication)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        email: {
                            type: 'string',
                            description: 'Upnify email address for authentication'
                        },
                        password: {
                            type: 'string',
                            description: 'Upnify password for authentication'
                        },
                        agrupacion: {
                            type: 'integer',
                            description: 'Group by: 1=Executive, 2=Group',
                            enum: [1, 2],
                            default: 2
                        },
                        periodo: {
                            type: 'integer',
                            description: 'Period for report filtering. Options: 1=Today, 2=Yesterday, 3=Current week, 4=Last week, 5=Current month, 6=Last month, 8=Current year, 10=Last year, 13=Current semester, 14=Last semester, 17=Current quarter, 18=Last quarter.',
                            enum: [1, 2, 3, 4, 5, 6, 8, 10, 13, 14, 17, 18],
                            default: 17
                        }

                    },
                    required: ['email', 'password', 'agrupacion', 'periodo']
                }
            },
            {
                name: 'get-upnify-conversion-report',
                description: 'Get conversion report from Upnify by group, executive, origin, or region and period (requires authentication)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        email: { type: 'string', description: 'Upnify email address for authentication' },
                        password: { type: 'string', description: 'Upnify password for authentication' },
                        agrupacion: { type: 'integer', description: 'Group by: 1=Executive, 2=Group, 3=Origin, 4=Region', enum: [1, 2, 3, 4], default: 2 },
                        periodo: { type: 'integer', description: 'Period for report filtering. Options: 1=Today, 2=Yesterday, 3=Current week, 4=Last week, 5=Current month, 6=Last month, 8=Current year, 10=Last year, 13=Current semester, 14=Last semester, 17=Current quarter, 18=Last quarter.', enum: [1, 2, 3, 4, 5, 6, 8, 10, 13, 14, 17, 18], default: 5 },
                        situacion: { type: 'integer', description: 'Situation: 0=Include discarded, 1=Exclude discarded', enum: [0, 1], default: 0 }
                    },
                    required: ['email', 'password', 'agrupacion', 'periodo', 'situacion']
                }
            }
        ]
    };
});

// Manejo de llamadas a herramientas
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name === 'upnify-login') {
        const { email, password } = args as { email: string, password: string };

        try {
            const { token, userInfo } = await upnifyAuth.getTokenAndUserInfo(email, password);

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            message: 'Login exitoso a Upnify',
                            user: {
                                nombre: userInfo.nombre,
                                apellidos: userInfo.apellidos,
                                email: userInfo.email,
                                empresa: userInfo.empresa,
                                puesto: userInfo.puesto,
                                expiracion: userInfo.expiracion
                            }
                        }, null, 2)
                    }
                ]
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            error: `Error al hacer login en Upnify: ${errorMessage}`
                        }, null, 2)
                    }
                ]
            };
        }
    } else if (name === 'create-upnify-prospect') {
        const { email, password, ...prospectData } = args as any;

        if (!email || !password) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            error: 'Se requieren las credenciales de Upnify (email y password)'
                        }, null, 2)
                    }
                ]
            };
        }

        try {
            const upnifyData: any = {};

            // Campos obligatorios
            if (prospectData.nombre) upnifyData.nombre = prospectData.nombre;
            if (prospectData.correo) upnifyData.correo = prospectData.correo;

            // Campos opcionales
            if (prospectData.apellidos) upnifyData.apellidos = prospectData.apellidos;
            if (prospectData.sexo) upnifyData.sexo = prospectData.sexo;
            if (prospectData.telefono) upnifyData.telefono = prospectData.telefono;
            if (prospectData.movil) upnifyData.movil = prospectData.movil;
            if (prospectData.puesto) upnifyData.puesto = prospectData.puesto;
            if (prospectData.empresa) upnifyData.empresa = prospectData.empresa;
            if (prospectData.ciudad) upnifyData.ciudad = prospectData.ciudad;
            if (prospectData.calle) upnifyData.calle = prospectData.calle;
            if (prospectData.colonia) upnifyData.colonia = prospectData.colonia;
            if (prospectData.codigoPostal) upnifyData.codigoPostal = prospectData.codigoPostal;
            if (prospectData.comentarios) upnifyData.comentarios = prospectData.comentarios;
            if (prospectData.idPais) upnifyData.idPais = prospectData.idPais;

            // Valores por defecto
            if (!upnifyData.idPais) upnifyData.idPais = 'MX';
            if (!upnifyData.sexo) upnifyData.sexo = 'H';

            // Crear el prospecto usando el autenticador
            const result = await upnifyAuth.createProspect(email, password, upnifyData);

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            message: 'Prospecto creado exitosamente en Upnify',
                            data: result
                        }, null, 2)
                    }
                ]
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            error: `Error al crear prospecto en Upnify: ${errorMessage}`
                        }, null, 2)
                    }
                ]
            };
        }
    } else if (name === 'get-upnify-sales-report') {
        const { email, password, agrupacion, periodicidad, anio, impuestos } = args as any;

        if (!email || !password) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            error: 'Se requieren las credenciales de Upnify (email y password)'
                        }, null, 2)
                    }
                ]
            };
        }

        // Validar parámetros requeridos
        if (agrupacion === undefined || periodicidad === undefined || anio === undefined || impuestos === undefined) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            error: 'Se requieren todos los parámetros: agrupacion, periodicidad, anio, impuestos'
                        }, null, 2)
                    }
                ]
            };
        }

        try {
            const reportParams = {
                agrupacion,
                periodicidad,
                anio,
                impuestos
            };

            const result = await upnifyAuth.getSalesReport(email, password, reportParams);

            const agrupacionLabels: Record<number, string> = {
                1: 'Por ejecutivo',
                2: 'Por grupo',
                3: 'Por línea',
                17: 'Por industria',
                4: 'Por origen',
                5: 'Por país',
                6: 'Por región'
            };

            const periodicidadLabels: Record<number, string> = {
                4: 'Mensual',
                3: 'Bimestral',
                2: 'Trimestral',
                1: 'Semestral',
                5: 'Quincenal',
                6: 'Semanal'
            };

            const parametersDescription = {
                agrupacion: `${agrupacion} (${agrupacionLabels[agrupacion] || 'Desconocido'})`,
                periodicidad: `${periodicidad} (${periodicidadLabels[periodicidad] || 'Desconocido'})`,
                anio: anio,
                impuestos: impuestos === 1 ? 'Incluir' : 'Excluir'
            };

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            message: 'Reporte de ventas obtenido exitosamente',
                            parameters: parametersDescription,
                            data: result.data
                        }, null, 2)
                    }
                ]
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            error: `Error al obtener reporte de ventas de Upnify: ${errorMessage}`
                        }, null, 2)
                    }
                ]
            };
        }
    } else if (name === 'get-upnify-pending-payments') {
        const { email, password, agrupacion, periodicidad } = args as any;

        if (!email || !password) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            error: 'Se requieren las credenciales de Upnify (email y password)'
                        }, null, 2)
                    }
                ]
            };
        }

        // Validar parámetros requeridos
        if (agrupacion === undefined || periodicidad === undefined) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            error: 'Se requieren todos los parámetros: agrupacion, periodicidad'
                        }, null, 2)
                    }
                ]
            };
        }

        try {
            const reportParams = {
                agrupacion,
                periodicidad
            };

            const result = await upnifyAuth.getPendingPayments(email, password, reportParams);

            // Crear descripción amigable de los parámetros
            const agrupacionLabels: Record<number, string> = {
                1: 'Por ejecutivo',
                2: 'Por grupo',
                3: 'Por línea',
                17: 'Por industria',
                4: 'Por origen',
                5: 'Por país',
                6: 'Por región'
            };

            const periodicidadLabels: Record<number, string> = {
                4: 'Mensual',
                3: 'Bimestral',
                2: 'Trimestral',
                1: 'Semestral',
                5: 'Quincenal',
                6: 'Semanal'
            };

            const parametersDescription = {
                agrupacion: `${agrupacion} (${agrupacionLabels[agrupacion] || 'Desconocido'})`,
                periodicidad: `${periodicidad} (${periodicidadLabels[periodicidad] || 'Desconocido'})`
            };

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            message: 'Cobros pendientes obtenidos exitosamente',
                            parameters: parametersDescription,
                            total: result.total,
                            data: result.data
                        }, null, 2)
                    }
                ]
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            error: `Error al obtener cobros pendientes de Upnify: ${errorMessage}`
                        }, null, 2)
                    }
                ]
            };
        }
    } else if (name === 'search-upnify-contacts') {
        const { email, password, buscar, cantidadRegistros = 10 } = args as any;

        if (!email || !password) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            error: 'Se requieren las credenciales de Upnify (email y password)'
                        }, null, 2)
                    }
                ]
            };
        }

        if (!buscar) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            error: 'El parámetro "buscar" es obligatorio',
                            help: 'Proporciona un nombre, correo o teléfono para buscar'
                        }, null, 2)
                    }
                ]
            };
        }

        try {
            const searchParams = {
                buscar,
                cantidadRegistros
            };

            const result = await upnifyAuth.searchContacts(email, password, searchParams);

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(result, null, 2)
                    }
                ]
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            error: `Error al buscar contactos en Upnify: ${errorMessage}`
                        }, null, 2)
                    }
                ]
            };
        }
    } else if (name === 'create-upnify-opportunity') {
        const { email, password, concepto, tkProspecto, monto, comision } = args as any;

        if (!email || !password) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            error: 'Se requieren las credenciales de Upnify (email y password)'
                        }, null, 2)
                    }
                ]
            };
        }

        if (!concepto || !tkProspecto || monto === undefined || comision === undefined) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            error: 'Se requieren todos los parámetros: concepto, tkProspecto, monto, comision',
                            help: 'Usa search-upnify-contacts primero para obtener el tkProspecto'
                        }, null, 2)
                    }
                ]
            };
        }

        try {
            const opportunityData = {
                concepto,
                tkProspecto,
                monto,
                comision
            };

            const result = await upnifyAuth.createOpportunity(email, password, opportunityData);

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(result, null, 2)
                    }
                ]
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            error: `Error al crear oportunidad en Upnify: ${errorMessage}`
                        }, null, 2)
                    }
                ]
            };
        }
    } else if (name === 'create-upnify-reminder') {
        const { email, password, asunto, descripcion, fechaInicio } = args as any;
        if (!email || !password) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            error: 'Se requieren las credenciales de Upnify (email y password)'
                        }, null, 2)
                    }
                ]
            };
        }
        // Validar parámetros requeridos
        if (!asunto || !descripcion || !fechaInicio) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            error: 'Se requieren todos los parámetros: asunto, descripcion, fechaInicio'
                        }, null, 2)
                    }
                ]
            };
        }
        try {
            const reminderData = {
                asunto,
                descripcion,
                fechaInicio
            };
            const result = await upnifyAuth.createReminder(email, password, reminderData);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            message: 'Recordatorio agendado exitosamente en Upnify',
                            reminder: {
                                asunto: asunto,
                                descripcion: descripcion,
                                fechaInicio: fechaInicio
                            },
                            data: result.data
                        }, null, 2)
                    }
                ]
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            error: `Error al agendar recordatorio en Upnify: ${errorMessage}`
                        }, null, 2)
                    }
                ]
            };
        }
    } else if (name === 'get-upnify-activity-report') {
        const { email, password, agrupacion, periodo } = args as any;
        if (!email || !password) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            error: 'Se requieren las credenciales de Upnify (email y password)'
                        }, null, 2)
                    }
                ]
            };
        }
        if (agrupacion === undefined || periodo === undefined) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            error: 'Se requieren todos los parámetros: agrupacion, periodo'
                        }, null, 2)
                    }
                ]
            };
        }
        try {
            const params = { agrupacion, periodo };
            const result = await upnifyAuth.getActivityReport(email, password, params);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(result, null, 2)
                    }
                ]
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            error: `Error al obtener reporte de actividades de Upnify: ${errorMessage}`
                        }, null, 2)
                    }
                ]
            };
        }
    }
    else if (name === 'get-upnify-conversion-report') {
        const { email, password, agrupacion, periodo, situacion } = args as any;
        if (!email || !password) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            error: 'Se requieren las credenciales de Upnify (email y password)'
                        }, null, 2)
                    }
                ]
            };
        }
        if (agrupacion === undefined || periodo === undefined || situacion === undefined) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            error: 'Se requieren todos los parámetros: agrupacion, periodo, situacion'
                        }, null, 2)
                    }
                ]
            };
        }
        try {
            const params = { agrupacion, periodo, situacion };
            const result = await upnifyAuth.getConversionReport(email, password, params);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(result, null, 2)
                    }
                ]
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            error: `Error al obtener reporte de conversiones de Upnify: ${errorMessage}`
                        }, null, 2)
                    }
                ]
            };
        }
    }
    else {
        throw new Error(`Unknown tool: ${name}`);
    }
});

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Upnify MCP server running on stdio');
}

main().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
});