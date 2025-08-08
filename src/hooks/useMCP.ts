'use client';

import { useState, useCallback, useEffect } from 'react';
import { getAllServers, getDefaultServer } from '../config/mcpServers';
import { getLocalStorageItem, setLocalStorageItem } from '../utils/localStorage';

export interface MCPServer {
  id: string;
  name: string;
  description: string;
  url: string;
  requiresAuth?: boolean;
  authType?: 'bearer' | 'basic' | 'custom';
  isDefault?: boolean;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
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
    data?: unknown;
  }>;
  isError?: boolean;
}

export function useMCP() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tools, setTools] = useState<MCPTool[]>([]);
  const [resources, setResources] = useState<MCPResource[]>([]);
  const [connected, setConnected] = useState(false);
  const [currentServer, setCurrentServer] = useState<MCPServer | null>(null);
  const [availableServers, setAvailableServers] = useState<MCPServer[]>([]);

  const addCustomServer = useCallback((server: MCPServer) => {
    // Check if server ID already exists
    const existingServer = availableServers.find(s => s.id === server.id);
    if (existingServer) {
      throw new Error(`Server with ID "${server.id}" already exists`);
    }

    // Add the new server to the list
    const updatedServers = [...availableServers, server];
    setAvailableServers(updatedServers);
    
    // Optionally save to localStorage for persistence
    try {
      const customServers = updatedServers.filter(s => !getAllServers().find(defaultServer => defaultServer.id === s.id));
      setLocalStorageItem('mcpCustomServers', JSON.stringify(customServers));
    } catch (error) {
      console.warn('Failed to save custom servers to localStorage:', error);
    }
    
    return server;
  }, [availableServers]);

  const removeCustomServer = useCallback((serverId: string) => {
    // Don't allow removing default servers
    const defaultServers = getAllServers();
    const isDefaultServer = defaultServers.find(s => s.id === serverId);
    if (isDefaultServer) {
      throw new Error('Cannot remove default servers');
    }

    const updatedServers = availableServers.filter(s => s.id !== serverId);
    setAvailableServers(updatedServers);

    // If we're removing the currently selected server, switch to default
    if (currentServer?.id === serverId) {
      const defaultServer = getDefaultServer();
      setCurrentServer(defaultServer || null);
      setConnected(false);
      setTools([]);
      setResources([]);
    }

    // Update localStorage
    try {
      const customServers = updatedServers.filter(s => !getAllServers().find(defaultServer => defaultServer.id === s.id));
      setLocalStorageItem('mcpCustomServers', JSON.stringify(customServers));
    } catch (error) {
      console.warn('Failed to update custom servers in localStorage:', error);
    }
  }, [availableServers, currentServer]);

  // Load custom servers from localStorage on initialization
  useEffect(() => {
    const servers = getAllServers();
    
    try {
      const savedCustomServers = getLocalStorageItem('mcpCustomServers');
      if (savedCustomServers) {
        const customServers: MCPServer[] = JSON.parse(savedCustomServers);
        setAvailableServers([...servers, ...customServers]);
      } else {
        setAvailableServers(servers);
      }
    } catch (error) {
      console.warn('Failed to load custom servers from localStorage:', error);
      setAvailableServers(servers);
    }
    
    const defaultServer = getDefaultServer();
    setCurrentServer(defaultServer || null);
  }, []); // Empty dependency array means this runs once on mount

  const connectToMCPServer = useCallback(async (server?: MCPServer) => {
    const targetServer = server || currentServer;
    if (!targetServer) {
      setError('No server selected');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Add a timeout to prevent hanging connections
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      try {
        // All servers now use the same connection method through API proxies
        const response = await fetch(`${targetServer.url}?action=list-tools`, {
          signal: controller.signal
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || `Failed to connect to ${targetServer.name}`);
        }
        
        const toolsList = data.tools || [];
        setTools(toolsList);
        setConnected(true);
        setCurrentServer(targetServer);
        return toolsList;
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          throw new Error(`Connection timeout: ${targetServer.name} did not respond within 10 seconds`);
        }
        throw fetchError;
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setConnected(false);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentServer]);

  const switchServer = useCallback(async (serverId: string) => {
    console.log('switchServer called with:', serverId);
    const server = availableServers.find(s => s.id === serverId);
    if (!server) {
      setError(`Server with ID ${serverId} not found`);
      return;
    }

    console.log('Switching to server:', server.name);
    
    // Reset current connection and UI state
    setConnected(false);
    setTools([]);
    setResources([]);
    setError(null);
    setLoading(false); // Don't auto-connect, let user manually connect
    setCurrentServer(server);

    // Store the selected server but don't auto-connect
    setLocalStorageItem('selectedServerId', serverId);
    console.log('Server switched to:', server.name, '- Use Connect button to connect');
  }, [availableServers]);

  // Keep the original method for backward compatibility
  const connectToGitLabMCP = useCallback(async () => {
    const gitlabServer = availableServers.find(s => s.id === 'gitlab-mcp');
    if (gitlabServer) {
      return await connectToMCPServer(gitlabServer);
    }
    throw new Error('GitLab MCP server not available');
  }, [availableServers, connectToMCPServer]);

  const listTools = useCallback(async () => {
    if (!connected || !currentServer) {
      return await connectToMCPServer();
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // All servers now use the same method through API proxies
      const response = await fetch(`${currentServer.url}?action=list-tools`);
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
  }, [connected, currentServer, connectToMCPServer]);

  const listResources = useCallback(async () => {
    if (!currentServer) {
      throw new Error('No server selected');
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${currentServer.url}?action=list-resources`);
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
  }, [currentServer]);

  const callTool = useCallback(async (toolName: string, toolArgs: Record<string, unknown> = {}): Promise<ToolCallResult> => {
    if (!currentServer) {
      throw new Error('No server selected');
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(currentServer.url, {
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
  }, [currentServer]);

  const resetConnection = useCallback(async () => {
    if (!currentServer) {
      throw new Error('No server selected');
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${currentServer.url}?action=reset`);
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
  }, [currentServer]);

  const reinitializeConnection = useCallback(async () => {
    if (!currentServer) {
      throw new Error('No server selected');
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('Reinitializing connection to:', currentServer.url);
      const response = await fetch(currentServer.url, {
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
  }, [currentServer]);

  const getConnectionStatus = useCallback(async () => {
    if (!currentServer) {
      return { connected: false, error: 'No server selected' };
    }

    try {
      const response = await fetch(`${currentServer.url}?action=status`);
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
  }, [currentServer]);

  return {
    loading,
    error,
    tools,
    resources,
    connected,
    currentServer,
    availableServers,
    connectToGitLabMCP,
    connectToMCPServer,
    switchServer,
    addCustomServer,
    removeCustomServer,
    listTools,
    listResources,
    callTool,
    resetConnection,
    reinitializeConnection,
    getConnectionStatus,
  };
}
