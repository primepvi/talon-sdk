# @talon/sdk

A TypeScript SDK for the Talon protocol, providing a high-level API to manage remote compute nodes via WebSockets.

## Installation

```bash
npm install @talon/sdk
```

## Core Components

The SDK is structured into three main classes: `Panel` (the server), `Node` (the remote executor), and `App` (the application instance).

### Initializing the Panel

The `Panel` acts as a WebSocket server that coordinates connected nodes.

```typescript
import { Panel } from "@talon/sdk";

const panel = Panel.create({
  port: 9000,
  token: "your-secure-token",
});

panel.listen();

panel.on("node:connected", (node) => {
  console.log(`Node connected: ${node.id}`);
});
```

### Node Management

Retrieve or wait for specific nodes to establish a connection.

```typescript
const node = await panel.waitForNode("worker-01");
const allNodes = panel.getNodes();
```

### Application Lifecycle

Applications are created and managed through a specific `Node` instance.

```typescript
import { randomUUID } from "node:crypto";

const app = await node.createApp({
  app_id: randomUUID(),
  name: "api-service",
  strategy: "dockerfile",
  repo: "https://github.com/user/repo",
  resources: { cpu: 0.5, memory: 512 },
  env: { PORT: "3000" }
});

await app.deploy(randomUUID());

app.on("state", (payload) => {
  console.log(`State changed: ${payload.state}`);
});

await app.stop();
await app.start();
await app.destroy();
```

### Redeployment

```typescript
await app.redeploy({
  deploy_id: randomUUID(),
  changes: ["env"],
  env: { PORT: "4000" }
});
```

## Technical Details

### Error Handling & Timeouts
The SDK implements automatic timeouts to prevent hanging operations:
- **Command Requests:** 30 seconds.
- **State Transitions (Deploy/Start):** 60 seconds.
- **Node Connection (waitForNode):** 30 seconds.

If a connection is lost during a pending operation, the associated Promise will reject with a "Connection closed" error.

### Global Monitoring
Monitor all applications on a specific node using the node-level event:

```typescript
node.on("app:state", (payload) => {
  console.log(`Update from node ${node.id}:`, payload);
});
```
