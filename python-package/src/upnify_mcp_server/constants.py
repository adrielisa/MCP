"""
Constants for Upnify MCP Server
"""

# API URLs
API_URLS = {
    "SALESUP_BASE": "https://api.salesup.com/v2/salesup",
    "UPNIFY_BASE": "https://api.upnify.com/v2"
}

# Endpoints
ENDPOINTS = {
    "LOGIN": "/login",
    "PROSPECTS": "/catalogos/prospectos",
    "PHASES": "/catalogos/fases",
    "SEARCH_CONTACTS": "/prospectos/buscar",
    "CREATE_PROSPECT": "/prospectos",
    "CREATE_OPPORTUNITY": "/oportunidades",
    "CREATE_REMINDER": "/calendario/recordatorios",
    "REPORTS_SALES": "/reportes/ventas",
    "REPORTS_PENDING": "/reportes/cobranza/pendientes",
    "REPORTS_ACTIVITY": "/reportes/actividad",
    "REPORTS_CONVERSION": "/reportes/conversion"
}

# Default values
DEFAULTS = {
    "CACHE_EXPIRY_HOURS": 2,
    "MAX_SEARCH_RESULTS": 100,
    "DEFAULT_COUNTRY": "MX"
}

# Upnify specific defaults
UPNIFY_DEFAULTS = {
    "PHASE_ENTIDAD": "0",
    "DEFAULT_AGRUPACION": 17,
    "DEFAULT_PERIODICIDAD": 6,
    "DEFAULT_YEAR": 2025,
    "DEFAULT_TAXES": 0
}
