# @llm-devops/interface-core

**Phase-8 / Layer-3 Core Integration Bundle**

The unified interface layer for the LLM DevOps ecosystem. Provides developers and external systems with a single access point to interact with a complex ecosystem of LLM services and tools.

---

## Overview

LLM-Interface-Core serves as the primary orchestration and routing layer in the LLM DevOps architecture. It exposes both a CLI and SDK for LLM operations, routing requests to five downstream Layer-2 systems while maintaining clean separation of concerns through the adapter pattern.

### Key Features

- **Unified API** — Single entry point for all LLM operations
- **Dual Interface** — Both CLI and programmatic SDK access
- **Multi-Provider Support** — OpenAI, Anthropic, Google, and more
- **Thin Orchestration** — Routes requests without duplicating business logic
- **Type-Safe** — Full TypeScript support with strict typing
- **Extensible** — Adapter pattern for easy integration with downstream systems

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                Users / External Systems                     │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│              Layer-3: LLM-Interface-Core                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │     CLI     │  │     SDK     │  │   Type Definitions  │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                  Layer-2 Systems (Adapters)                 │
├─────────────────┬─────────────────┬─────────────────────────┤
│ Inference       │ Config          │ Connector               │
│ Gateway (3005)  │ Manager (3002)  │ Hub (3003)              │
├─────────────────┼─────────────────┼─────────────────────────┤
│ CoPilot         │ Forge           │                         │
│ Agent (3004)    │ (3001)          │                         │
└─────────────────┴─────────────────┴─────────────────────────┘
```

### Downstream Systems

| System | Port | Purpose |
|--------|------|---------|
| **LLM-Inference-Gateway** | 3005 | Model serving, request forwarding, load balancing |
| **LLM-Config-Manager** | 3002 | Configuration management, secrets resolution |
| **LLM-Connector-Hub** | 3003 | Provider connections, protocol handling |
| **LLM-CoPilot-Agent** | 3004 | AI assistance, workflow suggestions |
| **LLM-Forge** | 3001 | Code generation, template management |

---

## Installation

```bash
npm install @llm-devops/interface-core
```

### Requirements

- Node.js >= 18.0.0
- TypeScript >= 5.0 (for development)

### Optional Peer Dependencies

```bash
npm install @llm-devops/config-manager
npm install @llm-devops/connector-hub
npm install @llm-devops/copilot-agent
npm install @llm-devops/forge
npm install @llm-devops/inference-gateway
```

---

## Quick Start

### CLI

```bash
# Run inference
llm-core infer "Explain quantum computing in simple terms"

# Get configuration value
llm-core config get model.temperature

# List available providers
llm-core provider list

# Get AI assistance
llm-core assist "How do I optimize this database query?"

# Generate code from template
llm-core generate rest-api
```

### SDK

```typescript
import { InterfaceCore } from '@llm-devops/interface-core';

const core = new InterfaceCore({
  inference: {
    defaultProvider: 'openai',
    defaultModel: 'gpt-4'
  }
});

// Perform inference
const response = await core.infer({
  prompt: 'Hello, world!',
  model: 'gpt-4',
  provider: 'openai'
});

console.log(response.content);
```

---

## CLI Reference

### `llm-core infer <prompt>`

Send an inference request to an LLM provider.

```bash
llm-core infer "What is machine learning?"
llm-core infer "Translate to French: Hello" --provider anthropic --model claude-3
```

### `llm-core config <action> [key] [value]`

Manage configuration settings.

```bash
llm-core config get model.temperature
llm-core config set model.temperature 0.7
llm-core config list
```

### `llm-core provider <action> [provider]`

Manage LLM provider connections.

```bash
llm-core provider list
llm-core provider connect openai
llm-core provider disconnect anthropic
llm-core provider status openai
```

### `llm-core assist <query>`

Get AI-powered assistance and guidance.

```bash
llm-core assist "How do I implement rate limiting?"
llm-core assist "Explain this error: TypeError: undefined is not a function"
```

### `llm-core generate <template>`

Generate code from predefined templates.

```bash
llm-core generate rest-api
llm-core generate graphql-schema
llm-core generate test-suite
```

---

## SDK Reference

### InterfaceCore

The main entry point for programmatic access.

```typescript
import { InterfaceCore } from '@llm-devops/interface-core';

