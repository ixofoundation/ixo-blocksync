import { Server as HTTPServer } from "http";
import WebSocket, { WebSocketServer } from "ws";
import { BroadcastTopic, BROADCAST_TOPICS } from "./broadcast_queue";

// Store all connected clients and their subscriptions
const clients: Map<WebSocket, Set<BroadcastTopic>> = new Map();

let wss: WebSocketServer | null = null;

/**
 * Initialize WebSocket server on the given HTTP server
 * Only handles WebSocket connections on the /ws path
 */
export const initWebSocketServer = (server: HTTPServer): void => {
  wss = new WebSocketServer({ noServer: true });

  // Handle WebSocket upgrade requests only for /ws path
  server.on("upgrade", (request, socket, head) => {
    const pathname = new URL(
      request.url || "",
      `http://${request.headers.host}`
    ).pathname;

    if (pathname === "/ws" && wss) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss!.emit("connection", ws, request);
      });
    }
    // Let other paths (like PostGraphile's /graphql) handle their own upgrades
  });

  wss.on("connection", (ws: WebSocket) => {
    console.log("WebSocket client connected");

    // Initialize client with empty subscription set
    clients.set(ws, new Set());

    // Handle incoming messages from client
    ws.on("message", (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        handleClientMessage(ws, message);
      } catch (error) {
        console.error("WebSocket message parse error:", error);
        ws.send(
          JSON.stringify({
            error: "Invalid message format. Expected JSON.",
          })
        );
      }
    });

    // Handle client disconnect
    ws.on("close", () => {
      console.log("WebSocket client disconnected");
      clients.delete(ws);
    });

    // Handle errors
    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
      clients.delete(ws);
    });

    // Send welcome message
    ws.send(
      JSON.stringify({
        type: "connected",
        message: "Connected to IXO-blocksync WebSocket server",
        availableTopics: BROADCAST_TOPICS,
      })
    );
  });

  console.log("WebSocket server initialized");
};

/**
 * Handle client messages for subscription management
 */
const handleClientMessage = (ws: WebSocket, message: any): void => {
  const { action, topic } = message;

  if (!action) {
    ws.send(
      JSON.stringify({
        error: 'Missing "action" field. Use "subscribe" or "unsubscribe".',
      })
    );
    return;
  }

  if (!topic) {
    ws.send(
      JSON.stringify({
        error: 'Missing "topic" field.',
      })
    );
    return;
  }

  if (!BROADCAST_TOPICS.includes(topic)) {
    ws.send(
      JSON.stringify({
        error: `Invalid topic "${topic}". Available topics: ${BROADCAST_TOPICS.join(
          ", "
        )}`,
      })
    );
    return;
  }

  const clientTopics = clients.get(ws);
  if (!clientTopics) return;

  if (action === "subscribe") {
    clientTopics.add(topic);
    ws.send(
      JSON.stringify({
        type: "subscribed",
        topic,
        message: `Successfully subscribed to ${topic}`,
      })
    );
    console.log(`Client subscribed to ${topic}`);
  } else if (action === "unsubscribe") {
    clientTopics.delete(topic);
    ws.send(
      JSON.stringify({
        type: "unsubscribed",
        topic,
        message: `Successfully unsubscribed from ${topic}`,
      })
    );
    console.log(`Client unsubscribed from ${topic}`);
  } else {
    ws.send(
      JSON.stringify({
        error: `Unknown action "${action}". Use "subscribe" or "unsubscribe".`,
      })
    );
  }
};

/**
 * Broadcast a message to all clients subscribed to the given topic
 * @param topic - The topic to broadcast to
 * @param payload - Any data object to broadcast (will be JSON stringified)
 */
export const broadcast = (
  topic: BroadcastTopic,
  payload: Record<string, any>
): void => {
  if (!wss) return;

  const message = JSON.stringify(payload);
  let sentCount = 0;

  clients.forEach((topics, ws) => {
    if (topics.has(topic) && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(message);
        sentCount++;
      } catch (error) {
        console.error("WebSocket send error:", error);
      }
    }
  });

  if (sentCount > 0) {
    const dataPreview = payload.id || JSON.stringify(payload).substring(0, 50);
    console.log(`Broadcast ${topic} to ${sentCount} client(s): ${dataPreview}`);
  }
};

/**
 * Get count of connected clients
 */
export const getClientCount = (): number => {
  return clients.size;
};

/**
 * Get count of clients subscribed to a specific topic
 */
export const getTopicSubscriberCount = (topic: BroadcastTopic): number => {
  let count = 0;
  clients.forEach((topics) => {
    if (topics.has(topic)) count++;
  });
  return count;
};
