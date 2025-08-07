"""
Test script for Upnify MCP Server (Python)
"""

import asyncio
import os
import sys
from mcp.client.session import ClientSession
from mcp.client.stdio import stdio_client


async def test_mcp_server():
    """Test the MCP server functionality"""
    
    print("🧪 Testing Upnify MCP Server (Python)...")
    
    # Start MCP server
    try:
        async with stdio_client(["python", "-m", "upnify_mcp_server.main"]) as (read, write):
            async with ClientSession(read, write) as session:
                print("✅ MCP server started successfully")
                
                # Initialize session
                await session.initialize()
                print("✅ Session initialized")
                
                # List tools
                tools_result = await session.list_tools()
                tools = tools_result.tools
                print(f"✅ Found {len(tools)} tools:")
                
                for tool in tools:
                    print(f"   - {tool.name}: {tool.description}")
                
                # Test search contacts
                print("\n🔍 Testing contact search...")
                search_result = await session.call_tool(
                    "search-upnify-contacts",
                    {"buscar": "test@example.com", "cantidadRegistros": 5}
                )
                print(f"✅ Search completed: {search_result}")
                
                print("\n🎉 All tests passed!")
                
    except Exception as error:
        print(f"❌ Test failed: {error}")
        return False
    
    return True


async def main():
    """Main test function"""
    success = await test_mcp_server()
    
    if success:
        print("\n✅ Upnify MCP Server (Python) is working correctly!")
        sys.exit(0)
    else:
        print("\n❌ Tests failed!")
        sys.exit(1)


if __name__ == "__main__":
    # Set test environment
    os.environ.setdefault("TK_INTEGRACION", "test-token")
    
    asyncio.run(main())
