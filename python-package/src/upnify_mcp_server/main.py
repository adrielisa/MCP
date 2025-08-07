"""
Main entry point for Upnify MCP Server
"""

import asyncio
import os
from typing import Any, Sequence
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import (
    CallToolRequest,
    CallToolResult,
    ListToolsRequest,
    ListToolsResult,
    Tool,
    TextContent,
)

from .auth import UpnifyAuthenticator
from .prospects import ProspectsHandler
from .constants import API_URLS, ENDPOINTS


# Initialize components
authenticator = UpnifyAuthenticator()
prospects_handler = ProspectsHandler(authenticator)

# Create MCP server
server = Server("upnify-mcp-server")


@server.list_tools()
async def list_tools() -> list[Tool]:
    """List available tools"""
    return [
        Tool(
            name="create-upnify-prospect",
            description="Create a new prospect in Upnify CRM",
            inputSchema={
                "type": "object",
                "properties": {
                    "nombre": {"type": "string", "description": "First name of the prospect"},
                    "apellidos": {"type": "string", "description": "Last name of the prospect"},
                    "correo": {"type": "string", "description": "Email address of the prospect"},
                    "telefono": {"type": "string", "description": "Phone number"},
                    "movil": {"type": "string", "description": "Mobile phone number"},
                    "sexo": {"type": "string", "description": "Gender (H for male, M for female)", "enum": ["H", "M"]},
                    "puesto": {"type": "string", "description": "Job position"},
                    "empresa": {"type": "string", "description": "Company name"},
                    "ciudad": {"type": "string", "description": "City"},
                    "idPais": {"type": "string", "description": "Country code (e.g., MX, US)", "default": "MX"},
                    "calle": {"type": "string", "description": "Street address"},
                    "colonia": {"type": "string", "description": "Neighborhood/Colony"},
                    "codigoPostal": {"type": "string", "description": "Postal code"},
                    "comentarios": {"type": "string", "description": "Additional comments about the prospect"}
                },
                "required": ["nombre", "correo"]
            }
        ),
        Tool(
            name="search-upnify-contacts",
            description="Search for contacts (prospects and clients) in Upnify by name, email, or phone",
            inputSchema={
                "type": "object",
                "properties": {
                    "buscar": {"type": "string", "description": "Search term: name, email, or phone number"},
                    "cantidadRegistros": {"type": "integer", "description": "Number of records to return", "default": 10, "minimum": 1, "maximum": 100}
                },
                "required": ["buscar"]
            }
        ),
        Tool(
            name="create-upnify-reminder",
            description="Create a new reminder in Upnify agenda",
            inputSchema={
                "type": "object",
                "properties": {
                    "asunto": {"type": "string", "description": "Subject/title of the reminder"},
                    "descripcion": {"type": "string", "description": "Description or details of the reminder"},
                    "fechaInicio": {"type": "string", "description": "Start date and time in format YYYY-MM-DD HH:mm (e.g., \"2025-07-26 05:00\")"}
                },
                "required": ["asunto", "descripcion", "fechaInicio"]
            }
        )
    ]


@server.call_tool()
async def call_tool(name: str, arguments: dict[str, Any]) -> list[TextContent]:
    """Handle tool calls"""
    
    try:
        if name == "create-upnify-prospect":
            result = await prospects_handler.create_prospect(arguments)
            return [TextContent(type="text", text=str(result))]
            
        elif name == "search-upnify-contacts":
            search_term = arguments.get("buscar")
            limit = arguments.get("cantidadRegistros", 10)
            result = await prospects_handler.search_contacts(search_term, limit)
            return [TextContent(type="text", text=str(result))]
            
        elif name == "create-upnify-reminder":
            # TODO: Implement reminder creation
            return [TextContent(type="text", text="Reminder creation not yet implemented")]
            
        else:
            raise ValueError(f"Unknown tool: {name}")
            
    except Exception as error:
        error_msg = f"Error executing tool '{name}': {str(error)}"
        return [TextContent(type="text", text=error_msg)]


def main():
    """Main entry point"""
    print("🚀 Starting Upnify MCP Server (Python)...")
    
    # Load environment variables
    try:
        from dotenv import load_dotenv
        load_dotenv(verbose=False)
    except ImportError:
        pass  # dotenv is optional
    
    # Start server
    async def run_server():
        async with stdio_server(server) as (read_stream, write_stream):
            await server.run(
                read_stream,
                write_stream,
                server.create_initialization_options()
            )
    
    asyncio.run(run_server())


if __name__ == "__main__":
    main()
