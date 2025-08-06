#!/usr/bin/env node

/**
 * Test script to verify MCP client connection
 * 
 * Usage: 
 * - node test-mcp-connection.js http://localhost:3333/mcp  (for HTTP-based GitLab MCP)
 * - node test-mcp-connection.js stdio ./path/to/mcp-server.py  (for stdio-based MCP)
 */

import { MCPClientManager } from './src/lib/MCPClientManager.js';

async function testHttpConnection(url) {
  const client = new MCPClientManager();
  
  try {
    console.log(`🔗 Connecting to HTTP MCP server at ${url}...`);
    
    const tools = await client.connectToHttpServer(url, {
      // Add any required headers here
      'Authorization': process.env.GITLAB_TOKEN ? `Bearer ${process.env.GITLAB_TOKEN}` : undefined
    });
    
    console.log('✅ Connected successfully!');
    console.log(`📦 Found ${tools.length} tools:`);
    
    tools.forEach((tool, index) => {
      console.log(`  ${index + 1}. ${tool.name} - ${tool.description}`);
    });
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('- Make sure the MCP server is running');
    console.log('- Check the URL is correct');
    console.log('- Verify authentication if required');
  } finally {
    await client.cleanup();
  }
}

async function testStdioConnection(scriptPath) {
  const client = new MCPClientManager();
  
  try {
    console.log(`🔗 Connecting to stdio MCP server: ${scriptPath}...`);
    
    // Determine the command based on file extension
    const isJs = scriptPath.endsWith('.js');
    const isPy = scriptPath.endsWith('.py');
    
    if (!isJs && !isPy) {
      throw new Error('Server script must be a .js or .py file');
    }
    
    const config = isJs 
      ? { command: process.execPath, args: [scriptPath] }
      : { command: process.platform === 'win32' ? 'python' : 'python3', args: [scriptPath] };
    
    const tools = await client.connectToServer(config);
    
    console.log('✅ Connected successfully!');
    console.log(`📦 Found ${tools.length} tools:`);
    
    tools.forEach((tool, index) => {
      console.log(`  ${index + 1}. ${tool.name} - ${tool.description}`);
    });
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('- Make sure the script path is correct');
    console.log('- Verify the script is executable');
    console.log('- Check if Python/Node.js is in PATH');
  } finally {
    await client.cleanup();
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage:');
    console.log('  node test-mcp-connection.js <http_url>           # Test HTTP MCP server');
    console.log('  node test-mcp-connection.js stdio <script_path> # Test stdio MCP server');
    console.log('');
    console.log('Examples:');
    console.log('  node test-mcp-connection.js http://localhost:3333/mcp');
    console.log('  node test-mcp-connection.js stdio ./mcp-server.py');
    process.exit(1);
  }
  
  const [type, pathOrUrl] = args;
  
  if (type === 'stdio' && pathOrUrl) {
    await testStdioConnection(pathOrUrl);
  } else if (type.startsWith('http')) {
    await testHttpConnection(type); // First arg is the URL
  } else {
    console.error('Invalid arguments. Use "stdio <path>" or provide an HTTP URL.');
    process.exit(1);
  }
}

main().catch(console.error);
