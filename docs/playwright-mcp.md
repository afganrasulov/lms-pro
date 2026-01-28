# Playwright MCP Server

A Model Context Protocol (MCP) server that provides browser automation capabilities using Playwright. This server enables LLMs to interact with web pages through structured accessibility snapshots, bypassing the need for screenshots or visually-tuned models.

## Playwright MCP vs Playwright CLI

This package provides MCP interface into Playwright. If you are using a coding agent, you might benefit from using the CLI+SKILLS instead.

- **CLI**: Modern coding agents increasingly favor CLI–based workflows exposed as SKILLs over MCP because CLI invocations are more token-efficient: they avoid loading large tool schemas and verbose accessibility trees into the model context, allowing agents to act through concise, purpose-built commands. This makes CLI + SKILLs better suited for high-throughput coding agents that must balance browser automation with large codebases, tests, and reasoning within limited context windows. [Learn more about Playwright CLI with SKILLS](https://github.com/microsoft/playwright-mcp).

- **MCP**: MCP remains relevant for specialized agentic loops that benefit from persistent state, rich introspection, and iterative reasoning over page structure, such as exploratory automation, self-healing tests, or long-running autonomous workflows where maintaining continuous browser context outweighs token cost concerns.

## Key Features

- **Fast and lightweight**: Uses Playwright's accessibility tree, not pixel-based input.
- **LLM-friendly**: No vision models needed, operates purely on structured data.
- **Deterministic tool application**: Avoids ambiguity common with screenshot-based approaches.

## Requirements

- Node.js 18 or newer
- VS Code, Cursor, Windsurf, Claude Desktop, Goose or any other MCP client

## Getting Started

First, install the Playwright MCP server with your client.

Standard config works in most of the tools:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": [
        "@playwright/mcp@latest"
      ]
    }
  }
}
```

## Configuration

Playwright MCP server supports following arguments. They can be provided in the JSON configuration above, as a part of the "args" list:

| Option | Description | Env Variable |
| :--- | :--- | :--- |
| `--allowed-hosts <hosts...>` | comma-separated list of hosts this server is allowed to serve from. Defaults to the host the server is bound to. Pass '*' to disable the host check. | `PLAYWRIGHT_MCP_ALLOWED_HOSTS` |
| `--allowed-origins` | semicolon-separated list of TRUSTED origins to allow the browser to request. Default is to allow all. | `PLAYWRIGHT_MCP_ALLOWED_ORIGINS` |
| `--allow-unrestricted-file-access` | allow access to files outside of the workspace roots. Also allows unrestricted access to file:// URLs. | `PLAYWRIGHT_MCP_ALLOW_UNRESTRICTED_FILE_ACCESS` |
| `--blocked-origins` | semicolon-separated list of origins to block the browser from requesting. | `PLAYWRIGHT_MCP_BLOCKED_ORIGINS` |
| `--block-service-workers` | block service workers | `PLAYWRIGHT_MCP_BLOCK_SERVICE_WORKERS` |
| `--browser` | browser or chrome channel to use, possible values: `chrome`, `firefox`, `webkit`, `msedge`. | `PLAYWRIGHT_MCP_BROWSER` |
| `--caps` | comma-separated list of additional capabilities to enable, possible values: `vision`, `pdf`. | `PLAYWRIGHT_MCP_CAPS` |
| `--cdp-endpoint` | CDP endpoint to connect to. | `PLAYWRIGHT_MCP_CDP_ENDPOINT` |
| `--cdp-header <headers...>` | CDP headers to send with the connect request, multiple can be specified. | `PLAYWRIGHT_MCP_CDP_HEADER` |
| `--codegen` | specify the language to use for code generation, possible values: `typescript`, `none`. Default is `typescript`. | `PLAYWRIGHT_MCP_CODEGEN` |
| `--config` | path to the configuration file. | `PLAYWRIGHT_MCP_CONFIG` |
| `--console-level` | level of console messages to return: `error`, `warning`, `info`, `debug`. | `PLAYWRIGHT_MCP_CONSOLE_LEVEL` |
| `--device` | device to emulate, for example: "iPhone 15" | `PLAYWRIGHT_MCP_DEVICE` |
| `--executable-path` | path to the browser executable. | `PLAYWRIGHT_MCP_EXECUTABLE_PATH` |
| `--extension` | Connect to a running browser instance (Edge/Chrome only). Requires the "Playwright MCP Bridge" browser extension. | `PLAYWRIGHT_MCP_EXTENSION` |
| `--grant-permissions <permissions...>` | List of permissions to grant to the browser context. | `PLAYWRIGHT_MCP_GRANT_PERMISSIONS` |
| `--headless` | run browser in headless mode, headed by default | `PLAYWRIGHT_MCP_HEADLESS` |
| `--host` | host to bind server to. Default is localhost. | `PLAYWRIGHT_MCP_HOST` |
| `--ignore-https-errors` | ignore https errors | `PLAYWRIGHT_MCP_IGNORE_HTTPS_ERRORS` |
| `--init-page <path...>` | path to TypeScript file to evaluate on Playwright page object | `PLAYWRIGHT_MCP_INIT_PAGE` |
| `--init-script <path...>` | path to JavaScript file to add as an initialization script. | `PLAYWRIGHT_MCP_INIT_SCRIPT` |
| `--isolated` | keep the browser profile in memory, do not save it to disk. | `PLAYWRIGHT_MCP_ISOLATED` |
| `--image-responses` | whether to send image responses to the client. Can be `allow` or `omit`, Defaults to `allow`. | `PLAYWRIGHT_MCP_IMAGE_RESPONSES` |
| `--no-sandbox` | disable the sandbox for all process types that are normally sandboxed. | `PLAYWRIGHT_MCP_NO_SANDBOX` |
| `--output-dir` | path to the directory for output files. | `PLAYWRIGHT_MCP_OUTPUT_DIR` |
| `--output-mode` | whether to save snapshots, console messages, network logs to a file or to the standard output. Can be `file` or `stdout`. | `PLAYWRIGHT_MCP_OUTPUT_MODE` |
| `--port` | port to listen on for SSE transport. | `PLAYWRIGHT_MCP_PORT` |
| `--proxy-bypass` | comma-separated domains to bypass proxy | `PLAYWRIGHT_MCP_PROXY_BYPASS` |
| `--proxy-server` | specify proxy server | `PLAYWRIGHT_MCP_PROXY_SERVER` |
| `--save-session` | Whether to save the Playwright MCP session into the output directory. | `PLAYWRIGHT_MCP_SAVE_SESSION` |
| `--save-trace` | Whether to save the Playwright Trace of the session into the output directory. | `PLAYWRIGHT_MCP_SAVE_TRACE` |
| `--save-video` | Whether to save the video of the session into the output directory. | `PLAYWRIGHT_MCP_SAVE_VIDEO` |
| `--secrets` | path to a file containing secrets in the dotenv format | `PLAYWRIGHT_MCP_SECRETS` |
| `--shared-browser-context` | reuse the same browser context between all connected HTTP clients. | `PLAYWRIGHT_MCP_SHARED_BROWSER_CONTEXT` |
| `--snapshot-mode` | when taking snapshots for responses, specifies the mode to use. Can be `incremental`, `full`, or `none`. | `PLAYWRIGHT_MCP_SNAPSHOT_MODE` |
| `--storage-state` | path to the storage state file for isolated sessions. | `PLAYWRIGHT_MCP_STORAGE_STATE` |
| `--test-id-attribute` | specify the attribute to use for test ids, defaults to "data-testid" | `PLAYWRIGHT_MCP_TEST_ID_ATTRIBUTE` |
| `--timeout-action` | specify action timeout in milliseconds, defaults to 5000ms | `PLAYWRIGHT_MCP_TIMEOUT_ACTION` |
| `--timeout-navigation` | specify navigation timeout in milliseconds, defaults to 60000ms | `PLAYWRIGHT_MCP_TIMEOUT_NAVIGATION` |
| `--user-agent` | specify user agent string | `PLAYWRIGHT_MCP_USER_AGENT` |
| `--user-data-dir` | path to the user data directory. | `PLAYWRIGHT_MCP_USER_DATA_DIR` |
| `--viewport-size` | specify browser viewport size in pixels, for example "1280x720" | `PLAYWRIGHT_MCP_VIEWPORT_SIZE` |

## User Profile

You can run Playwright MCP with persistent profile like a regular browser (default), in isolated contexts for testing sessions, or connect to your existing browser using the browser extension.

### Persistent Profile

All the logged in information will be stored in the persistent profile. Persistent profile is located at:

- **Windows**: `%USERPROFILE%\AppData\Local\ms-playwright\mcp-{channel}-profile`
- **macOS**: `~/Library/Caches/ms-playwright/mcp-{channel}-profile`
- **Linux**: `~/.cache/ms-playwright/mcp-{channel}-profile`

You can override it with `--user-data-dir`.

### Isolated

In the isolated mode, each session is started in the isolated profile.

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": [
        "@playwright/mcp@latest",
        "--isolated",
        "--storage-state={path/to/storage.json}"
      ]
    }
  }
}
```

### Browser Extension

The Playwright MCP Chrome Extension allows you to connect to existing browser tabs and leverage your logged-in sessions and browser state.

## Initial State

There are multiple ways to provide the initial state to the browser context or a page.

- **Storage State**: Use `--user-data-dir` for persistence or `--storage-state` for loading cookies/local storage.
- **Page State**:
  - `--init-page`: Path to a TypeScript file evaluated on the Playwright page object (e.g., granting permissions, setting geolocation).
  - `--init-script`: Path to a JavaScript file added as an initialization script evaluated in every page.

## Standalone MCP Server

When running headed browser on system w/o display or from worker processes of the IDEs, run the MCP server from environment with the DISPLAY and pass the `--port` flag to enable HTTP transport.

```bash
npx @playwright/mcp@latest --port 8931
```

Client config:

```json
{
  "mcpServers": {
    "playwright": {
      "url": "http://localhost:8931/mcp"
    }
  }
}
```

## Tools

- Core automation
- Tab management
- Browser installation
- Coordinate-based (opt-in via `--caps=vision`)
- PDF generation (opt-in via `--caps=pdf`)
- Test assertions (opt-in via `--caps=testing`)
- Tracing (opt-in via `--caps=tracing`)
