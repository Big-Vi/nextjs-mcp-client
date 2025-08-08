import { NextRequest, NextResponse } from 'next/server';

const DEVOPS_MCP_URL = process.env.DEVOPS_MCP_URL || 'http://localhost:3001/api/mcp';

// For HTTP-based MCP servers (like your DevOps MCP server)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'list-tools':
        const toolsResponse = await fetch(DEVOPS_MCP_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'tools/list'
          })
        });
        
        // Handle SSE response from DevOps MCP server
        const responseText = await toolsResponse.text();
        
        // Parse SSE format: "event: message\ndata: {...}"
        if (responseText.includes('data: ')) {
          const jsonData = responseText.split('data: ')[1].split('\n')[0];
          const toolsData = JSON.parse(jsonData);
          // Extract tools from JSON-RPC result and return in expected format
          return NextResponse.json({ tools: toolsData.result?.tools || [] });
        } else {
          // Fallback for JSON response
          const toolsData = JSON.parse(responseText);
          return NextResponse.json({ tools: toolsData.result?.tools || [] });
        }
        
      case 'status':
        return NextResponse.json({ 
          connected: true,
          server: 'devops-mcp-server',
          timestamp: new Date().toISOString()
        });
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('DevOps MCP API Error:', error);
    return NextResponse.json(
      { error: 'Failed to communicate with DevOps MCP server' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received request body:', body);
    
    let method, params;
    
    // Handle action-based format from UI
    if (body.action === 'call-tool') {
      method = 'tools/call';
      params = {
        name: body.toolName,
        arguments: body.arguments || {}
      };
    } else if (body.method) {
      // Handle direct JSON-RPC format
      method = body.method;
      params = body.params || {};
    } else {
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
    }
    
    console.log('Converted to JSON-RPC:', { method, params });
    
    // Forward the MCP JSON-RPC call to your DevOps MCP server
    const response = await fetch(DEVOPS_MCP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method,
        params
      })
    });
    
    // Handle SSE response from DevOps MCP server
    const responseText = await response.text();
    
    // Parse SSE format: "event: message\ndata: {...}"
    if (responseText.includes('data: ')) {
      const jsonData = responseText.split('data: ')[1].split('\n')[0];
      const data = JSON.parse(jsonData);
      return NextResponse.json(data);
    } else {
      // Fallback for JSON response
      const data = JSON.parse(responseText);
      return NextResponse.json(data);
    }
  } catch (error) {
    console.error('DevOps MCP API Error:', error);
    return NextResponse.json(
      { error: 'Failed to call DevOps MCP server' },
      { status: 500 }
    );
  }
}
