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

