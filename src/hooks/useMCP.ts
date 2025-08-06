'use client';

import { useState, useCallback } from 'react';

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
}

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface ToolCallResult {
  content: Array<{
    type: string;
    text?: string;
    data?: any;
  }>;
  isError?: boolean;
}

export function useMCP() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tools, setTools] = useState<MCPTool[]>([]);
  const [resources, setResources] = useState<MCPResource[]>([]);
  const [connected, setConnected] = useState(false);

  const connectToGitLabMCP = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // First, try to connect and list tools to verify connection
      const response = await fetch('/api/mcp?action=list-tools');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to connect to GitLab MCP server');
      }
      
      // Check if response has tools
      const toolsList = data.tools || [];
      setTools(toolsList);
      setConnected(true);
      return toolsList;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setConnected(false);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const listTools = useCallback(async () => {
    if (!connected) {
      return await connectToGitLabMCP();
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/mcp?action=list-tools');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to list tools');
      }
      
      const toolsList = data.tools || [];
      setTools(toolsList);
      return toolsList;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [connected, connectToGitLabMCP]);

  const listResources = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/mcp?action=list-resources');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to list resources');
      }
      
      const resourcesList = data.resources || [];
      setResources(resourcesList);
      return resourcesList;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const callTool = useCallback(async (toolName: string, toolArgs: any = {}): Promise<ToolCallResult> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'call-tool',
          toolName,
          arguments: toolArgs,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to call tool');
      }
      
      return data.result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const resetConnection = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/mcp?action=reset');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset connection');
      }
      
      setConnected(false);
      setTools([]);
      setResources([]);
      
      console.log('Connection reset successfully');
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reinitializeConnection = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'reinitialize',
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setConnected(true);
        setTools(data.tools || []);
        console.log('Reinitialized successfully');
        return data;
      } else {
        // Even if reconnection failed, reset was successful
        setConnected(false);
        setTools([]);
        setResources([]);
        throw new Error(data.error || 'Failed to reinitialize connection');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setConnected(false);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getConnectionStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/mcp?action=status');
      const data = await response.json();
      
      if (response.ok) {
        setConnected(data.connected);
        return data;
      } else {
        throw new Error(data.error || 'Failed to get status');
      }
    } catch (err) {
      console.error('Failed to get connection status:', err);
      setConnected(false);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return { connected: false, error: errorMessage };
    }
  }, []);

  return {
    loading,
    error,
    tools,
    resources,
    connected,
    connectToGitLabMCP,
    listTools,
    listResources,
    callTool,
    resetConnection,
    reinitializeConnection,
    getConnectionStatus,
  };
}
