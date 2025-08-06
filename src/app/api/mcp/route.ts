import { NextRequest, NextResponse } from 'next/server';

// Store initialization state and session ID
let isInitialized = false;
let sessionId: string | null = null;
let initPromise: Promise<void> | null = null;

function resetConnection() {
  /**
   * Reset the MCP connection state
   */
  console.log('Resetting MCP connection state...');
  isInitialized = false;
  sessionId = null;
  initPromise = null;
}

async function initializeMCPServer(mcpServerUrl: string, headers: Record<string, string>) {
  if (isInitialized && sessionId) return;
  
  if (initPromise) {
    await initPromise;
    return;
  }

  initPromise = (async () => {
    try {
      // Step 1: Initialize
      const initResponse = await fetch(mcpServerUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 0,
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: {
              name: 'nextjs-mcp-client',
              version: '1.0.0'
            }
          }
        })
      });

      if (!initResponse.ok) {
        throw new Error(`Failed to initialize: ${initResponse.status} ${initResponse.statusText}`);
      }

      // Extract session ID from headers
      sessionId = initResponse.headers.get('mcp-session-id');
      console.log('MCP Session ID:', sessionId);

      // Handle SSE response
      const responseText = await initResponse.text();
      
      // Parse SSE format: "event: message\ndata: {...}"
      const lines = responseText.split('\n');
      console.log('MCP Initialization Response:', lines);
      let jsonData = '';
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          jsonData = line.substring(6); // Remove "data: " prefix
          break;
        }
      }
      console.log('Parsed JSON Data:', jsonData);

      if (jsonData) {
        const data = JSON.parse(jsonData);
        if (data.error) {
          throw new Error(`MCP Initialize Error: ${data.error.message}`);
        }
      } else {
        throw new Error('Invalid SSE response format');
      }
      console.log(headers);

      // Step 2: Send initialized notification with session ID
      const notifyHeaders = {
        ...headers,
        ...(sessionId && { 'mcp-session-id': sessionId })
      };
      console.log('Notify Headers:', notifyHeaders);

      const notifyResponse = await fetch(mcpServerUrl, {
        method: 'POST',
        headers: notifyHeaders,
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'notifications/initialized'
        })
      });

      if (!notifyResponse.ok) {
        console.warn(`Failed to send initialized notification: ${notifyResponse.status}`);
        // Don't throw here, as some servers might not require this
      }

      isInitialized = true;
      console.log('MCP Server initialized successfully with session:', sessionId);
    } catch (error) {
      console.error('MCP initialization failed:', error);
      isInitialized = false;
      sessionId = null;
      throw error;
    } finally {
      initPromise = null;
    }
  })();

  await initPromise;
}

async function makeMCPRequest(method: string, params: any = {}) {
  const mcpServerUrl = process.env.GITLAB_MCP_URL || 'http://127.0.0.1:3333/mcp';
  const baseHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream',
    ...(process.env.GITLAB_TOKEN && {
      'Authorization': `Bearer ${process.env.GITLAB_TOKEN}`
    })
  };

  // Ensure server is initialized
  await initializeMCPServer(mcpServerUrl, baseHeaders);

  // Add session ID to headers
  const headers = {
    ...baseHeaders,
    ...(sessionId && { 'mcp-session-id': sessionId })
  };

  const response = await fetch(mcpServerUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params
    })
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const responseText = await response.text();
  
  // Parse SSE format
  const lines = responseText.split('\n');
  let jsonData = '';
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      jsonData = line.substring(6);
      break;
    }
  }

  if (!jsonData) {
    throw new Error('Invalid SSE response format');
  }

  const data = JSON.parse(jsonData);
  
  if (data.error) {
    throw new Error(`MCP Error: ${data.error.message}`);
  }

  return data.result;
}

// For HTTP-based MCP servers (like GitLab MCP)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    switch (action) {
      case 'list-tools':
        const tools = await makeMCPRequest('tools/list');
        return NextResponse.json({ tools: tools?.tools || [] });
        
      case 'list-resources':
        const resources = await makeMCPRequest('resources/list');
        return NextResponse.json({ resources: resources?.resources || [] });
        
      case 'status':
        return NextResponse.json({ 
          connected: isInitialized,
          sessionId: sessionId,
          timestamp: new Date().toISOString()
        });
        
      case 'reset':
        resetConnection();
        return NextResponse.json({ 
          message: 'Connection reset successfully',
          timestamp: new Date().toISOString()
        });
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('MCP API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to communicate with MCP server: ${errorMessage}` },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, toolName, arguments: toolArgs } = body;
    
    switch (action) {
      case 'call-tool':
        if (!toolName) {
          return NextResponse.json({ error: 'Tool name required' }, { status: 400 });
        }
        
        const result = await makeMCPRequest('tools/call', {
          name: toolName,
          arguments: toolArgs || {}
        });
        
        return NextResponse.json({ result });
        
      case 'reinitialize':
        resetConnection();
        // Try to reconnect immediately
        try {
          const tools = await makeMCPRequest('tools/list');
          return NextResponse.json({ 
            message: 'Reconnected successfully',
            tools: tools?.tools || [],
            sessionId: sessionId,
            timestamp: new Date().toISOString()
          });
        } catch (reinitError) {
          const errorMessage = reinitError instanceof Error ? reinitError.message : 'Unknown error';
          return NextResponse.json({
            message: 'Reset completed but reconnection failed',
            error: errorMessage,
            timestamp: new Date().toISOString()
          }, { status: 500 });
        }
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('MCP Tool Call Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to call MCP tool: ${errorMessage}` },
      { status: 500 }
    );
  }
}
