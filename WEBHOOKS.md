# Webhook Notification System

The ixo-blocksync server supports webhook notifications for real-time blockchain event notifications sent to your configured endpoints.

## Design Philosophy

This is a **lightweight, primitive implementation** designed to minimize overhead on blocksync performance. Key design decisions:

- **No dead letter queue**: Failed webhooks are logged but not persisted for retry
- **Short timeout**: 2 seconds per request (strictly enforced)
- **Minimal retries**: Only 1 automatic retry with exponential backoff
- **Non-blocking**: Webhooks sent asynchronously after transaction commits

**Why these constraints?**

The average blockchain block time is ~6 seconds. With a 2-second timeout and 1 retry:

- Maximum time per webhook: ~6 seconds (2s + backoff + 2s retry)
- This ensures webhook requests don't pile up faster than blocks are processed
- Keeps blocksync processing fast and predictable

If you need guaranteed delivery, implement your own retry logic on the receiving end or use a message queue system.

## Configuration

Add webhook URLs to your `.env` file:

```bash
WEBHOOK_URLS=https://your-server.com/webhook,https://another-server.com/webhook
```

- **Multiple URLs**: Separate with commas
- **Optional**: Leave empty or unset to disable webhooks
- **Delivery**: All configured URLs receive the same payload simultaneously

## Webhook Payload Format

One webhook POST request is sent per block after successful sync, with all events grouped by topic:

```json
{
  "blockHeight": 12345,
  "chainId": "ixo-5",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "data": {
    "entity:created": [
      { "id": "did:ixo:entity123" },
      { "id": "did:ixo:entity456" }
    ],
    "entity:updated": [{ "id": "did:ixo:entity789" }],
    "iid:created": [{ "id": "did:ixo:iid:abc" }],
    "iid:updated": []
  }
}
```

## Available Topics

### Entity Events

- **`entity:created`** - Array of newly created entities
- **`entity:updated`** - Array of updated entities

### IID Document Events

- **`iid:created`** - Array of newly created IID documents
- **`iid:updated`** - Array of updated IID documents

## Event Data Structure

Each event can include any data structure you want. The payload is completely flexible.

Example with just ID:

```json
{ "id": "did:ixo:entity123" }
```

Example with additional fields:

```json
{
  "id": "did:ixo:entity123",
  "type": "asset",
  "status": "active",
  "owner": "did:ixo:owner456"
}
```

**Note**: The event data structure is completely flexible - include whatever fields you need when queuing webhook events.

## Webhook Behavior

### Transactional Delivery

- Events are **queued** during block processing
- Webhooks are **only sent after successful database commit**
- If block sync fails, queued events are **discarded** (no notifications sent)
- This guarantees that webhook notifications always correspond to committed data

### Delivery Guarantees

- **Non-blocking**: Webhook delivery does NOT block block sync processing
- **Fire and forget**: Webhooks are sent asynchronously after transaction commits
- **At-least-once delivery**: Failed deliveries are retried automatically
- **Retry logic**: 1 automatic retries with exponential backoff
- **Timeout**: 2 seconds per request (receivers MUST respond quickly)
- **Parallel delivery**: All configured URLs receive webhooks simultaneously

**Important**: Your webhook endpoint MUST respond within 2 seconds with a 200 OK status. Process the payload asynchronously in the background - do not perform slow operations in the webhook handler itself.

### Error Handling

- Webhook delivery failures **do not stop block sync**
- Failed deliveries are logged for monitoring
- Retries occur on:
  - Network errors
  - HTTP 5xx status codes
  - Timeouts

## Example Webhook Endpoint

Here's a simple Express.js webhook receiver showing the recommended async pattern:

```javascript
const express = require("express");
const app = express();

app.use(express.json());

// Async processing function
async function processWebhook(payload) {
  const { blockHeight, chainId, timestamp, data } = payload;

  console.log(`Processing block ${blockHeight} from chain ${chainId}`);

  // Process entity creations
  for (const entity of data["entity:created"]) {
    console.log(`New entity created: ${entity.id}`);
    // Your slow logic here (database writes, API calls, etc.)
  }

  // Process entity updates
  for (const entity of data["entity:updated"]) {
    console.log(`Entity updated: ${entity.id}`);
    // Your slow logic here
  }

  // Process IID creations
  for (const iid of data["iid:created"]) {
    console.log(`New IID created: ${iid.id}`);
    // Your slow logic here
  }

  // Process IID updates
  for (const iid of data["iid:updated"]) {
    console.log(`IID updated: ${iid.id}`);
    // Your slow logic here
  }

  console.log(`Finished processing block ${blockHeight}`);
}

app.post("/webhook", (req, res) => {
  // IMMEDIATELY respond with 200 OK (within 2 seconds)
  res.status(200).json({ received: true });

  // Process asynchronously in background (don't await)
  processWebhook(req.body).catch((error) => {
    console.error("Error processing webhook:", error);
  });
});

app.listen(3000, () => {
  console.log("Webhook receiver listening on port 3000");
});
```

