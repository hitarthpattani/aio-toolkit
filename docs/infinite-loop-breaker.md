# InfiniteLoopBreaker Documentation

## Overview

The **InfiniteLoopBreaker** utility provides a robust mechanism for detecting and preventing infinite loops in Adobe I/O Runtime event-driven applications. It uses fingerprinting and state persistence to identify when the same event data is being processed repeatedly, helping to break circular event processing patterns in commerce workflows and integration scenarios within the Adobe Commerce AIO Toolkit.

## Table of Contents

- [Overview](#overview)
- [Core Features](#core-features)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Integration with Other Toolkit Components](#integration-with-other-toolkit-components)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)
- [Security Considerations](#security-considerations)
- [Constants Reference](#constants-reference)

## Core Features

### 1. Infinite Loop Detection

- **Event fingerprinting** using SHA256 hashing for data consistency
- **State persistence** with configurable TTL using Adobe I/O State
- **Flexible key generation** supporting both static strings and dynamic functions
- **Custom fingerprint functions** for complex data structures

### 2. State Management

- **Automatic state initialization** with Adobe I/O State SDK
- **Configurable TTL** for fingerprint expiration
- **Error-resilient operations** with graceful failure handling
- **Memory-efficient storage** using hash-based fingerprints

### 3. Developer Experience

- **Simple API** with static methods for easy integration
- **TypeScript support** with full type definitions
- **Comprehensive logging** with configurable log levels
- **Helper utilities** for common patterns

## Usage

### Basic Setup

```typescript
import { InfiniteLoopBreaker } from '@adobe-commerce/aio-toolkit';

// Basic infinite loop detection
const isLoop = await InfiniteLoopBreaker.isInfiniteLoop({
  keyFn: 'order-processing-key',
  fingerprintFn: orderData,
  eventTypes: ['order.created', 'order.updated'],
  event: 'order.created'
});

if (isLoop) {
  console.log('Infinite loop detected, skipping processing');
  return;
}

// Process the event
await processOrderEvent(orderData);

// Store fingerprint to prevent future loops
await InfiniteLoopBreaker.storeFingerPrint(
  'order-processing-key',
  orderData,
  300 // 5 minutes TTL
);
```

### Dynamic Key and Fingerprint Functions

```typescript
// Using functions for dynamic key and fingerprint generation
const isLoop = await InfiniteLoopBreaker.isInfiniteLoop({
  keyFn: () => `order-${orderData.orderId}-${orderData.status}`,
  fingerprintFn: () => ({
    orderId: orderData.orderId,
    status: orderData.status,
    timestamp: orderData.updatedAt
  }),
  eventTypes: ['commerce.order.updated'],
  event: 'commerce.order.updated'
});
```

## API Reference

### Static Methods

#### `isInfiniteLoop(data: InfiniteLoopData): Promise<boolean>`

Checks if the current event processing would create an infinite loop.

**Parameters:**
- `data.keyFn` - String or function returning the storage key
- `data.fingerprintFn` - Data or function returning data to fingerprint
- `data.eventTypes` - Array of event types to check against
- `data.event` - Current event type being processed

**Returns:** Promise resolving to `true` if infinite loop detected, `false` otherwise

#### `storeFingerPrint(keyFn, fingerprintFn, ttl?): Promise<void>`

Stores a fingerprint for future infinite loop detection.

**Parameters:**
- `keyFn` - String or function returning the storage key
- `fingerprintFn` - Data or function returning data to fingerprint
- `ttl` - Optional TTL in seconds (defaults to 60)

#### `fnFingerprint(data: any): () => any`

Creates a function that returns the provided data (utility for consistent API).

**Parameters:**
- `data` - Any data to be returned by the function

**Returns:** Function that returns the original data

#### `fnInfiniteLoopKey(key: string): () => string`

Creates a function that returns the provided key (utility for consistent API).

**Parameters:**
- `key` - String key to be returned by the function

**Returns:** Function that returns the original key

### Types

#### `InfiniteLoopData`

```typescript
interface InfiniteLoopData {
  keyFn: string | (() => string);
  fingerprintFn: any | (() => any);
  eventTypes: string[];
  event: string;
}
```

## Examples

### E-commerce Order Processing

```typescript
import { InfiniteLoopBreaker } from '@adobe-commerce/aio-toolkit';

async function processOrderUpdate(event, params) {
  const orderData = event.data;
  
  // Check for infinite loop
  const isLoop = await InfiniteLoopBreaker.isInfiniteLoop({
    keyFn: () => `order-${orderData.increment_id}`,
    fingerprintFn: () => ({
      status: orderData.status,
      total: orderData.grand_total,
      items: orderData.items.map(i => ({ sku: i.sku, qty: i.qty_ordered }))
    }),
    eventTypes: ['order.updated', 'order.status_changed'],
    event: event.type
  });

  if (isLoop) {
    console.log(`Infinite loop detected for order ${orderData.increment_id}`);
    return { statusCode: 200, body: 'Loop prevented' };
  }

  // Process order
  await updateInventory(orderData);
  await sendNotification(orderData);

  // Store fingerprint
  await InfiniteLoopBreaker.storeFingerPrint(
    `order-${orderData.increment_id}`,
    {
      status: orderData.status,
      total: orderData.grand_total,
      items: orderData.items.map(i => ({ sku: i.sku, qty: i.qty_ordered }))
    },
    600 // 10 minutes
  );

  return { statusCode: 200, body: 'Order processed' };
}
```

### Customer Data Synchronization

```typescript
async function syncCustomerData(customerEvent) {
  const customerId = customerEvent.data.customer_id;
  
  // Dynamic key based on customer and operation
  const storageKey = () => `customer-sync-${customerId}-${customerEvent.operation}`;
  
  // Fingerprint includes relevant customer data
  const customerFingerprint = () => ({
    email: customerEvent.data.email,
    firstName: customerEvent.data.first_name,
    lastName: customerEvent.data.last_name,
    addresses: customerEvent.data.addresses?.length || 0
  });

  const isLoop = await InfiniteLoopBreaker.isInfiniteLoop({
    keyFn: storageKey,
    fingerprintFn: customerFingerprint,
    eventTypes: ['customer.created', 'customer.updated'],
    event: customerEvent.type
  });

  if (isLoop) {
    return { message: 'Duplicate customer sync prevented' };
  }

  // Perform sync
  await syncToExternalSystem(customerEvent.data);
  
  // Store fingerprint with extended TTL
  await InfiniteLoopBreaker.storeFingerPrint(
    storageKey,
    customerFingerprint,
    3600 // 1 hour
  );

  return { message: 'Customer synced successfully' };
}
```

### Product Catalog Updates

```typescript
async function handleProductUpdate(productEvent) {
  const product = productEvent.data;
  
  // Check for catalog update loops
  const isLoop = await InfiniteLoopBreaker.isInfiniteLoop({
    keyFn: `product-${product.sku}`,
    fingerprintFn: {
      price: product.price,
      stock: product.stock_status,
      categories: product.category_ids.sort(),
      attributes: Object.keys(product.custom_attributes || {}).sort()
    },
    eventTypes: ['catalog.product.updated'],
    event: productEvent.type
  });

  if (isLoop) {
    console.log(`Product update loop prevented for SKU: ${product.sku}`);
    return;
  }

  // Update search indexes
  await updateSearchIndex(product);
  
  // Update cache
  await invalidateProductCache(product.sku);
  
  // Store fingerprint
  await InfiniteLoopBreaker.storeFingerPrint(
    `product-${product.sku}`,
    {
      price: product.price,
      stock: product.stock_status,
      categories: product.category_ids.sort(),
      attributes: Object.keys(product.custom_attributes || {}).sort()
    }
  );
}
```

### Integration Workflow Protection

```typescript
class CommerceIntegrationHandler {
  async processWebhook(event, context) {
    const workflowId = `${event.source}-${event.type}-${event.id}`;
    
    // Prevent webhook replay attacks and duplicate processing
    const isLoop = await InfiniteLoopBreaker.isInfiniteLoop({
      keyFn: workflowId,
      fingerprintFn: () => ({
        payload: event.data,
        timestamp: event.timestamp,
        headers: context.headers
      }),
      eventTypes: [event.type],
      event: event.type
    });

    if (isLoop) {
      console.log(`Duplicate webhook prevented: ${workflowId}`);
      return { status: 'duplicate', message: 'Already processed' };
    }

    try {
      // Process the webhook
      const result = await this.handleWebhookData(event.data);
      
      // Store success fingerprint
      await InfiniteLoopBreaker.storeFingerPrint(
        workflowId,
        {
          payload: event.data,
          timestamp: event.timestamp,
          headers: context.headers
        },
        7200 // 2 hours
      );

      return { status: 'success', result };
    } catch (error) {
      // Don't store fingerprint on failure to allow retry
      throw error;
    }
  }
}
```

## Integration with Other Toolkit Components

### With RuntimeAction

```typescript
import { RuntimeAction, InfiniteLoopBreaker } from '@adobe-commerce/aio-toolkit';

class OrderEventHandler extends RuntimeAction {
  async main(params) {
    const orderData = this.getRequiredParam('orderData');
    
    // Check for infinite loop before processing
    const isLoop = await InfiniteLoopBreaker.isInfiniteLoop({
      keyFn: () => `order-${orderData.id}`,
      fingerprintFn: () => orderData,
      eventTypes: ['order.created', 'order.updated'],
      event: params.eventType
    });

    if (isLoop) {
      return this.success({ message: 'Loop prevented', skipped: true });
    }

    // Process order
    const result = await this.processOrder(orderData);
    
    // Store fingerprint
    await InfiniteLoopBreaker.storeFingerPrint(
      `order-${orderData.id}`,
      orderData,
      300
    );

    return this.success(result);
  }
}
```

### With EventConsumerAction

```typescript
import { EventConsumerAction, InfiniteLoopBreaker } from '@adobe-commerce/aio-toolkit';

class CommerceEventConsumer extends EventConsumerAction {
  async processEvent(event) {
    // Built-in loop protection
    const isLoop = await InfiniteLoopBreaker.isInfiniteLoop({
      keyFn: event.id,
      fingerprintFn: event.data,
      eventTypes: this.getSupportedEventTypes(),
      event: event.type
    });

    if (isLoop) {
      this.logger.info('Event loop detected, skipping processing', { eventId: event.id });
      return;
    }

    // Process event normally
    await super.processEvent(event);
    
    // Store fingerprint after successful processing
    await InfiniteLoopBreaker.storeFingerPrint(event.id, event.data);
  }
}
```

## Error Handling

### State Initialization Failures

```typescript
try {
  const isLoop = await InfiniteLoopBreaker.isInfiniteLoop({
    keyFn: 'test-key',
    fingerprintFn: 'test-data',
    eventTypes: ['test.event'],
    event: 'test.event'
  });
} catch (error) {
  if (error.message.includes('State initialization')) {
    // Handle Adobe I/O State service issues
    console.log('State service unavailable, proceeding without loop detection');
    // Continue processing or implement fallback
  } else {
    throw error;
  }
}
```

### Storage Failures

```typescript
try {
  await InfiniteLoopBreaker.storeFingerPrint('key', data, 300);
} catch (error) {
  // Log error but don't fail the main process
  console.error('Failed to store fingerprint:', error.message);
  // Main processing can continue
}
```

### Circular Reference Handling

```typescript
// The utility handles circular references automatically
const circularData = { name: 'test' };
circularData.self = circularData;

// This works without issues
const isLoop = await InfiniteLoopBreaker.isInfiniteLoop({
  keyFn: 'circular-test',
  fingerprintFn: circularData,
  eventTypes: ['test'],
  event: 'test'
});
```

## Best Practices

### 1. Choose Appropriate Keys

```typescript
// Good: Specific and meaningful
const key = `order-${orderId}-${operation}`;

// Avoid: Too generic
const key = 'order-processing';
```

### 2. Use Relevant Fingerprint Data

```typescript
// Good: Include data that matters for loop detection
const fingerprint = {
  orderId: order.id,
  status: order.status,
  total: order.grand_total
};

// Avoid: Including timestamps or random data
const fingerprint = {
  ...order,
  processedAt: new Date().toISOString() // This will always be different
};
```

### 3. Set Appropriate TTL

```typescript
// Short-lived operations
await InfiniteLoopBreaker.storeFingerPrint(key, data, 60); // 1 minute

// Long-running workflows
await InfiniteLoopBreaker.storeFingerPrint(key, data, 3600); // 1 hour

// Default is usually fine
await InfiniteLoopBreaker.storeFingerPrint(key, data); // 60 seconds
```

### 4. Handle Edge Cases

```typescript
// Check for empty or null data
if (!eventData || Object.keys(eventData).length === 0) {
  return; // Skip processing
}

// Validate event type
if (!supportedEventTypes.includes(event.type)) {
  return;
}
```

## Security Considerations

### 1. Data Sensitivity

The InfiniteLoopBreaker stores hashed fingerprints in Adobe I/O State. While the data is hashed, consider the sensitivity of your keys and ensure they don't expose sensitive information.

### 2. State Isolation

Each Adobe I/O Runtime namespace has isolated state. Ensure your keys are unique enough to prevent conflicts within your namespace but not so specific that they expose sensitive data.

### 3. TTL Configuration

Set appropriate TTL values to prevent state storage from growing indefinitely while ensuring adequate loop protection coverage.

## Constants Reference

### DEFAULT_INFINITE_LOOP_BREAKER_TTL

**Value:** `60` (seconds)

**Description:** Default time-to-live for stored fingerprints when no TTL is specified.

### ALGORITHM

**Value:** `'sha256'`

**Description:** Hashing algorithm used for generating fingerprints.

### ENCODING

**Value:** `'hex'`

**Description:** Encoding format for hash output.

## Conclusion

The InfiniteLoopBreaker utility provides essential protection against infinite loops in event-driven Adobe Commerce applications. By implementing fingerprint-based loop detection with configurable storage and TTL, it enables robust, reliable event processing while maintaining high performance and developer experience.

Key benefits:
- **Prevents infinite loops** in complex event-driven architectures
- **Flexible configuration** for different use cases
- **Seamless integration** with other toolkit components
- **Production-ready** error handling and logging
- **TypeScript support** for better development experience

For more advanced use cases or specific integration requirements, refer to the source code and comprehensive test suite for additional implementation patterns.
