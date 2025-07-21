import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server({
    name: 'weather-server',
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
                name: 'fetch-weather',
                description: 'Tool to fetch weather data for a city',
                inputSchema: {
                    type: 'object',
                    properties: {
                        city: {
                            type: 'string',
                            description: 'City name to fetch weather for'
                        }
                    },
                    required: ['city']
                }
            }
        ]
    };
});

// Manejo de llamadas a herramientas
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    
    if (name === 'fetch-weather') {
        const { city } = args as { city: string };
        
        try {
            // Paso 1: Obtener coordenadas de la ciudad
            const geocodingResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
            const geocodingData = await geocodingResponse.json();
            
            if (!geocodingData.results || geocodingData.results.length === 0) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `No se pudo encontrar la ciudad: ${city}. Por favor, verifica el nombre de la ciudad.`
                        }
                    ]
                };
            }
            
            const location = geocodingData.results[0];
            const { latitude, longitude, name: locationName, country } = location;
            
            // Paso 2: Obtener datos del clima
            const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,precipitation,weather_code,is_day&timezone=auto`);
            const weatherData = await weatherResponse.json();
            
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(weatherData, null, 2)
                    }
                ]
            };
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            return {
                content: [
                    {
                        type: 'text',
                        text: `❌ Error al obtener el clima para ${city}: ${errorMessage}`
                    }
                ]
            };
        }
    } else {
        throw new Error(`Unknown tool: ${name}`);
    }
});

// Iniciar el servidor
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Weather MCP server running on stdio');
}

main().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
});