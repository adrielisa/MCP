"""
Upnify authentication and API client
"""

import os
import httpx
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from .constants import API_URLS, ENDPOINTS, DEFAULTS


class UpnifyAuthenticator:
    """Handles authentication and API communication with Upnify"""
    
    def __init__(self):
        self.token_cache = {}
    
    def _get_tk_integracion(self) -> str:
        """Get integration token from environment or fallback"""
        # Try environment variable first
        tk_integracion = os.getenv("TK_INTEGRACION")
        
        if tk_integracion:
            print(f"🔑 Using TK_INTEGRACION from environment")
            return tk_integracion
        
        # Fallback to hardcoded token for development
        fallback_token = "P074243F238-9BD5-4EA1-8DD9-D05E890EA024"
        print(f"🔑 Using fallback TK_INTEGRACION")
        return fallback_token
    
    def _get_cache_key(self, tk_integracion: str) -> str:
        """Generate cache key for token"""
        return tk_integracion
    
    async def get_token_and_user_info(self, tk_integracion: Optional[str] = None) -> Dict[str, Any]:
        """Get authentication token and user info"""
        if tk_integracion is None:
            tk_integracion = self._get_tk_integracion()
        
        cache_key = self._get_cache_key(tk_integracion)
        
        # Check cache
        cached = self.token_cache.get(cache_key)
        if cached and datetime.now() < cached["expiry"]:
            return {"token": cached["token"], "userInfo": cached["userInfo"]}
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{API_URLS['SALESUP_BASE']}{ENDPOINTS['LOGIN']}",
                    headers={
                        "Content-Type": "application/json",
                        "token": tk_integracion
                    },
                    json={}
                )
                
                if not response.is_success:
                    raise Exception(f"Error en login con tkIntegracion: {response.status_code} {response.text}")
                
                data = response.json()
                
                if not data or len(data) == 0:
                    raise Exception("Token de integración inválido o respuesta inesperada del servidor")
                
                user_info = data[0]
                if not user_info.get("token"):
                    raise Exception("Token de sesión no recibido")
                
                # Cache the token
                expiry = datetime.now() + timedelta(hours=DEFAULTS["CACHE_EXPIRY_HOURS"])
                self.token_cache[cache_key] = {
                    "token": user_info["token"],
                    "expiry": expiry,
                    "userInfo": user_info
                }
                
                return {"token": user_info["token"], "userInfo": user_info}
                
            except Exception as error:
                raise Exception(f"Error al autenticarse con Upnify usando tkIntegracion: {str(error)}")
    
    async def get_prospect_phases(self, tk_integracion: Optional[str] = None) -> list:
        """Get prospect phases catalog"""
        auth_info = await self.get_token_and_user_info(tk_integracion)
        token = auth_info["token"]
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{API_URLS['UPNIFY_BASE']}{ENDPOINTS['PHASES']}",
                    headers={
                        "token": token,
                        "Content-Type": "application/json"
                    },
                    params={"entidad": "0"}
                )
                
                if not response.is_success:
                    raise Exception(f"Error al obtener catálogo de fases: {response.status_code} {response.text}")
                
                return response.json()
                
            except Exception as error:
                raise Exception(f"Error al obtener catálogo de fases de Upnify: {str(error)}")
    
    def clean_expired_tokens(self):
        """Clean expired tokens from cache"""
        now = datetime.now()
        expired_keys = [key for key, value in self.token_cache.items() if value["expiry"] <= now]
        for key in expired_keys:
            del self.token_cache[key]