const core = new InterfaceCore({
  config: {
    configPath: './config.json'
  },
  inference: {
    defaultProvider: 'openai',
    defaultModel: 'gpt-4',
    timeout: 30000
  }
});
```

#### `core.infer(request)`

Execute an inference request.

```typescript
const response = await core.infer({
  prompt: 'Explain recursion',
  model: 'gpt-4',
  provider: 'openai',
  parameters: {
    temperature: 0.7,
    maxTokens: 1000
  }
});
```

#### `core.configure()`

Access configuration management.

```typescript
const config = core.configure();

await config.set('api.timeout', 30000);
const value = await config.get('api.timeout');
const all = await config.list();
```

#### `core.providers()`

Access provider management.

```typescript
const providers = core.providers();

const list = await providers.list();
await providers.connect('openai');
await providers.disconnect('anthropic');
const status = await providers.status('openai');
```

#### `core.forge()`

Access code generation.

```typescript
const forge = core.forge();

const result = await forge.generate('rest-api', {
  name: 'UserService',
  endpoints: ['create', 'read', 'update', 'delete']
});
```

#### `core.assist(query)`

Get AI assistance.

```typescript
const guidance = await core.assist('How do I handle authentication?');
console.log(guidance.suggestions);
```

---

## Project Structure

```
src/
├── adapters/           # Downstream system adapters
│   ├── config-manager.adapter.ts
│   ├── connector-hub.adapter.ts
│   ├── copilot-agent.adapter.ts
│   ├── forge.adapter.ts
│   └── inference-gateway.adapter.ts
├── handlers/           # Request handlers
│   ├── config.handler.ts
│   ├── copilot.handler.ts
│   ├── inference.handler.ts
│   └── provider.handler.ts
├── services/           # Integration services
│   ├── integration.service.ts
│   └── routing.service.ts
├── types/              # TypeScript definitions
│   └── adapter.interface.ts
├── cli.ts              # CLI entry point
├── sdk.ts              # SDK entry point
└── lib.ts              # Library exports
```

---

## Development

### Build

```bash
# Compile TypeScript
npm run build

# Watch mode
npm run build:watch

# Type checking only
npm run typecheck

# Clean build artifacts
npm run clean
```

### Building from Source

```bash
git clone https://github.com/llm-devops/interface-core.git
cd interface-core
npm install
npm run build
```

---

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `LLM_CONFIG_PATH` | Path to configuration file | `./config.json` |
| `LLM_DEFAULT_PROVIDER` | Default LLM provider | `openai` |
| `LLM_DEFAULT_MODEL` | Default model identifier | `gpt-4` |
| `LLM_INFERENCE_TIMEOUT` | Inference request timeout (ms) | `30000` |

### Configuration File

```json
{
  "inference": {
    "defaultProvider": "openai",
    "defaultModel": "gpt-4",
    "timeout": 30000
  },
  "providers": {
    "openai": {
      "apiKey": "${OPENAI_API_KEY}",
      "baseUrl": "https://api.openai.com/v1"
    },
    "anthropic": {
      "apiKey": "${ANTHROPIC_API_KEY}",
      "baseUrl": "https://api.anthropic.com"
    }
  }
}
```

---

## Supported Providers

- **OpenAI** — GPT-4, GPT-3.5-Turbo, and variants
- **Anthropic** — Claude 3.5, Claude 3 family
- **Google** — Gemini Pro, Gemini Ultra
- **Azure OpenAI** — Azure-hosted OpenAI models
- **Custom** — Self-hosted or custom endpoints

---

## License

This project is licensed under the **LLMDevOps Permanent Source-Available Commercial License (v1.0)**.

- Non-production use permitted without commercial license
- Commercial license required for production deployments
- Contact: sales@globalbusinessadvisors.co

See [LICENSE.md](./LICENSE.md) for full terms.

---

## Related Packages

- [@llm-devops/inference-gateway](https://github.com/llm-devops/inference-gateway) — Model serving and routing
- [@llm-devops/config-manager](https://github.com/llm-devops/config-manager) — Configuration management
- [@llm-devops/connector-hub](https://github.com/llm-devops/connector-hub) — Provider connections
- [@llm-devops/copilot-agent](https://github.com/llm-devops/copilot-agent) — AI assistance
- [@llm-devops/forge](https://github.com/llm-devops/forge) — Code generation

---

<p align="center">
  <strong>LLM DevOps</strong> — Unified LLM Infrastructure
</p>
