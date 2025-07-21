# MCP Server: Weather & Upnify Integration

Este servidor MCP (Model Context Protocol) proporciona herramientas para consultar el clima y gestionar prospectos en Upnify CRM con autenticación dinámica.

## Características

- 🌤️ Consulta del clima para cualquier ciudad del mundo
- 👥 Creación de prospectos en Upnify CRM
- 🔐 Autenticación dinámica (sin necesidad de configurar credenciales previamente)
- 🔄 Cache inteligente de tokens para evitar logins repetitivos
- 🛡️ Manejo seguro de credenciales

## Herramientas Disponibles

### 1. `fetch-weather`
Obtiene información meteorológica de una ciudad.

**Parámetros:**
- `city` (string, requerido): Nombre de la ciudad

**Ejemplo de uso:**
```
¿Cuál es el clima en Berlin?
```

### 2. `upnify-login`
Realiza login en Upnify y verifica las credenciales.

**Parámetros:**
- `email` (string, requerido): Email de Upnify
- `password` (string, requerido): Contraseña de Upnify

**Ejemplo de uso:**
```
Haz login en Upnify con email: tu-email@ejemplo.com y password: tu-contraseña
```

### 3. `create-upnify-prospect`
Crea un nuevo prospecto en Upnify CRM.

**Parámetros requeridos:**
- `email` (string): Email de Upnify para autenticación
- `password` (string): Contraseña de Upnify para autenticación
- `nombre` (string): Nombre del prospecto
- `correo` (string): Email del prospecto

**Parámetros opcionales:**
- `apellidos` (string): Apellidos
- `sexo` (string): Género ('H' o 'M')
- `telefono` (string): Teléfono fijo
- `movil` (string): Teléfono móvil
- `puesto` (string): Puesto de trabajo
- `empresa` (string): Nombre de la empresa
- `ciudad` (string): Ciudad
- `calle` (string): Dirección
- `colonia` (string): Colonia/barrio
- `codigoPostal` (string): Código postal
- `comentarios` (string): Comentarios adicionales
- `idPais` (string): Código de país (por defecto: 'MX')

**Ejemplo de uso:**
```
Crea un prospecto en Upnify con mis credenciales email: mi-email@upnify.com, password: mi-contraseña.
Los datos del prospecto son: nombre: "Juan Pérez", correo: "juan@ejemplo.com", telefono: "5555551234"
```

## Pruebas y Desarrollo

Para abrir el inspector y hacer pruebas de MCP:
```bash
npx -y @modelcontextprotocol/inspector npx -y tsx main.ts
```

## Configuración

### Instalación

```bash
npm install
```

### Configuración en Claude Desktop

Actualiza tu archivo `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "weather-upnify": {
      "command": "node",
      "args": ["path/to/your/main.ts"],
      "env": {}
    }
  }
}
```

### Construcción

```bash
npm run build
```

## Seguridad y Cache

### Cache de Tokens
- Los tokens se almacenan temporalmente en memoria para evitar logins repetitivos
- Se limpian automáticamente cuando expiran
- Cada usuario/contraseña tiene su propio cache independiente

### Manejo de Credenciales
- Las credenciales se envían directamente con cada solicitud
- No se almacenan de forma permanente
- Se validan en cada uso contra la API de Upnify

### Limpieza Automática
- Los tokens expirados se limpian cada 30 minutos automáticamente

## Ejemplo de Flujo de Trabajo

1. **Login inicial:**
   ```
   Usuario: "Haz login en Upnify con email: adriel.upnify@gmail.com y password: MiContraseña123"
   IA: "Login exitoso. Usuario: Adriel Rodriguez - Super Servicios"
   ```

2. **Crear prospecto:**
   ```
   Usuario: "Crea un prospecto con mis credenciales de Upnify. Nombre: Ana García, email: ana@empresa.com, teléfono: 5551234567"
   IA: "Prospecto Ana García creado exitosamente en Upnify"
   ```

3. **Consultar clima:**
   ```
   Usuario: "¿Cómo está el clima en Cancún?"
   IA: "El clima en Cancún es soleado con 28°C..."
   ```

## Manejo de Errores

El servidor maneja varios tipos de errores:
- **Credenciales inválidas**: Mensaje claro sobre error de autenticación
- **Campos faltantes**: Indicación de qué campos son requeridos
- **Errores de API**: Información detallada sobre problemas de conexión
- **Tokens expirados**: Renovación automática transparente

## Desarrollo

Para modificar o extender el servidor:

1. Edita `main.ts`
2. Añade nuevas herramientas en `ListToolsRequestSchema`
3. Implementa la lógica en `CallToolRequestSchema`
4. Reconstruye con `npm run build`
5. Reinicia Claude Desktop para ver los cambios

## API de Upnify

Este MCP utiliza la API v4 de Upnify:
- **Login**: `POST /v4/login`
- **Crear Prospecto**: `POST /v4/prospectos`

Para más información sobre la API de Upnify, consulta su documentación oficial.