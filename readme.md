# @upnify/mcp-server

A Model Context Protocol (MCP) server for Upnify CRM integration. This server provides AI assistants with the ability to interact with Upnify CRM to manage prospects, opportunities, reports, and reminders.

## Features

- 📊 **Sales Reports** - Get detailed sales analytics
- 👥 **Prospect Management** - Create and search prospects
- 💼 **Opportunity Tracking** - Manage sales opportunities
- 📅 **Reminders** - Schedule and manage reminders
- 🔐 **Secure Authentication** - Token-based authentication with Upnify
- ⚡ **Smart Caching** - Automatic token caching for performance

## Installation

```bash
# Install globally
npm install -g @upnify/mcp-server

# Or use with uvx (recommended)
uvx @upnify/mcp-server
```

## Configuration

Add to your MCP client configuration (e.g., Claude Desktop):

```json
{
  "mcpServers": {
    "upnify": {
      "command": "uvx",
      "args": ["@upnify/mcp-server"],
      "env": {
        "TK_INTEGRACION": "your-upnify-integration-token"
      }
    }
  }
}
```

## Environment Variables

- `TK_INTEGRACION` (required): Your Upnify integration token

## Available Tools

### 📊 Reports
- `get-upnify-sales-report` - Get sales reports with customizable grouping and periods
- `get-upnify-pending-payments` - Get pending payments report
- `get-upnify-activity-report` - Get activity reports by period
- `get-upnify-conversion-report` - Get conversion reports

### 👥 Prospects
- `create-upnify-prospect` - Create new prospects in Upnify CRM
- `search-upnify-contacts` - Search existing contacts and prospects

### 💼 Opportunities
- `create-upnify-opportunity` - Create new sales opportunities

### 📅 Utilities
- `create-upnify-reminder` - Schedule reminders in Upnify

## Usage Examples

### Get Sales Report
```
Get me a sales report for this year grouped by industry
```

### Create Prospect
```
Create a prospect: Name "John Doe", Email "john@example.com", Company "Acme Corp"
```

### Search Contacts
```
Search for contacts with email containing "@gmail.com"
```

## Development

```bash
# Clone the repository
git clone https://github.com/adrielisa/MCP.git
cd MCP

# Install dependencies
npm install

# Build
npm run build

# Test locally
npx tsx main.ts
```

## Requirements

- Node.js 18+
- Upnify CRM account with integration token

## License

MIT

## Support

For issues and questions, please visit [GitHub Issues](https://github.com/adrielisa/MCP/issues).