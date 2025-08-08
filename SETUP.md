# Setup Instructions

## Prerequisites
- Docker and Docker Compose installed
- Node.js 18+ (for local development)

## Quick Start

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd nextjs-mcp-client
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your GitLab token if you want GitLab integration
   ```

3. **Start all services:**
   ```bash
   docker-compose up --build -d
   ```

4. **Access the application:**
   - Open http://localhost:3000 in your browser

## What's Included

- **MCP Client UI** (port 3000) - Main application interface
- **DevOps MCP Server** (port 3001) - Provides DevOps tools and capabilities
- **GitLab MCP Server** (port 3333) - GitLab integration (requires token)

## Environment Configuration

Create `.env` file with your GitLab Personal Access Token:

```env
GITLAB_PERSONAL_ACCESS_TOKEN=glpat-your_token_here
GITLAB_API_URL=https://gitlab.com/api/v4
```

That's it! The application should be running and ready to use.
