'use client';

import { MCPServer } from '../hooks/useMCP';
import { getAllServers } from '../config/mcpServers';

interface MCPServerSelectorProps {
  currentServer: MCPServer | null;
  availableServers: MCPServer[];
  onServerChange: (serverId: string) => void;
  onAddServer?: () => void;
  onRemoveServer?: (serverId: string) => void;
  disabled?: boolean;
}

export default function MCPServerSelector({
  currentServer,
  availableServers,
  onServerChange,
  onAddServer,
  onRemoveServer,
  disabled = false
}: MCPServerSelectorProps) {
  const defaultServers = getAllServers();
  
  const isDefaultServer = (serverId: string) => {
    return defaultServers.some(s => s.id === serverId);
  };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <label htmlFor="server-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          MCP Server
        </label>
        {onAddServer && (
          <button
            onClick={onAddServer}
            disabled={disabled}
            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Custom Server
          </button>
        )}
      </div>
      <div className="relative">
        <select
          id="server-select"
          value={currentServer?.id || ''}
          onChange={(e) => onServerChange(e.target.value)}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="" disabled>
            Select an MCP Server
          </option>
          {availableServers.map((server) => (
            <option key={server.id} value={server.id}>
              {server.name} {!isDefaultServer(server.id) ? '(Custom)' : ''}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
      {currentServer && (
        <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {currentServer.description}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded">
                  {currentServer.id}
                </span>
                {currentServer.requiresAuth && (
                  <span className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    Auth Required
                  </span>
                )}
                {currentServer.isDefault && (
                  <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded">
                    Default
                  </span>
                )}
                {!isDefaultServer(currentServer.id) && (
                  <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded">
                    Custom
                  </span>
                )}
              </div>
            </div>
            {onRemoveServer && !isDefaultServer(currentServer.id) && (
              <button
                onClick={() => onRemoveServer(currentServer.id)}
                disabled={disabled}
                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 ml-2"
                title="Remove custom server"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
