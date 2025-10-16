import axios from "axios";
import axiosRetry from "axios-retry";
import { WebhookTopic } from "./webhook_queue";

// Configure axios with retry logic
const webhookClient = axios.create({
  timeout: 2000, // 2 second timeout - receivers should respond immediately
  headers: {
    "Content-Type": "application/json",
    "User-Agent": "IXO-Blocksync-Webhook/1.0",
  },
});

// Retry failed requests up to 1 time with exponential backoff
axiosRetry(webhookClient, {
  retries: 1,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    // Retry on network errors or 5xx status codes
    return (
      axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      (error.response?.status ?? 0) >= 500
    );
  },
});

export interface WebhookPayload {
  blockHeight: number;
  chainId: string;
  timestamp: string;
  data: Record<WebhookTopic, Array<Record<string, any>>>;
}

export interface WebhookResult {
  url: string;
  success: boolean;
  error?: string;
  statusCode?: number;
  duration: number;
}

/**
 * Send webhook POST request to a single URL
 */
export const sendWebhook = async (
  url: string,
  payload: WebhookPayload
): Promise<WebhookResult> => {
  const startTime = Date.now();

  try {
    const response = await webhookClient.post(url, payload);

    return {
      url,
      success: true,
      statusCode: response.status,
      duration: Date.now() - startTime,
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    const statusCode = error.response?.status;
    const errorMessage = error.message || "Unknown error";

    console.error(
      `✗ Webhook failed for ${url} (${
        statusCode || "no response"
      }) after ${duration}ms: ${errorMessage}`
    );

    return {
      url,
      success: false,
      error: errorMessage,
      statusCode,
      duration,
    };
  }
};

/**
 * Send webhook to multiple URLs in parallel
 */
export const sendWebhooks = async (
  urls: string[],
  payload: WebhookPayload
): Promise<WebhookResult[]> => {
  if (urls.length === 0) {
    return [];
  }

  console.log(
    `Sending webhooks for block ${payload.blockHeight} to ${urls.length} endpoint(s)`
  );

  const results = await Promise.all(
    urls.map((url) => sendWebhook(url, payload))
  );

  const successCount = results.filter((r) => r.success).length;
  const failureCount = results.length - successCount;

  if (failureCount > 0) {
    console.warn(
      `For block ${payload.blockHeight}: Webhook delivery: ${successCount} succeeded, ${failureCount} failed`
    );
  }

  return results;
};
