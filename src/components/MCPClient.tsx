'use client';

import { useState, useEffect } from 'react';
import { useMCP, MCPTool, ToolCallResult } from '../hooks/useMCP';

export default function MCPClient() {
  const { 
    loading, 
    error, 
    tools, 
    connected, 
    connectToGitLabMCP, 
    listTools, 
    callTool,
    resetConnection,
    reinitializeConnection,
    getConnectionStatus
  } = useMCP();
  const [selectedTool, setSelectedTool] = useState<MCPTool | null>(null);
  const [toolArgs, setToolArgs] = useState<string>('{}');
  const [toolResult, setToolResult] = useState<ToolCallResult | null>(null);

  useEffect(() => {
    // Auto-connect on component mount
    connectToGitLabMCP().catch(console.error);
  }, [connectToGitLabMCP]);

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
            {content.type === 'image' && content.data && (
              <img src={content.data} alt="Tool result" className="max-w-full h-auto" />
            )}
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
      <h1 className="text-3xl font-bold mb-6">GitLab MCP Client Dashboard</h1>
      
      {/* Connection Status */}
      <div className={`mb-4 p-4 rounded-lg ${connected 
        ? 'bg-green-100 border border-green-400 text-green-700' 
        : 'bg-yellow-100 border border-yellow-400 text-yellow-700'
      }`}>
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-2 ${connected ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
          <span className="font-medium">
            {connected ? 'Connected to GitLab MCP Server' : 'Connecting to GitLab MCP Server...'}
          </span>
        </div>
        {!connected && (
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => connectToGitLabMCP()}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Connecting...' : 'Retry Connection'}
            </button>
            <button
              onClick={() => resetConnection()}
              disabled={loading}
              className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
            >
              Reset Connection
            </button>
            <button
              onClick={() => reinitializeConnection()}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              Reinitialize
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
            <button
              onClick={() => reinitializeConnection()}
              disabled={loading}
              className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
            >
              Force Reinitialize
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
              <li>Make sure your GitLab MCP server is running</li>
              <li>Check the GITLAB_MCP_URL in your .env file</li>
              <li>Verify your GitLab token is valid</li>
              <li>Ensure the server is accessible from localhost</li>
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
          <h2 className="text-xl font-semibold mb-4">Available GitLab Tools</h2>
          {tools.length === 0 ? (
            <div className="text-gray-500">
              {connected ? 'No tools available' : 'Connect to server to see tools'}
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
                disabled={loading || !connected}
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
