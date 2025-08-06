# Next.js MCP Client

![MCP Client](./public/mcp-client.png)

## Run Gitlab MCP server- iwakitakuma/gitlab-mcp 
```docker
docker run -i --rm \
  -e GITLAB_PERSONAL_ACCESS_TOKEN="glpat-*" \
  -e GITLAB_API_URL="https://gitlab.com/api/v4" \
  -e GITLAB_READ_ONLY_MODE=true \
  -e USE_GITLAB_WIKI=true \
  -e USE_MILESTONE=true \
  -e USE_PIPELINE=true \
  -e STREAMABLE_HTTP=true \
  -p 3333:3002 \
  iwakitakuma/gitlab-mcp
```

## Run the app and it connects to Gitlab MCP server to list tools.
```bash
npm run dev
```

## How the MCP Connection Works

### 1. MCP Connection Initialization
- Creates MCP client instance using `@modelcontextprotocol/sdk`
- Establishes HTTP transport to the MCP server
- Client sends initialize request:
  ```json
  {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {
        "tools": {},
        "sampling": {}
      },
      "clientInfo": {
        "name": "nextjs-mcp-client",
        "version": "1.0.0"
      }
    }
  }
  ```
- Server responds with capabilities:
  ```json
  {
    "jsonrpc": "2.0",
    "id": 1,
    "result": {
      "protocolVersion": "2024-11-05",
      "capabilities": {
        "tools": {
          "listChanged": true
        }
      },
      "serverInfo": {
        "name": "gitlab-mcp-server",
        "version": "1.0.0"
      }
    }
  }
  ```
- client sends initialized notification:
  ```json
  {
    "jsonrpc": "2.0",
    "method": "notifications/initialized"
  }
  ```

### 2. Tool Discovery
- Requests available tools:
  ```json
  {
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/list"
  }
  ```
- Displays tools in the dashboard
- Enables tool execution with JSON parameters
