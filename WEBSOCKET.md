# WebSocket Broadcasting System

The ixo-blocksync server now includes WebSocket support for real-time notifications of blockchain entity and IID document changes.

## Features

- **Topic-based subscriptions**: Subscribe only to the events you care about
- **Transactional broadcasting**: Notifications are only sent after successful database commits
- **Automatic rollback handling**: Failed transactions don't trigger notifications
- **Connection management**: Automatic cleanup of disconnected clients

## Available Topics

Clients can subscribe to the following topics:

- `entity:created` - Notified when a new entity is created
- `entity:updated` - Notified when an entity is updated
- `iid:created` - Notified when a new IID document is created
- `iid:updated` - Notified when an IID document is updated

## Connection

Connect to the WebSocket server at the `/ws` path on the same host and port as the HTTP server.

### Protocol Selection

**Important:** Match the WebSocket protocol to your server's HTTP protocol:

- **HTTP servers** (`http://`) → use `ws://` (WebSocket)
- **HTTPS servers** (`https://`) → use `wss://` (WebSocket Secure)

### Connection URLs

**Production (HTTPS):**

```javascript
const ws = new WebSocket("wss://devnet-blocksync-graphql.ixo.earth/ws");
```

**Local Development (HTTP):**

```javascript
const ws = new WebSocket("ws://localhost:8080/ws");
```

**Important:** The WebSocket server is mounted on the `/ws` path to avoid conflicts with PostGraphile's GraphQL subscriptions (which use the `/graphql` path).

## Message Format

### Client Messages (Subscribe/Unsubscribe)

```json
{
  "action": "subscribe",
  "topic": "entity:created"
}
```

```json
{
  "action": "unsubscribe",
  "topic": "entity:created"
}
```

### Server Messages

**Connection confirmation:**

```json
{
  "type": "connected",
  "message": "Connected to ixo-blocksync WebSocket server",
  "availableTopics": [
    "entity:created",
    "entity:updated",
    "iid:created",
    "iid:updated"
  ]
}
```

**Subscription confirmation:**

```json
{
  "type": "subscribed",
  "topic": "entity:created",
  "message": "Successfully subscribed to entity:created"
}
```

**Broadcast notification:**

The payload structure is dynamic and depends on what data is broadcast for each topic. For entity and IID updates, the current format is:

```json
{
  "topic": "entity:created",
  "id": "did:ixo:abc123",
  "blockHeight": 12345
}
```

Note: Custom topics can include any data structure.

**Error message:**

```json
{
  "error": "Invalid topic 'invalid-topic'. Available topics: entity:created, entity:updated, iid:created, iid:updated"
}
```

## Usage Examples

### Node.js Client

**Production Example:**

```javascript
const WebSocket = require("ws");
const ws = new WebSocket("wss://devnet-blocksync-graphql.ixo.earth/ws");

ws.on("open", () => {
  console.log("Connected to IXO blocksync WebSocket");
  // Subscribe to entity created events
  ws.send(
    JSON.stringify({
      action: "subscribe",
      topic: "entity:created",
    })
  );
});

ws.on("message", (data) => {
  const message = JSON.parse(data);

  if (message.topic === "entity:created") {
    console.log(
      `New entity created: ${message.id} at block ${message.blockHeight}`
    );
    // Fetch full entity data via GraphQL or REST API
  }
});
```

**Local Development:**

```javascript
const WebSocket = require("ws");
const ws = new WebSocket("ws://localhost:8080/ws");
// ... same code as above
```

### Browser Client

**Production Example:**

