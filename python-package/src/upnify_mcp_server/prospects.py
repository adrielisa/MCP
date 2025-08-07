"""
Prospects handler for Upnify MCP Server
"""

import httpx
from typing import Dict, Any, Optional
from .constants import API_URLS, ENDPOINTS, DEFAULTS
from .auth import UpnifyAuthenticator


class ProspectsHandler:
    """Handles prospects-related operations"""
    
    def __init__(self, authenticator: UpnifyAuthenticator):
        self.auth = authenticator
    
    async def create_prospect(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new prospect in Upnify"""
        auth_info = await self.auth.get_token_and_user_info()
        token = auth_info["token"]
        
        # Validate required fields
        if not data.get("nombre") or not data.get("correo"):
            raise ValueError("Los campos 'nombre' y 'correo' son obligatorios")
        
        # Prepare prospect data
        prospect_data = {
            "nombre": data["nombre"],
            "apellidos": data.get("apellidos", ""),
            "correo": data["correo"],
            "telefono": data.get("telefono", ""),
            "movil": data.get("movil", ""),
            "sexo": data.get("sexo", "H"),
            "puesto": data.get("puesto", ""),
            "empresa": data.get("empresa", ""),
            "ciudad": data.get("ciudad", ""),
            "idPais": data.get("idPais", DEFAULTS["DEFAULT_COUNTRY"]),
            "calle": data.get("calle", ""),
            "colonia": data.get("colonia", ""),
            "codigoPostal": data.get("codigoPostal", ""),
            "comentarios": data.get("comentarios", "")
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{API_URLS['UPNIFY_BASE']}{ENDPOINTS['CREATE_PROSPECT']}",
                    headers={
                        "token": token,
                        "Content-Type": "application/json"
                    },
                    json=prospect_data
                )
                
                if not response.is_success:
                    error_text = response.text
                    raise Exception(f"Error al crear prospecto: {response.status_code} {response.reason_phrase}. {error_text}")
                
                result = response.json()
                return {
                    "success": True,
                    "message": "Prospecto creado exitosamente",
                    "data": result
                }
                
            except Exception as error:
                return {
                    "success": False,
                    "error": f"Error al crear prospecto en Upnify: {str(error)}"
                }
    
    async def search_contacts(self, search_term: str, limit: int = 10) -> Dict[str, Any]:
        """Search for contacts (prospects and clients)"""
        auth_info = await self.auth.get_token_and_user_info()
        token = auth_info["token"]
        
        if not search_term:
            raise ValueError("El término de búsqueda es obligatorio")
        
        if limit > DEFAULTS["MAX_SEARCH_RESULTS"]:
            limit = DEFAULTS["MAX_SEARCH_RESULTS"]
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{API_URLS['UPNIFY_BASE']}{ENDPOINTS['SEARCH_CONTACTS']}",
                    headers={
                        "token": token,
                        "Content-Type": "application/json"
                    },
                    params={
                        "buscar": search_term,
                        "cantidadRegistros": limit
                    }
                )
                
                if not response.is_success:
                    error_text = response.text
                    raise Exception(f"Error en búsqueda: {response.status_code} {response.reason_phrase}. {error_text}")
                
                contacts = response.json()
                
                return {
                    "success": True,
                    "message": f"Búsqueda completada. {len(contacts)} resultados encontrados",
                    "contacts": contacts,
                    "searchTerm": search_term,
                    "totalResults": len(contacts)
                }
                
            except Exception as error:
                return {
                    "success": False,
                    "error": f"Error al buscar contactos en Upnify: {str(error)}"
                }