**Key Points**:

- ✅ Respond with `200 OK` **immediately** (before processing)
- ✅ Process the payload **asynchronously** in the background
- ✅ Handle errors in your async processing
- ❌ Don't perform slow operations before responding
- ❌ Don't wait for database writes or API calls before responding

## Testing Webhooks

### Using Webhook.site

For quick testing, use [webhook.site](https://webhook.site):

1. Visit https://webhook.site
2. Copy your unique URL
3. Add to `.env`:
   ```bash
   WEBHOOK_URLS=https://webhook.site/your-unique-url
   ```
4. Watch real-time webhook deliveries in your browser

### Local Testing with ngrok

To receive webhooks locally:

1. Install [ngrok](https://ngrok.com)
2. Start your local webhook server:
   ```bash
   node your-webhook-server.js
   ```
3. Expose it via ngrok:
   ```bash
   ngrok http 3000
   ```
4. Use the ngrok URL in your `.env`:
   ```bash
   WEBHOOK_URLS=https://abc123.ngrok.io/webhook
   ```

## Security Considerations

### Current Implementation

- No authentication/signature verification (webhooks are public)
- HTTPS URLs are recommended for production
- Webhook failures don't affect block sync

### Recommendations for Production

For production use with guaranteed delivery requirements, consider:

- **Implement retry logic on your end**: Your webhook receiver should have its own retry mechanism
- **Use a message queue**: Buffer incoming webhooks in a queue (Redis, RabbitMQ, etc.) for processing
- **Monitor webhook logs**: Track delivery failures and implement alerting
- **HMAC signatures**: Add authentication to prevent unauthorized webhook calls (implement server-side)

**Why not add these to blocksync?**

These features add complexity and overhead that would slow down blockchain indexing. The webhook system is intentionally minimal to keep blocksync fast. Implement reliability features in your receiving application where they won't impact block processing speed.

## Performance & Optimization

### Batching

Events are automatically batched by block:

- One webhook call per block (not per event)
- Multiple events of the same type are grouped into arrays
- Efficient for blocks with many events

### Future Optimizations

If payloads become too large:

- Implement batch splitting (e.g., max 100 events per webhook)
- Send multiple webhook calls per block if needed
- Add configurable batch size via environment variable

## Monitoring

### Webhook Delivery Logs

Failed delivery:

```
✗ Webhook failed for https://your-server.com/webhook (500) after 3452ms: Internal Server Error
Webhook delivery: 1 succeeded, 1 failed
```

### Event Summary

When events are queued:

```
Flushing webhooks for block 12345: entity:created: 3, entity:updated: 1, iid:created: 2
```

## Troubleshooting

### Not Receiving Webhooks

1. **Check configuration**: Verify `WEBHOOK_URLS` is set in `.env`
2. **Check URL accessibility**: Ensure your webhook endpoint is publicly accessible
3. **Check server logs**: Look for webhook delivery messages
4. **Verify endpoint**: Test with curl:
   ```bash
   curl -X POST https://your-server.com/webhook \
     -H "Content-Type: application/json" \
     -d '{"blockHeight":1,"chainId":"test","timestamp":"2025-01-15T10:00:00Z","data":{"entity:created":[],"entity:updated":[],"iid:created":[],"iid:updated":[]}}'
   ```

### Webhook Delivery Failures

- **Timeouts**: Respond within 2 seconds (strictly enforced)
- **5xx errors**: Check your webhook endpoint logs
- **Network errors**: Verify endpoint is accessible from blocksync server
- **HTTPS errors**: Ensure valid SSL certificate

### High Latency / Timeouts

- **Critical**: Respond with 200 OK within 2 seconds
- Process events **asynchronously** in background (see example above)
- Don't perform slow operations before responding
- Don't wait for database writes or external API calls
- Structure your endpoint to respond first, process later

## Support

For issues or questions about the webhook system, refer to the main repository documentation or open an issue on GitHub.
