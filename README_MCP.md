# Weather MCP Server

Este es un servidor MCP (Model Context Protocol) que proporciona herramientas para obtener información meteorológica.

## Instalación y Configuración

### 1. Instalar dependencias
```bash
pnpm install
```

### 2. Compilar el proyecto
```bash
pnpm build
```

### 3. Configurar en Claude Desktop

Agrega la siguiente configuración a tu archivo `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "weather-server": {
      "command": "node",
      "args": ["./dist/main.js"],
      "cwd": "c:\\Users\\danie\\Desktop\\Programacion\\Trabajo\\MPC"
    }
  }
}
```

### 4. Reiniciar Claude Desktop

Después de agregar la configuración, reinicia Claude Desktop para que reconozca el nuevo servidor.

## Herramientas Disponibles

- **fetch-weather**: Obtiene información meteorológica para una ciudad específica

## Uso

Una vez configurado, podrás usar la herramienta `fetch-weather` en las conversaciones con Claude, proporcionando el nombre de una ciudad como parámetro.
