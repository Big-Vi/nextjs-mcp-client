import { MCPServer } from '../hooks/useMCP';

/**
 * Configuration for available MCP servers
 * Add new servers here to make them available in the client
 */
export const MCP_SERVERS: MCPServer[] = [
  {
    id: 'gitlab-mcp',
    name: 'GitLab MCP',
    description: 'GitLab Model Context Protocol Server with full session management',
    url: '/api/mcp',
    requiresAuth: true,
    authType: 'bearer',
    isDefault: false
  },
  {
    id: 'devops-mcp',
    name: 'DevOps MCP Server',
    description: 'Local Next.js DevOps MCP Server with capabilities management',
    url: '/api/devops-mcp',
    requiresAuth: false,
    isDefault: true
  }
  // Add more servers here as needed:
  // {
  //   id: 'filesystem-mcp',
  //   name: 'Filesystem MCP',
  //   description: 'File system operations MCP server',
  //   url: '/api/filesystem-mcp',
  //   requiresAuth: false
  // },
  // {
  //   id: 'database-mcp',
  //   name: 'Database MCP',
  //   description: 'Database operations MCP server',
  //   url: '/api/database-mcp',
  //   requiresAuth: true,
  //   authType: 'basic'
  // }
];

/**
 * Get server configuration by ID
 */
export function getServerById(id: string): MCPServer | undefined {
  return MCP_SERVERS.find(server => server.id === id);
}

/**
 * Get the default server
 */
export function getDefaultServer(): MCPServer | undefined {
  return MCP_SERVERS.find(server => server.isDefault) || MCP_SERVERS[0];
}

/**
 * Get all available servers
 */
export function getAllServers(): MCPServer[] {
  return MCP_SERVERS;
}