Open the browser console at [https://devnet-blocksync-graphql.ixo.earth/](https://devnet-blocksync-graphql.ixo.earth/) and run:

```javascript
const ws = new WebSocket("wss://devnet-blocksync-graphql.ixo.earth/ws");

ws.onopen = () => {
  console.log("Connected to IXO blocksync WebSocket");
  // Subscribe to multiple topics
  ws.send(JSON.stringify({ action: "subscribe", topic: "entity:created" }));
  ws.send(JSON.stringify({ action: "subscribe", topic: "entity:updated" }));
  ws.send(JSON.stringify({ action: "subscribe", topic: "iid:created" }));
  ws.send(JSON.stringify({ action: "subscribe", topic: "iid:updated" }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log("Received:", message);

  // Handle different message types
  if (message.type === "connected") {
    console.log("Connected to server");
  } else if (message.topic) {
    // This is a broadcast notification
    handleUpdate(message.topic, message.id, message.blockHeight);
  }
};

ws.onerror = (error) => {
  console.error("WebSocket error:", error);
};

function handleUpdate(topic, id, blockHeight) {
  switch (topic) {
    case "entity:created":
      console.log(`New entity: ${id}`);
      break;
    case "entity:updated":
      console.log(`Updated entity: ${id}`);
      break;
    case "iid:created":
      console.log(`New IID: ${id}`);
      break;
    case "iid:updated":
      console.log(`Updated IID: ${id}`);
      break;
  }
}
```

**Local Development:**

```javascript
const ws = new WebSocket("ws://localhost:8080/ws");
// ... same code as above
```

### Python Client

**Production Example:**

```python
import websockets
import json
import asyncio

async def subscribe():
    uri = "wss://devnet-blocksync-graphql.ixo.earth/ws"
    async with websockets.connect(uri) as websocket:
        print("Connected to IXO blocksync WebSocket")
        # Subscribe to topics
        await websocket.send(json.dumps({
            "action": "subscribe",
            "topic": "entity:created"
        }))

        # Listen for messages
        async for message in websocket:
            data = json.loads(message)
            if data.get('topic') == 'entity:created':
                print(f"New entity: {data['id']} at block {data['blockHeight']}")

asyncio.run(subscribe())
```

**Local Development:**

```python
uri = "ws://localhost:8080/ws"
# ... same code as above
```

## Testing

A test client is included in the repository:

```bash
node websocket-client-example.js
```

This will connect to the configured server (currently set to `wss://devnet-blocksync-graphql.ixo.earth/ws`) and subscribe to all available topics, printing notifications as they arrive.

**Testing Against Different Environments:**

Edit the `WS_URL` in `websocket-client-example.js`:

- **Production (devnet):** `wss://devnet-blocksync-graphql.ixo.earth/ws`
- **Local development:** `ws://localhost:8080/ws`

**Browser Testing:**

You can also quickly test in the browser console at [https://devnet-blocksync-graphql.ixo.earth/](https://devnet-blocksync-graphql.ixo.earth/):

```javascript
const ws = new WebSocket("wss://devnet-blocksync-graphql.ixo.earth/ws");
ws.onopen = () => {
  console.log("Connected!");
  ws.send(JSON.stringify({ action: "subscribe", topic: "entity:created" }));
};
ws.onmessage = (e) => console.log("Received:", JSON.parse(e.data));
```

**Note:** The WebSocket server is mounted on `/ws` to avoid conflicts with PostGraphile's GraphQL subscriptions endpoint at `/graphql`.

## Architecture

### Transactional Broadcasting

The WebSocket system uses a queue-based approach to ensure data consistency:

1. During block sync, events are **queued** (not sent immediately)
2. If the database transaction succeeds, all queued messages are **broadcast**
3. If the transaction fails/rolls back, the queue is **cleared** without broadcasting

This guarantees that:

- Clients never receive notifications for failed transactions
- All notifications correspond to committed database changes
- No race conditions where clients query for non-existent data

### Flow Diagram

```
Block Sync Started
    ↓
Event Handler (entity/IID create/update)
    ↓
queueBroadcast() → Add to queue (not sent yet)
    ↓
withTransaction() completes
    ↓
Transaction Success?
    ↓ YES              ↓ NO
flushBroadcasts()   clearQueue()
    ↓                   ↓
Send to clients    Discard queue
```

## Adding Custom Topics

To add new broadcast topics:

1. **Define the topic type** in `src/websocket/broadcast_queue.ts`:

   ```typescript
   export type BroadcastTopic =
     | "entity:created"
     | "entity:updated"
     | "iid:created"
     | "iid:updated"
     | "your-new-topic"; // Add your topic
   ```

2. **Update the valid topics list** in `src/websocket/server.ts`:

   ```typescript
   const validTopics: BroadcastTopic[] = [
     "entity:created",
     "entity:updated",
     "iid:created",
     "iid:updated",
     "your-new-topic", // Add your topic
   ];
   ```

3. **Queue the broadcast** where the event occurs:

   ```typescript
   import { queueBroadcast } from "../websocket/broadcast_queue";

   // In your event handler
   await yourDatabaseOperation();

   // You can include any data you want - the payload is flexible
   queueBroadcast("your-new-topic", {
     id: itemId,
     blockHeight,
     customField: "any value",
     nestedData: { foo: "bar" },
   });
   ```

The broadcast will automatically be sent after successful transaction commit. The payload is completely flexible - include whatever data makes sense for your topic.

## Performance Considerations

- Each WebSocket connection uses ~50KB of memory
- Broadcasting is efficient - messages are only sent to subscribed clients
- The queue is cleared after each block, keeping memory usage minimal
- Connection count can be monitored via `getClientCount()` function

## Security Notes

- **No authentication**: Currently, anyone can connect and subscribe
- **Public data only**: Only broadcast public blockchain data
- **Rate limiting**: Consider adding rate limits if needed
- **CORS**: The WebSocket server respects the same CORS settings as the HTTP server

## Troubleshooting

**Can't connect to WebSocket:**

- Ensure the server is running
- **Check protocol:** Use `wss://` for HTTPS servers, `ws://` for HTTP servers
- Verify the `/ws` path is included in the URL
- Check that the port matches your configuration (if using localhost)
- Verify firewall settings allow WebSocket connections
- Check browser console for CORS or mixed content errors

**Protocol Mismatch Error:**

If you see errors like "Mixed Content" or connection refused:

- HTTPS sites **must** use `wss://` (not `ws://`)
- HTTP sites **must** use `ws://` (not `wss://`)

Example:

- ✅ `https://devnet-blocksync-graphql.ixo.earth` → `wss://devnet-blocksync-graphql.ixo.earth/ws`
- ✅ `http://localhost:8080` → `ws://localhost:8080/ws`
- ❌ `https://...` → `ws://...` (will fail)
- ❌ `http://...` → `wss://...` (will fail)

**Not receiving broadcasts:**

- Confirm you've subscribed to the correct topic
- Check that blocks are being synced (new data is being indexed)
- Verify your subscription message format is correct
- Check the server logs for connection confirmations

**Connection drops:**

- WebSocket connections may timeout if idle
- Implement ping/pong heartbeat for long-lived connections
- Handle reconnection logic in your client
- Check network stability and proxy configurations

## Support

For issues or questions about the WebSocket functionality, please refer to the main repository documentation or open an issue on GitHub.
