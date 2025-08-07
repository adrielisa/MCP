# Upnify MCP Server (Python)

![Python](https://img.shields.io/badge/python-3.8+-blue.svg)
![PyPI](https://img.shields.io/pypi/v/upnify-mcp-server)
![License](https://img.shields.io/badge/license-MIT-green.svg)

A Model Context Protocol (MCP) server for Upnify CRM integration, written in Python. This server provides AI assistants and LLMs with direct access to Upnify CRM functionality including prospect management, opportunity tracking, and sales reporting.

## 🚀 Features

- **Prospect Management**: Create and search prospects in Upnify CRM
- **Contact Search**: Find contacts by name, email, or phone number
- **Reminder Management**: Create calendar reminders and tasks
- **Sales Reports**: Access sales data and analytics
- **Activity Reports**: Track team activity and performance
- **Easy Integration**: Compatible with Claude Desktop, Open-LLM-VTuber, and other MCP clients

## 📦 Installation

### From PyPI

```bash
pip install upnify-mcp-server
```

### From Source

```bash
git clone https://github.com/adrielisa/MCP.git
cd MCP/python-package
pip install -e .
```

## 🔧 Configuration

### Environment Variables

Set your Upnify integration token as an environment variable:

```bash
export TK_INTEGRACION="your-upnify-integration-token"
```

Or create a `.env` file:

```env
TK_INTEGRACION=your-upnify-integration-token
```

### Claude Desktop Configuration

Add to your Claude Desktop configuration file:

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "upnify": {
      "command": "upnify-mcp-server",
      "env": {
        "TK_INTEGRACION": "your-upnify-integration-token"
      }
    }
  }
}
```

## 🛠️ Usage

### Command Line

Start the server directly:

```bash
upnify-mcp-server
```

### Available Tools

The server provides these tools for AI assistants:

#### 1. Create Prospect
```python
{
  "name": "create-upnify-prospect",
  "arguments": {
    "nombre": "John",
    "apellidos": "Doe", 
    "correo": "john.doe@example.com",
    "telefono": "+1234567890",
    "empresa": "Acme Corp"
  }
}
```

#### 2. Search Contacts
```python
{
  "name": "search-upnify-contacts",
  "arguments": {
    "buscar": "john.doe@example.com",
    "cantidadRegistros": 10
  }
}
```

#### 3. Create Reminder
```python
{
  "name": "create-upnify-reminder",
  "arguments": {
    "asunto": "Follow up with John Doe",
    "descripcion": "Call to discuss proposal",
    "fechaInicio": "2025-08-07 10:00"
  }
}
```

## 🔌 Integration Examples

### With Open-LLM-VTuber

Add to your `conf.yaml`:

```yaml
tool_config:
  mcp_servers:
    upnify:
      command: ["upnify-mcp-server"]
      env:
        TK_INTEGRACION: "your-token-here"
```

### With Custom Python Code

```python
import asyncio
from mcp.client.session import ClientSession
from mcp.client.stdio import stdio_client

async def use_upnify_mcp():
    async with stdio_client(["upnify-mcp-server"]) as (read, write):
        async with ClientSession(read, write) as session:
            # Initialize
            await session.initialize()
            
            # List available tools
            tools = await session.list_tools()
            print(f"Available tools: {len(tools.tools)}")
            
            # Create a prospect
            result = await session.call_tool(
                "create-upnify-prospect",
                {
                    "nombre": "Jane",
                    "correo": "jane@example.com"
                }
            )
            print(f"Result: {result}")

# Run the example
asyncio.run(use_upnify_mcp())
```

## 📋 Requirements

- Python 3.8+
- Upnify CRM account with API access
- Integration token from Upnify

## 🔒 Security

- Never hardcode your integration token in scripts
- Use environment variables or secure credential management
- Validate all input data before sending to Upnify API
- Monitor API usage and rate limits

## 🐛 Troubleshooting

### Common Issues

**1. Authentication Errors**
```bash
Error: Token de integración inválido
```
- Verify your `TK_INTEGRACION` environment variable
- Check that your token hasn't expired
- Contact Upnify support for token issues

**2. Connection Timeouts**
```bash
Error: Timeout connecting to Upnify API
```
- Check your internet connection
- Verify Upnify API status
- Increase timeout values if needed

**3. Permission Errors**
```bash
Error: Access denied for resource
```
- Verify your Upnify account permissions
- Check that your integration token has the required scopes

### Debug Mode

Run with debug logging:

```bash
export UPNIFY_DEBUG=1
upnify-mcp-server
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Related Projects

- [Upnify CRM](https://upnify.com) - Customer Relationship Management platform
- [Model Context Protocol](https://modelcontextprotocol.io) - Open standard for AI-application integration
- [Claude Desktop](https://claude.ai/desktop) - AI assistant with MCP support

## 📞 Support

- 📧 Email: tu-email@ejemplo.com
- 🐛 Issues: [GitHub Issues](https://github.com/adrielisa/MCP/issues)
- 📖 Documentation: [GitHub Wiki](https://github.com/adrielisa/MCP/wiki)

---

**Made with ❤️ for the AI and CRM community**
