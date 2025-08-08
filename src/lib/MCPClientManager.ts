import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { Tool } from "@anthropic-ai/sdk/resources/messages/messages.mjs";

export class MCPClientManager {
  private mcp: Client;
  private transport: StdioClientTransport | null = null;
  private tools: Tool[] = [];
  private connected = false;
  private httpServerUrl: string | null = null;
  private httpHeaders: Record<string, string> = {};
  private sessionId: string | null = null;

  constructor() {
    this.mcp = new Client({ 
      name: "nextjs-mcp-client", 
      version: "1.0.0" 
    });
  }

  async connectToServer(serverConfig: {
    command: string;
    args: string[];
  }) {
    /**
     * Connect to an MCP server using stdio transport
     * 
     * @param serverConfig - Configuration for the MCP server
     */
    try {
      // Initialize transport and connect to server
      this.transport = new StdioClientTransport({
        command: serverConfig.command,
        args: serverConfig.args,
      });
      
      await this.mcp.connect(this.transport);

      // List available tools
      const toolsResult = await this.mcp.listTools();
      this.tools = toolsResult.tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        input_schema: tool.inputSchema,
      }));

      this.connected = true;
      console.log(
        "Connected to MCP server with tools:",
        this.tools.map(({ name }) => name),
      );
      
      return this.tools;
    } catch (e) {
      console.error("Failed to connect to MCP server: ", e);
      this.connected = false;
      throw e;
    }
  }

  async connectToHttpServer(serverUrl: string, headers: Record<string, string> = {}) {
    /**
     * Connect to an HTTP-based MCP server (like GitLab MCP in Docker)
     * 
     * @param serverUrl - URL of the HTTP MCP server
     * @param headers - Additional headers for authentication
     */
    try {
      this.httpServerUrl = serverUrl;
      this.httpHeaders = { ...headers };
      
      // Get or create a session
      if (!this.sessionId) {
        const sessionResponse = await fetch(`${serverUrl}?action=new-session`);
        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json();
          this.sessionId = sessionData.sessionId;
        }
        
        // If session creation failed, generate a client-side session ID
        if (!this.sessionId) {
          this.sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
        }
      }
      
      // Initialize the session
      const initResponse = await fetch(serverUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'mcp-session-id': this.sessionId,
          ...headers,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {}
        })
      });

      if (!initResponse.ok) {
        throw new Error(`HTTP ${initResponse.status}: ${initResponse.statusText}`);
      }

      // Parse SSE response or JSON response
      const initData = await this.parseServerResponse(initResponse);
      
      if (initData.error) {
        throw new Error(`MCP Init Error: ${initData.error.message}`);
      }

      // List available tools
      const toolsResponse = await fetch(serverUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'mcp-session-id': this.sessionId,
          ...headers,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 2,
          method: 'tools/list',
          params: {}
        })
      });

      if (!toolsResponse.ok) {
        throw new Error(`HTTP ${toolsResponse.status}: ${toolsResponse.statusText}`);
      }

      const toolsData = await this.parseServerResponse(toolsResponse);
      
      if (toolsData.error) {
        throw new Error(`MCP Tools Error: ${toolsData.error.message}`);
      }

      this.tools = toolsData.result?.tools || [];
      this.connected = true;
      
      console.log(
        "Connected to HTTP MCP server with tools:",
        this.tools.map((tool: any) => tool.name),
      );
      
      return this.tools;
    } catch (e) {
      console.error("Failed to connect to HTTP MCP server: ", e);
      this.connected = false;
      throw e;
    }
  }

  private async parseServerResponse(response: Response): Promise<any> {
    /**
     * Parse server response, handling both JSON and SSE formats
     */
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('text/event-stream')) {
      // Handle SSE format
      const text = await response.text();
      const lines = text.trim().split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          return JSON.parse(line.substring(6));
        }
      }
      
      throw new Error('No data found in SSE response');
    } else {
      // Handle JSON format
      return await response.json();
    }
  }

  async listTools() {
    if (!this.connected) {
      throw new Error("Not connected to MCP server");
    }
    
    if (this.transport) {
      // For stdio-based servers
      const toolsResult = await this.mcp.listTools();
      return toolsResult.tools;
    } else {
      // For HTTP-based servers, tools are cached during connection
      return this.tools;
    }
  }

  async callTool(toolName: string, args: any = {}) {
    if (!this.connected) {
      throw new Error("Not connected to MCP server");
    }

    if (this.transport) {
      // For stdio-based servers
      const result = await this.mcp.callTool({
        name: toolName,
        arguments: args,
      });
      return result;
    } else if (this.httpServerUrl && this.sessionId) {
      // For HTTP-based servers with session management
      const response = await fetch(this.httpServerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'mcp-session-id': this.sessionId,
          ...this.httpHeaders,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/call',
          params: {
            name: toolName,
            arguments: args
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await this.parseServerResponse(response);
      
      if (data.error) {
        throw new Error(`Tool Error: ${data.error.message}`);
      }

      return data.result;
    } else {
      throw new Error("No valid connection method available for tool calling");
    }
  }

  async listResources() {
    if (!this.connected) {
      throw new Error("Not connected to MCP server");
    }

    const resourcesResult = await this.mcp.listResources();
    return resourcesResult.resources;
  }

  isConnected() {
    return this.connected;
  }

  getTools() {
    return this.tools;
  }

  async reinitialize() {
    /**
     * Reinitialize the connection by cleaning up and reconnecting
     */
    console.log("Reinitializing MCP connection...");
    
    // Store previous connection details for reconnection
    const wasStdio = !!this.transport;
    
    // Cleanup current connection
    await this.cleanup();
    
    // Reset state
    this.connected = false;
    this.tools = [];
    
    console.log("Connection reset. Please call connectToServer() or connectToHttpServer() again.");
  }

  async forceReconnect(connectionMethod: 'stdio' | 'http', config?: any) {
    /**
     * Force reconnect with the same or new configuration
     * 
     * @param connectionMethod - 'stdio' or 'http'
     * @param config - Server configuration or URL
     */
    try {
      // Cleanup first
      await this.cleanup();
      
      // Reconnect based on method
      if (connectionMethod === 'stdio' && config) {
        return await this.connectToServer(config);
      } else if (connectionMethod === 'http' && config) {
        const { url, headers = {} } = config;
        return await this.connectToHttpServer(url, headers);
      } else {
        throw new Error("Invalid connection method or missing configuration");
      }
    } catch (error) {
      console.error("Force reconnect failed:", error);
      throw error;
    }
  }

  getSessionId() {
    return this.sessionId;
  }

  async cleanup() {
    /**
     * Clean up resources
     */
    if (this.mcp && this.connected) {
      await this.mcp.close();
    }
    this.connected = false;
    this.transport = null;
    this.httpServerUrl = null;
    this.httpHeaders = {};
    this.sessionId = null;
    this.tools = [];
  }
}

// Example usage configurations
export const MCP_CONFIGS = {
  // For local Python MCP servers
  python: (scriptPath: string) => ({
    command: process.platform === "win32" ? "python" : "python3",
    args: [scriptPath],
  }),
  
  // For local Node.js MCP servers
  node: (scriptPath: string) => ({
    command: process.execPath,
    args: [scriptPath],
  }),
  
  // For GitLab MCP server (if running locally via npm)
  gitlabLocal: {
    command: "npx",
    args: ["gitlab-mcp"],
  },
};
