/**
 * WebSocket Client Example
 *
 * This example shows how to connect to the ixo-blocksync WebSocket server
 * and subscribe to entity and IID update notifications.
 *
 * Usage:
 * 1. Make sure the ixo-blocksync server is running
 * 2. Run: node websocket-client-example.js
 *
 * Or test in browser console:
 * const ws = new WebSocket('ws://localhost:PORT/ws');
 * ws.onopen = () => ws.send(JSON.stringify({action: 'subscribe', topic: 'entity:created'}));
 * ws.onmessage = (event) => console.log('Received:', JSON.parse(event.data));
 */

const WebSocket = require("ws");

// Change this to match your server's PORT (default is from .env)
// For local testing:
// const PORT = process.env.PORT || 8080;
// const WS_URL = `ws://localhost:${PORT}/ws`;

// For production server (use wss:// for HTTPS servers):
const WS_URL = `wss://devnet-blocksync-graphql.ixo.earth/ws`;

console.log(`Connecting to ${WS_URL}...`);

const ws = new WebSocket(WS_URL);

ws.on("open", function open() {
  console.log("Connected to ixo-blocksync WebSocket server\n");

  // Subscribe to different topics
  console.log("Subscribing to topics...");

  // Subscribe to entity created events
  ws.send(
    JSON.stringify({
      action: "subscribe",
      topic: "entity:created",
    })
  );

  // Subscribe to entity updated events
  ws.send(
    JSON.stringify({
      action: "subscribe",
      topic: "entity:updated",
    })
  );

  // Subscribe to IID created events
  ws.send(
    JSON.stringify({
      action: "subscribe",
      topic: "iid:created",
    })
  );

  // Subscribe to IID updated events
  ws.send(
    JSON.stringify({
      action: "subscribe",
      topic: "iid:updated",
    })
  );

  console.log("\nListening for broadcasts...\n");
});

ws.on("message", function message(data) {
  const msg = JSON.parse(data.toString());

  if (msg.type === "connected") {
    console.log("✓ Server:", msg.message);
    console.log("✓ Available topics:", msg.availableTopics);
    console.log("");
  } else if (msg.type === "subscribed") {
    console.log(`✓ Subscribed to: ${msg.topic}`);
  } else if (msg.type === "unsubscribed") {
    console.log(`✓ Unsubscribed from: ${msg.topic}`);
  } else if (msg.error) {
    console.error("✗ Error:", msg.error);
  } else if (msg.topic) {
    // This is a broadcast message
    console.log(`📢 [${msg.topic}] msg: ${JSON.stringify(msg)}`);
  }
});

ws.on("close", function close() {
  console.log("\nDisconnected from WebSocket server");
});

ws.on("error", function error(err) {
  console.error("WebSocket error:", err.message);
});

// Handle Ctrl+C gracefully
process.on("SIGINT", function () {
  console.log("\nClosing connection...");
  ws.close();
  process.exit();
});

// Example: Unsubscribe from a topic after 30 seconds
setTimeout(() => {
  console.log("\nUnsubscribing from entity:created...");
  ws.send(
    JSON.stringify({
      action: "unsubscribe",
      topic: "entity:created",
    })
  );
}, 30000);
