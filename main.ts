import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as dotenv from 'dotenv';

// Importar los handlers y utilidades
import { UpnifyAuthenticator } from './auth/upnifyAuth.js';
import { ProspectsHandler } from './handlers/prospects.js';
import { OpportunitiesHandler } from './handlers/opportunities.js';
import { ReportsHandler } from './handlers/reports.js';
import { UtilitiesHandler } from './handlers/utilities.js';
import { 
    getTkIntegracion, 
    validateReportParams, 
    validateActivityReportParams, 
    validateConversionReportParams,
    formatReportParameters,
    formatPendingPaymentsParameters,
    createErrorResponse,
    createSuccessResponse 
} from './utils/validators.js';

// Cargar variables de entorno sin logs para evitar errores de JSON en Claude Desktop
dotenv.config({ quiet: true });

// Inicializar autenticador y handlers
const upnifyAuth = new UpnifyAuthenticator();
const prospectsHandler = new ProspectsHandler(upnifyAuth);
const opportunitiesHandler = new OpportunitiesHandler(upnifyAuth);
const reportsHandler = new ReportsHandler(upnifyAuth);
const utilitiesHandler = new UtilitiesHandler(upnifyAuth);

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
                name: 'create-upnify-prospect',
                description: 'Create a new prospect in Upnify CRM',
                inputSchema: {
                    type: 'object',
                    properties: {
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
                    required: ['nombre', 'correo']
                }
            },
            {
                name: 'get-upnify-sales-report',
                description: 'Get sales report from Upnify with customizable grouping, period, year and tax options',
                inputSchema: {
                    type: 'object',
                    properties: {
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
                    required: ['agrupacion', 'periodicidad', 'anio', 'impuestos']
                }
            },
            {
                name: 'get-upnify-pending-payments',
                description: 'Get pending payments report from Upnify with customizable grouping and period options',
                inputSchema: {
                    type: 'object',
                    properties: {
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
                    required: ['agrupacion', 'periodicidad']
                }
            },
            {
                name: 'create-upnify-reminder',
                description: 'Create a new reminder in Upnify agenda',
                inputSchema: {
                    type: 'object',
                    properties: {
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
                    required: ['asunto', 'descripcion', 'fechaInicio']
                }
            },
            {
                name: 'search-upnify-contacts',
                description: 'Search for contacts (prospects and clients) in Upnify by name, email, or phone',
                inputSchema: {
                    type: 'object',
                    properties: {
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
                    required: ['buscar']
                }
            },
            {
                name: 'create-upnify-opportunity',
                description: 'Create a new opportunity for a prospect in Upnify CRM (requires tkProspecto from search)',
                inputSchema: {
                    type: 'object',
                    properties: {
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
                    required: ['concepto', 'tkProspecto', 'monto', 'comision']
                }
            },
            {
                name: 'get-upnify-activity-report',
                description: 'Get activity report from Upnify by group or executive and period',
                inputSchema: {
                    type: 'object',
                    properties: {
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
                    required: ['agrupacion', 'periodo']
                }
            },
            {
                name: 'get-upnify-conversion-report',
                description: 'Get conversion report from Upnify by group, executive, origin, or region and period',
                inputSchema: {
                    type: 'object',
                    properties: {
                        agrupacion: { 
                            type: 'integer', 
                            description: 'Group by: 1=Executive, 2=Group, 3=Origin, 4=Region', 
                            enum: [1, 2, 3, 4], 
                            default: 2 
                        },
                        periodo: { 
                            type: 'integer', 
                            description: 'Period for report filtering. Options: 1=Today, 2=Yesterday, 3=Current week, 4=Last week, 5=Current month, 6=Last month, 8=Current year, 10=Last year, 13=Current semester, 14=Last semester, 17=Current quarter, 18=Last quarter.', 
                            enum: [1, 2, 3, 4, 5, 6, 8, 10, 13, 14, 17, 18], 
                            default: 5 
                        },
                        situacion: { 
                            type: 'integer', 
                            description: 'Situation: 0=Include discarded, 1=Exclude discarded', 
                            enum: [0, 1], 
                            default: 0 
                        }
                    },
                    required: ['agrupacion', 'periodo', 'situacion']
                }
            }
        ]
    };
});

// Manejo de llamadas a herramientas
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        const tkIntegracion = getTkIntegracion(request);

        if (name === 'create-upnify-prospect') {
            const prospectData = args as any;
            try {
                const result = await prospectsHandler.createProspect(tkIntegracion, prospectData);
                return createSuccessResponse({
                    success: true,
                    message: 'Prospecto creado exitosamente en Upnify',
                    data: result
                });
            } catch (error) {
                return createErrorResponse(error, 'Error al crear prospecto en Upnify');
            }

        } else if (name === 'get-upnify-sales-report') {
            const reportParams = args as any;
            if (!validateReportParams(reportParams)) {
                return createErrorResponse(
                    new Error('Se requieren todos los parámetros: agrupacion, periodicidad, anio, impuestos'),
                    'Validación de parámetros'
                );
            }

            try {
                const result = await reportsHandler.getSalesReport(tkIntegracion, reportParams);
                const parametersDescription = formatReportParameters(reportParams);

                return createSuccessResponse({
                    success: true,
                    message: 'Reporte de ventas obtenido exitosamente',
                    parameters: parametersDescription,
                    data: result.data
                });
            } catch (error) {
                return createErrorResponse(error, 'Error al obtener reporte de ventas de Upnify');
            }

        } else if (name === 'get-upnify-pending-payments') {
            const reportParams = args as any;
            if (!reportParams.agrupacion || !reportParams.periodicidad) {
                return createErrorResponse(
                    new Error('Se requieren todos los parámetros: agrupacion, periodicidad'),
                    'Validación de parámetros'
                );
            }

            try {
                const result = await reportsHandler.getPendingPayments(tkIntegracion, reportParams);
                const parametersDescription = formatPendingPaymentsParameters(reportParams);

                return createSuccessResponse({
                    success: true,
                    message: 'Cobros pendientes obtenidos exitosamente',
                    parameters: parametersDescription,
                    total: result.total,
                    data: result.data
                });
            } catch (error) {
                return createErrorResponse(error, 'Error al obtener cobros pendientes de Upnify');
            }

        } else if (name === 'search-upnify-contacts') {
            const { buscar, cantidadRegistros = 10 } = args as any;
            if (!buscar) {
                return createErrorResponse(
                    new Error('El parámetro "buscar" es obligatorio'),
                    'Validación de parámetros'
                );
            }

            try {
                const result = await prospectsHandler.searchContacts(tkIntegracion, { buscar, cantidadRegistros });
                return createSuccessResponse(result);
            } catch (error) {
                return createErrorResponse(error, 'Error al buscar contactos en Upnify');
            }

        } else if (name === 'create-upnify-opportunity') {
            const { concepto, tkProspecto, monto, comision } = args as any;
            if (!concepto || !tkProspecto || monto === undefined || comision === undefined) {
                return createErrorResponse(
                    new Error('Se requieren todos los parámetros: concepto, tkProspecto, monto, comision'),
                    'Validación de parámetros'
                );
            }

            try {
                const result = await opportunitiesHandler.createOpportunity(tkIntegracion, { concepto, tkProspecto, monto, comision });
                return createSuccessResponse(result);
            } catch (error) {
                return createErrorResponse(error, 'Error al crear oportunidad en Upnify');
            }

        } else if (name === 'create-upnify-reminder') {
            const { asunto, descripcion, fechaInicio } = args as any;
            if (!asunto || !descripcion || !fechaInicio) {
                return createErrorResponse(
                    new Error('Se requieren todos los parámetros: asunto, descripcion, fechaInicio'),
                    'Validación de parámetros'
                );
            }

            try {
                const result = await utilitiesHandler.createReminder(tkIntegracion, { asunto, descripcion, fechaInicio });
                return createSuccessResponse({
                    success: true,
                    message: 'Recordatorio agendado exitosamente en Upnify',
                    reminder: { asunto, descripcion, fechaInicio },
                    data: result.data
                });
            } catch (error) {
                return createErrorResponse(error, 'Error al agendar recordatorio en Upnify');
            }

        } else if (name === 'get-upnify-activity-report') {
            const params = args as any;
            if (!validateActivityReportParams(params)) {
                return createErrorResponse(
                    new Error('Se requieren todos los parámetros: agrupacion, periodo'),
                    'Validación de parámetros'
                );
            }

            try {
                const result = await reportsHandler.getActivityReport(tkIntegracion, params);
                return createSuccessResponse(result);
            } catch (error) {
                return createErrorResponse(error, 'Error al obtener reporte de actividades de Upnify');
            }

        } else if (name === 'get-upnify-conversion-report') {
            const params = args as any;
            if (!validateConversionReportParams(params)) {
                return createErrorResponse(
                    new Error('Se requieren todos los parámetros: agrupacion, periodo, situacion'),
                    'Validación de parámetros'
                );
            }

            try {
                const result = await reportsHandler.getConversionReport(tkIntegracion, params);
                return createSuccessResponse(result);
            } catch (error) {
                return createErrorResponse(error, 'Error al obtener reporte de conversiones de Upnify');
            }

        } else {
            throw new Error(`Unknown tool: ${name}`);
        }
    } catch (error) {
        return createErrorResponse(error, 'Error general');
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
