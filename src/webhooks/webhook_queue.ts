import { sendWebhooks, WebhookPayload } from "./webhook_sender";
import { WEBHOOK_URLS } from "../util/secrets";

export type WebhookTopic =
  | "entity:created"
  | "entity:updated"
  | "iid:created"
  | "iid:updated";

export const WEBHOOK_TOPICS: WebhookTopic[] = [
  "entity:created",
  "entity:updated",
  "iid:created",
  "iid:updated",
];

interface WebhookEvent {
  topic: WebhookTopic;
  data: Record<string, any>;
}

// Queue to hold webhook events during transaction processing
// Organized by topic for efficient batching
let webhookQueue: WebhookEvent[] = [];

/**
 * Queue a webhook event to be sent after successful transaction commit
 * @param topic - The event topic
 * @param data - Event data (any object structure)
 */
export const queueWebhookEvent = (
  topic: WebhookTopic,
  data: Record<string, any>
): void => {
  webhookQueue.push({
    topic,
    data,
  });
};

/**
 * Organize queued events by topic for batched webhook payload
 */
const buildWebhookPayload = (
  blockHeight: number,
  chainId: string,
  timestamp: Date
): WebhookPayload => {
  // Only initialize topics that have events (don't send empty arrays)
  const data: WebhookPayload["data"] = {} as WebhookPayload["data"];

  // Group events by topic
  webhookQueue.forEach((event) => {
    if (!data[event.topic]) {
      data[event.topic] = [];
    }
    data[event.topic].push(event.data);
  });

  return {
    blockHeight,
    chainId,
    timestamp: timestamp.toISOString(),
    data,
  };
};

/**
 * Send all queued webhook events and clear the queue (non-blocking)
 * Should be called after successful transaction commit
 * This function does NOT block - webhooks are sent asynchronously
 * @param blockHeight - The block height that was synced
 * @param chainId - The chain ID
 * @param timestamp - The block timestamp
 */
export const flushWebhooks = (
  blockHeight: number,
  chainId: string,
  timestamp: Date
): void => {
  if (webhookQueue.length === 0) {
    // No events to send
    return;
  }

  if (WEBHOOK_URLS.length === 0) {
    // No webhook URLs configured, clear queue silently
    webhookQueue = [];
    return;
  }

  // Build payload with all events grouped by topic
  const payload = buildWebhookPayload(blockHeight, chainId, timestamp);

  // Log event summary
  const eventCounts = Object.entries(payload.data)
    .filter(([_, events]) => events.length > 0)
    .map(([topic, events]) => `${topic}: ${events.length}`)
    .join(", ");

  if (eventCounts) {
    console.log(`Flushing webhooks for block ${blockHeight}: ${eventCounts}`);
  }

  // Clear the queue immediately
  webhookQueue = [];

  // Send webhooks asynchronously (fire and forget)
  // This does not block blocksync processing
  sendWebhooks(WEBHOOK_URLS, payload).catch((error) => {
    console.error(`Error sending webhooks for block ${blockHeight}:`, error);
  });
};

/**
 * Clear all queued webhook events without sending them
 * Should be called when transaction fails/rolls back
 */
export const clearQueue = (): void => {
  if (webhookQueue.length > 0) {
    console.log(
      `Clearing ${webhookQueue.length} queued webhook event(s) due to transaction failure`
    );
    webhookQueue = [];
  }
};

/**
 * Get current queue size (for debugging/monitoring)
 */
export const getQueueSize = (): number => {
  return webhookQueue.length;
};
