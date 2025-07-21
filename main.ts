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

    async getTokenAndUserInfo(email: string, password: string): Promise<{token: string, userInfo: any}> {
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

    async createProspect(email: string, password: string, prospectData: any): Promise<any> {
        const { token, userInfo } = await this.getTokenAndUserInfo(email, password);
        
        try {
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
                tkFase: prospectData.tkFase || "PFAS-AF9C06CD-A4B2-4A68-8383-241935B40E37", 
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
    } else {
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