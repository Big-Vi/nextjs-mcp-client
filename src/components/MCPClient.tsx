'use client';

import { useState, useEffect } from 'react';
import { useMCP, MCPTool, ToolCallResult, MCPServer } from '../hooks/useMCP';
import MCPServerSelector from './MCPServerSelector';
import AddServerModal from './AddServerModal';

export default function MCPClient() {
  const { 
    loading, 
    error, 
    tools, 
    connected, 
    currentServer,
    availableServers,
    connectToMCPServer,
    switchServer,
    addCustomServer,
    removeCustomServer,
    callTool,
    resetConnection,
    reinitializeConnection,
    getConnectionStatus
  } = useMCP();
  const [selectedTool, setSelectedTool] = useState<MCPTool | null>(null);
  const [toolArgs, setToolArgs] = useState<string>('{}');
  const [toolResult, setToolResult] = useState<ToolCallResult | null>(null);
  const [showAddServerModal, setShowAddServerModal] = useState(false);

  // Disable auto-connect - let users manually connect
  // useEffect(() => {
  //   // Auto-connect only on initial mount if there's a default server
  //   if (currentServer && !connected && !loading && availableServers.length > 0) {
  //     // Only auto-connect once on mount, not on every server change
  //     const hasConnectedBefore = sessionStorage.getItem(`mcp-connected-${currentServer.id}`);
  //     if (!hasConnectedBefore) {
  //       sessionStorage.setItem(`mcp-connected-${currentServer.id}`, 'true');
  //       connectToMCPServer().catch((err) => {
  //         console.error('Auto-connect failed:', err);
  //       });
  //     }
  //   }
  // }, [currentServer, connected, loading, availableServers, connectToMCPServer]);

  const handleServerChange = async (serverId: string) => {
    try {
      // Reset tool execution state when switching servers
      setSelectedTool(null);
      setToolArgs('{}');
      setToolResult(null);
      
      await switchServer(serverId);
    } catch (err) {
      console.error('Server switch error:', err);
    }
  };

  const handleAddServer = (server: MCPServer) => {
    try {
      addCustomServer(server);
    } catch (err) {
      console.error('Add server error:', err);
      // You might want to show an error message to the user here
    }
  };

  const handleRemoveServer = (serverId: string) => {
    try {
      removeCustomServer(serverId);
    } catch (err) {
      console.error('Remove server error:', err);
      // You might want to show an error message to the user here
    }
  };

  const handleCallTool = async () => {
    if (!selectedTool) return;
    
    try {
      const args = JSON.parse(toolArgs);
      const result = await callTool(selectedTool.name, args);
      setToolResult(result);
    } catch (err) {
      console.error('Tool call error:', err);
    }
  };

  const renderToolResult = (result: ToolCallResult) => {
    return (
      <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <h4 className="font-semibold mb-2">Tool Result:</h4>
        {result.content && result.content.map((content, index) => (
          <div key={index} className="mb-2">
            {content.type === 'text' && (
              <pre className="whitespace-pre-wrap text-sm">{content.text}</pre>
            )}
            {content.type === 'image' && content.data != null ? (
              <div className="max-w-full h-auto p-2 bg-gray-100 dark:bg-gray-700 rounded">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Image result available (data: {typeof content.data === 'string' ? content.data.substring(0, 50) : 'binary data'}...)
                </p>
              </div>
            ) : null}
            {content.type !== 'text' && content.type !== 'image' && (
              <pre className="text-sm text-gray-600">
                {JSON.stringify(content, null, 2)}
              </pre>
            )}
          </div>
        ))}
        {!result.content && (
          <pre className="text-sm text-gray-600">
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">MCP Client Dashboard</h1>
      
      {/* Server Selection */}
      <MCPServerSelector
        currentServer={currentServer}
        availableServers={availableServers}
        onServerChange={handleServerChange}
        onAddServer={() => setShowAddServerModal(true)}
        onRemoveServer={handleRemoveServer}
        disabled={loading}
      />

      {/* Add Server Modal */}
      <AddServerModal
        isOpen={showAddServerModal}
        onClose={() => setShowAddServerModal(false)}
        onAddServer={handleAddServer}
      />
      
      {/* Connection Status */}
      <div className={`mb-4 p-4 rounded-lg ${connected 
        ? 'bg-green-100 border border-green-400 text-green-700' 
        : currentServer
          ? 'bg-gray-100 border border-gray-400 text-gray-700'
          : 'bg-yellow-100 border border-yellow-400 text-yellow-700'
      }`}>
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-2 ${
            connected ? 'bg-green-500' : currentServer ? 'bg-gray-400' : 'bg-yellow-500'
          }`}></div>
          <span className="font-medium">
            {connected 
              ? `Connected to ${currentServer?.name || 'MCP Server'}` 
              : currentServer 
                ? `Ready to connect to ${currentServer.name}` 
                : 'No server selected'
            }
          </span>
        </div>
        {!connected && currentServer && (
          <div className="mt-2">
            <button
              onClick={() => connectToMCPServer()}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Connecting...' : 'Connect to Server'}
            </button>
          </div>
        )}
        {connected && (
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => getConnectionStatus()}
              disabled={loading}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
            >
              Check Status
            </button>
          </div>
        )}
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
          <details className="mt-2">
            <summary className="cursor-pointer">Troubleshooting</summary>
            <ul className="mt-2 text-sm list-disc list-inside">
              <li>Make sure your MCP server is running</li>
              <li>Check the server configuration and URL</li>
              <li>Verify your authentication token is valid</li>
              <li>Ensure the server is accessible</li>
              <li>Try switching to a different server if available</li>
            </ul>
          </details>
        </div>
      )}
      
      {loading && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2">Loading...</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tools List */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">
            Available Tools
            {currentServer && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({currentServer.name})
              </span>
            )}
          </h2>
          {tools.length === 0 ? (
            <div className="text-gray-500">
              {connected ? 'No tools available' : currentServer ? 'Connect to server to see tools' : 'Select a server to see available tools'}
            </div>
          ) : (
            <div className="space-y-2">
              {tools.map((tool) => (
                <div
                  key={tool.name}
                  className={`p-3 border rounded cursor-pointer transition-colors ${
                    selectedTool?.name === tool.name
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedTool(tool)}
                >
                  <h3 className="font-medium">{tool.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {tool.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Tool Execution */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Execute Tool</h2>
          
          {selectedTool ? (
            <div>
              <h3 className="font-medium mb-2">Selected: {selectedTool.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {selectedTool.description}
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Arguments (JSON):
                </label>
                <textarea
                  value={toolArgs}
                  onChange={(e) => setToolArgs(e.target.value)}
                  className="w-full h-32 p-3 border border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-600"
                  placeholder={`{"project_id": "your-project-id"}`}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter JSON arguments for the tool. Check tool schema for required parameters.
                </p>
              </div>
              
              <button
                onClick={handleCallTool}
                disabled={loading || !connected || !currentServer}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Executing...' : 'Execute Tool'}
              </button>
              
              {toolResult && renderToolResult(toolResult)}
            </div>
          ) : (
            <p className="text-gray-500">Select a tool to execute</p>
          )}
        </div>
      </div>
    </div>
  );
}
