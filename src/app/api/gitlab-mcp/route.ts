import { NextRequest, NextResponse } from 'next/server';

// For HTTP-based MCP servers (like your GitLab MCP in Docker)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    // Your GitLab MCP server URL (adjust based on your setup)
    const mcpServerUrl = process.env.GITLAB_MCP_URL || 'http://127.0.0.1:3333/mcp';

    switch (action) {
      case 'list-tools':
        const toolsResponse = await fetch(`${mcpServerUrl}`, {
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
        
        const toolsData = await toolsResponse.json();
        return NextResponse.json(toolsData);
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('GitLab MCP API Error:', error);
    return NextResponse.json(
      { error: 'Failed to communicate with GitLab MCP server' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { method, params } = body;
    
    const mcpServerUrl = process.env.GITLAB_MCP_URL || 'http://localhost:9000/mcp';
    
    // Forward the MCP JSON-RPC call to your GitLab MCP server
    const response = await fetch(mcpServerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add any required headers for your GitLab MCP server
        ...(process.env.GITLAB_TOKEN && {
          'Authorization': `Bearer ${process.env.GITLAB_TOKEN}`
        })
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method,
        params
      })
    });
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('GitLab MCP API Error:', error);
    return NextResponse.json(
      { error: 'Failed to call GitLab MCP server' },
      { status: 500 }
    );
  }
}
