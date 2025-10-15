import { broadcast } from "./server";

export type BroadcastTopic =
  | "entity:created"
  | "entity:updated"
  | "iid:created"
  | "iid:updated";

export const BROADCAST_TOPICS: BroadcastTopic[] = [
  "entity:created",
  "entity:updated",
  "iid:created",
  "iid:updated",
];

export interface BroadcastMessage {
  topic: BroadcastTopic;
  data: Record<string, any>;
}

// Queue to hold broadcast messages during transaction processing
let broadcastQueue: BroadcastMessage[] = [];

/**
 * Queue a broadcast message to be sent after successful transaction commit
 * @param topic - The topic to broadcast to
 * @param data - Any data object to broadcast (e.g., { id: string, blockHeight: number })
 */
export const queueBroadcast = (
  topic: BroadcastTopic,
  data: Record<string, any>
): void => {
  broadcastQueue.push({
    topic,
    data,
  });
};

/**
 * Send all queued broadcast messages and clear the queue
 * Should be called after successful transaction commit
 */
export const flushBroadcasts = (): void => {
  if (broadcastQueue.length === 0) return;

  // Send all queued messages
  broadcastQueue.forEach((message) => {
    broadcast(message.topic, {
      topic: message.topic,
      ...message.data,
    });
  });

  // Clear the queue
  broadcastQueue = [];
};

/**
 * Clear all queued broadcast messages without sending them
 * Should be called when transaction fails/rolls back
 */
export const clearQueue = (): void => {
  broadcastQueue = [];
};
