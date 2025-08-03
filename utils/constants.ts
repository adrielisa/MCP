// URLs de la API
export const API_URLS = {
    UPNIFY_BASE: 'https://api.upnify.com',
    SALESUP_BASE: 'https://api.salesup.com'
} as const;

// Endpoints específicos
export const ENDPOINTS = {
    LOGIN: '/integraciones/sesion',
    PROSPECTS: '/v4/prospectos',
    OPPORTUNITIES: '/v4/oportunidades',
    PHASES: '/catalogos/fases',
    SEARCH: '/v4/sistema/buscar',
    REMINDERS: '/v4/agenda/recordatorios',
    REPORTS: {
        SALES: '/v4/reportesnv/ventas/realizadas',
        PENDING_PAYMENTS: '/v4/reportesnv/clientes/cobrospendientes',
        ACTIVITIES: '/v4/reportesnv/actividades/porperiodo',
        CONVERSIONS: '/v4/reportesnv/ventas/conversiones'
    }
} as const;

// Valores por defecto
export const DEFAULTS = {
    COUNTRY: 'MX',
    GENDER: 'H',
    PHONE_PREFIX: '+52',
    CACHE_EXPIRY_HOURS: 2,
    SEARCH_RECORDS: 10,
    SEARCH_SECTIONS: ',prospectos,clientes'
} as const;

// Tokens y IDs por defecto para Upnify
export const UPNIFY_DEFAULTS = {
    TK_FASE: 'PFAS-AF9C06CD-A4B2-4A68-8383-241935B40E37',
    TK_FASE_OPPORTUNITY: 'OFAS-F2481C74-02F3-435D-A139-A90EDC05E2E9',
    TK_LINEA: 'LINP-E302A7F3-C8CD-489B-B9BF-67412CB62D37',
    TK_MONEDA: 'MON-ED434B3A-A165-4215-94E5-577327C2EF5E',
    TK_CERTEZA: 'CER-42A55CB2-776D-49BC-9AAF-185561FBE167'
} as const;

// Labels para reportes
export const REPORT_LABELS = {
    AGRUPACION: {
        1: 'Por ejecutivo',
        2: 'Por grupo',
        3: 'Por línea',
        17: 'Por industria',
        4: 'Por origen',
        5: 'Por país',
        6: 'Por región'
    },
    PERIODICIDAD: {
        1: 'Semestral',
        2: 'Trimestral',
        3: 'Bimestral',
        4: 'Mensual',
        5: 'Quincenal',
        6: 'Semanal'
    },
    PERIODO: {
        1: 'Today',
        2: 'Yesterday',
        3: 'Current week',
        4: 'Last week',
        5: 'Current month',
        6: 'Last month',
        8: 'Current year',
        10: 'Last year',
        13: 'Current semester',
        14: 'Last semester',
        17: 'Current quarter',
        18: 'Last quarter'
    }
} as const;
