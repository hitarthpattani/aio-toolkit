# EventConsumerAction Documentation

## Overview

The **EventConsumerAction** is a specialized framework component in the Adobe Commerce AIO Toolkit designed for handling Adobe I/O Events. It provides a standardized way to create event-driven actions that process events from Adobe services, with built-in validation, logging, error handling, and response formatting.

## Table of Contents

- [Overview](#overview)
- [Core Components](#core-components)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Event Processing](#event-processing)
- [Examples](#examples)
- [Integration with RuntimeAction](#integration-with-runtimeaction)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)

## Core Components

### 1. EventConsumerAction Class (`src/framework/event-consumer-action/index.ts`)

The main `EventConsumerAction` class provides the `execute` method that wraps your event processing logic with:

- **Automatic logging** using Adobe I/O SDK
- **Event parameter validation** (required parameters and headers)
- **Error handling and response formatting**
- **Event context management**

## Usage

### Basic Event Consumer

```typescript
import { 
  EventConsumerAction,
  RuntimeActionResponse,
  HttpStatus
} from '@adobe-commerce/aio-toolkit';

// Create a simple event consumer
const myEventConsumer = EventConsumerAction.execute(
  'commerce-event-handler',
  ['eventType'], // Required parameters
  ['x-adobe-signature'], // Required headers
  async (params, ctx) => {
    const { eventType } = params;
    const { logger } = ctx;

    logger.info(`Processing event: ${eventType}`);

    // Process the event
    await processCommerceEvent(eventType, params);

    // Return success response
    return RuntimeActionResponse.success({
      message: 'Event processed successfully',
      eventType: eventType,
      processedAt: new Date().toISOString()
    });
  }
);

// Export for Adobe I/O Runtime
exports.main = myEventConsumer;
```

### Adobe Commerce Event Processing

```typescript
const commerceEventConsumer = EventConsumerAction.execute(
  'commerce-product-updated',
  ['event', 'source'],
  ['x-adobe-signature'],
  async (params, ctx) => {
    const { event, source } = params;
    const { logger } = ctx;

    try {
      // Validate event source
      if (source !== 'adobe-commerce') {
        return RuntimeActionResponse.error(
          HttpStatus.BAD_REQUEST,
          'Invalid event source'
        );
      }

      // Process product update event
      const productId = event.data?.product_id;
      if (productId) {
        await syncProductData(productId, event.data);
        logger.info(`Product ${productId} synchronized successfully`);
      }

      return RuntimeActionResponse.success({
        processed: true,
        productId,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Event processing failed:', error);
      return RuntimeActionResponse.error(
        HttpStatus.INTERNAL_ERROR,
        'Failed to process product update event'
      );
    }
  }
);
```

## API Reference

### EventConsumerAction.execute()

Creates an executable event consumer function with built-in validation and error handling.

```typescript
static execute(
  name?: string,
  requiredParams?: string[],
  requiredHeaders?: string[],
  action?: EventActionFunction
): (params: any) => Promise<RuntimeActionResponseType>
```

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `name` | `string` | `'main'` | Event consumer name for logging |
| `requiredParams` | `string[]` | `[]` | Required event parameters |
| `requiredHeaders` | `string[]` | `[]` | Required event headers |
| `action` | `EventActionFunction` | Default handler | Your event processing function |

#### Event Action Function Signature

```typescript
(
  params: { [key: string]: any },
  ctx: {
    logger: any;
    headers: { [key: string]: any };
  }
) => Promise<RuntimeActionResponseType>
```

#### Context Object

- `logger` - Adobe I/O SDK logger instance
- `headers` - Event headers from `params.__ow_headers`

## Event Processing

### Adobe I/O Events Integration

EventConsumerAction is specifically designed to work with Adobe I/O Events:

```typescript
// Typical Adobe I/O Event structure
const adobeEvent = {
  "event_id": "unique-event-id",
  "event": {
    "@id": "event-uuid",
    "@type": "commerce.product.updated",
    "source": "adobe-commerce",
    "time": "2024-01-01T12:00:00Z",
    "data": {
      "product_id": "12345",
      "sku": "product-sku",
      "name": "Updated Product Name",
      "price": 29.99
    }
  }
};

const eventConsumer = EventConsumerAction.execute(
  'process-commerce-event',
  ['event'],
  [],
  async (params, ctx) => {
    const { event } = params;
    const { logger } = ctx;

    // Process the event data
    switch (event['@type']) {
      case 'commerce.product.updated':
        await handleProductUpdate(event.data);
        break;
      case 'commerce.order.created':
        await handleOrderCreated(event.data);
        break;
      default:
        logger.warn(`Unhandled event type: ${event['@type']}`);
    }

    return RuntimeActionResponse.success({ processed: true });
  }
);
```

### Event Validation

```typescript
const validatedEventConsumer = EventConsumerAction.execute(
  'validated-event-processor',
  ['event', 'source'], // Required parameters
  ['x-adobe-signature'], // Required headers for security
  async (params, ctx) => {
    const { event, source } = params;
    const { logger, headers } = ctx;

    // Additional custom validation
    if (!event['@id']) {
      return RuntimeActionResponse.error(
        HttpStatus.BAD_REQUEST,
        'Event ID is required'
      );
    }

    if (!headers['x-adobe-signature']) {
      return RuntimeActionResponse.error(
        HttpStatus.UNAUTHORIZED,
        'Adobe signature is required'
      );
    }

    // Process validated event
    await processValidatedEvent(event);
    
    return RuntimeActionResponse.success({
      eventId: event['@id'],
      processed: true
    });
  }
);
```

## Examples

### 1. Simple Event Logger

```typescript
const eventLogger = EventConsumerAction.execute(
  'event-logger',
  ['event'],
  [],
  async (params, ctx) => {
    const { event } = params;
    const { logger } = ctx;

    logger.info('Event received:', {
      eventId: event['@id'],
      eventType: event['@type'],
      timestamp: event.time
    });

    return RuntimeActionResponse.success({
      logged: true,
      eventId: event['@id']
    });
  }
);
```

### 2. Commerce Inventory Sync

```typescript
const inventorySyncHandler = EventConsumerAction.execute(
  'inventory-sync-handler',
  ['event'],
  ['x-adobe-signature'],
  async (params, ctx) => {
    const { event } = params;
    const { logger } = ctx;

    // Process inventory update events
    if (event['@type'] === 'commerce.inventory.updated') {
      const { product_id, quantity } = event.data;
      
      try {
        // Sync with external inventory system
        await updateExternalInventory(product_id, quantity);
        
        logger.info(`Inventory synced for product ${product_id}: ${quantity}`);
        
        return RuntimeActionResponse.success({
          productId: product_id,
          newQuantity: quantity,
          synced: true
        });
        
      } catch (error) {
        logger.error(`Inventory sync failed for ${product_id}:`, error);
        return RuntimeActionResponse.error(
          HttpStatus.INTERNAL_ERROR,
          `Failed to sync inventory for product ${product_id}`
        );
      }
    }

    return RuntimeActionResponse.success({ skipped: true });
  }
);
```

### 3. Multi-Event Processor

```typescript
const multiEventProcessor = EventConsumerAction.execute(
  'multi-event-processor',
  ['event'],
  [],
  async (params, ctx) => {
    const { event } = params;
    const { logger } = ctx;

    const eventHandlers = {
      'commerce.product.created': handleProductCreated,
      'commerce.product.updated': handleProductUpdated,
      'commerce.product.deleted': handleProductDeleted,
      'commerce.order.created': handleOrderCreated,
      'commerce.customer.created': handleCustomerCreated
    };

    const eventType = event['@type'];
    const handler = eventHandlers[eventType];

    if (handler) {
      try {
        const result = await handler(event.data, ctx);
        logger.info(`Event ${eventType} processed successfully`);
        
        return RuntimeActionResponse.success({
          eventType,
          eventId: event['@id'],
          result
        });
        
      } catch (error) {
        logger.error(`Failed to process ${eventType}:`, error);
        return RuntimeActionResponse.error(
          HttpStatus.INTERNAL_ERROR,
          `Failed to process ${eventType} event`
        );
      }
    }

    logger.warn(`No handler for event type: ${eventType}`);
    return RuntimeActionResponse.success({ 
      skipped: true, 
      reason: 'No handler available' 
    });
  }
);
```

## Integration with RuntimeAction

EventConsumerAction complements RuntimeAction for comprehensive event and HTTP processing:

### Hybrid Event and HTTP Handler

```typescript
// Event consumer for asynchronous processing
const eventConsumer = EventConsumerAction.execute(
  'product-event-consumer',
  ['event'],
  [],
  async (params, ctx) => {
    const { event } = params;
    const { logger } = ctx;

    // Process product events asynchronously
    await processProductEvent(event);
    
    return RuntimeActionResponse.success({
      eventProcessed: true,
      eventId: event['@id']
    });
  }
);

// HTTP action for synchronous API calls
const httpHandler = RuntimeAction.execute(
  'product-api-handler',
  [HttpMethod.GET, HttpMethod.POST],
  ['productId'],
  ['authorization'],
  async (params, ctx) => {
    const { productId } = params;
    const { logger } = ctx;

    // Handle HTTP requests synchronously
    const product = await getProduct(productId);
    
    return RuntimeActionResponse.success(product);
  }
);

// Export both handlers
exports.eventMain = eventConsumer;
exports.apiMain = httpHandler;
```

### Event-Triggered HTTP Calls

```typescript
const eventTriggeredAction = EventConsumerAction.execute(
  'event-to-http-bridge',
  ['event'],
  [],
  async (params, ctx) => {
    const { event } = params;
    const { logger } = ctx;

    try {
      // Process event and make HTTP calls to external systems
      if (event['@type'] === 'commerce.order.created') {
        const order = event.data;
        
        // Notify external fulfillment service via HTTP
        const fulfillmentResponse = await fetch('https://fulfillment-service.com/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(order)
        });
        
        if (fulfillmentResponse.ok) {
          logger.info(`Order ${order.id} sent to fulfillment service`);
        }
      }

      return RuntimeActionResponse.success({
        eventProcessed: true,
        externalCallsMade: true
      });
      
    } catch (error) {
      logger.error('Event processing failed:', error);
      return RuntimeActionResponse.error(
        HttpStatus.INTERNAL_ERROR,
        'Failed to process event and make external calls'
      );
    }
  }
);
```

## Error Handling

EventConsumerAction provides automatic error handling for event processing:

```typescript
const errorHandledConsumer = EventConsumerAction.execute(
  'robust-event-consumer',
  ['event'],
  [],
  async (params, ctx) => {
    const { event } = params;
    const { logger } = ctx;

    try {
      // Validate event structure
      if (!event || !event['@type']) {
        return RuntimeActionResponse.error(
          HttpStatus.BAD_REQUEST,
          'Invalid event structure'
        );
      }

      // Process event with potential failures
      await processRiskyEventOperation(event);
      
      return RuntimeActionResponse.success({ processed: true });
      
    } catch (error) {
      // Handle specific error types
      if (error.code === 'VALIDATION_ERROR') {
        return RuntimeActionResponse.error(
          HttpStatus.BAD_REQUEST,
          `Event validation failed: ${error.message}`
        );
      }
      
      if (error.code === 'EXTERNAL_SERVICE_ERROR') {
        return RuntimeActionResponse.error(
          HttpStatus.SERVICE_UNAVAILABLE,
          'External service temporarily unavailable'
        );
      }

      // Generic error handling
      logger.error('Unexpected error during event processing:', error);
      throw error; // Let framework handle with 500 response
    }
  }
);
```

## Best Practices

### 1. Event Type Handling

```typescript
// Good - Handle specific event types
const eventConsumer = EventConsumerAction.execute(
  'specific-event-handler',
  ['event'],
  [],
  async (params, ctx) => {
    const { event } = params;
    const { logger } = ctx;

    switch (event['@type']) {
      case 'commerce.product.updated':
        return await handleProductUpdate(event, ctx);
      case 'commerce.order.created':
        return await handleOrderCreated(event, ctx);
      default:
        logger.warn(`Unhandled event type: ${event['@type']}`);
        return RuntimeActionResponse.success({ skipped: true });
    }
  }
);
```

### 2. Idempotent Event Processing

```typescript
// Ensure events can be processed multiple times safely
const idempotentProcessor = EventConsumerAction.execute(
  'idempotent-event-processor',
  ['event'],
  [],
  async (params, ctx) => {
    const { event } = params;
    const { logger } = ctx;

    const eventId = event['@id'];
    
    // Check if event was already processed
    const alreadyProcessed = await checkEventProcessed(eventId);
    if (alreadyProcessed) {
      logger.info(`Event ${eventId} already processed, skipping`);
      return RuntimeActionResponse.success({ 
        alreadyProcessed: true,
        eventId 
      });
    }

    // Process event
    await processEvent(event);
    
    // Mark event as processed
    await markEventAsProcessed(eventId);

    return RuntimeActionResponse.success({
      eventId,
      processed: true,
      timestamp: new Date().toISOString()
    });
  }
);
```

### 3. Event Validation and Security

```typescript
const secureEventProcessor = EventConsumerAction.execute(
  'secure-event-processor',
  ['event', 'source'],
  ['x-adobe-signature', 'x-adobe-delivery-id'],
  async (params, ctx) => {
    const { event, source } = params;
    const { logger, headers } = ctx;

    // Validate event source
    const allowedSources = ['adobe-commerce', 'adobe-experience-platform'];
    if (!allowedSources.includes(source)) {
      return RuntimeActionResponse.error(
        HttpStatus.FORBIDDEN,
        `Source '${source}' not allowed`
      );
    }

    // Validate Adobe signature (implement signature verification)
    const signature = headers['x-adobe-signature'];
    const isValidSignature = await verifyAdobeSignature(signature, event);
    if (!isValidSignature) {
      return RuntimeActionResponse.error(
        HttpStatus.UNAUTHORIZED,
        'Invalid Adobe signature'
      );
    }

    // Process verified event
    await processSecureEvent(event);

    return RuntimeActionResponse.success({
      eventId: event['@id'],
      verified: true,
      processed: true
    });
  }
);
```

### 4. Event Batching and Throttling

```typescript
class EventBatchProcessor {
  private eventQueue: any[] = [];
  private processing = false;

  async addEvent(event: any): Promise<void> {
    this.eventQueue.push(event);
    if (!this.processing) {
      await this.processBatch();
    }
  }

  private async processBatch(): Promise<void> {
    this.processing = true;
    
    while (this.eventQueue.length > 0) {
      const batch = this.eventQueue.splice(0, 10); // Process 10 at a time
      await Promise.all(batch.map(event => this.processEvent(event)));
      
      // Small delay to prevent overwhelming downstream services
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    this.processing = false;
  }

  private async processEvent(event: any): Promise<void> {
    // Individual event processing logic
    console.log(`Processing event: ${event['@id']}`);
  }
}

const batchProcessor = new EventBatchProcessor();

const batchEventConsumer = EventConsumerAction.execute(
  'batch-event-consumer',
  ['event'],
  [],
  async (params, ctx) => {
    const { event } = params;
    
    await batchProcessor.addEvent(event);
    
    return RuntimeActionResponse.success({
      queued: true,
      eventId: event['@id']
    });
  }
);
```

### 5. Event Metrics and Monitoring

```typescript
const monitoredEventConsumer = EventConsumerAction.execute(
  'monitored-event-consumer',
  ['event'],
  [],
  async (params, ctx) => {
    const { event } = params;
    const { logger } = ctx;
    
    const startTime = Date.now();
    const eventType = event['@type'];
    
    try {
      logger.info(`Starting processing for event type: ${eventType}`);
      
      await processEvent(event);
      
      const duration = Date.now() - startTime;
      logger.info(`Event processed successfully in ${duration}ms`, {
        eventType,
        eventId: event['@id'],
        duration
      });
      
      return RuntimeActionResponse.success({
        eventId: event['@id'],
        eventType,
        processingTime: duration,
        status: 'success'
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`Event processing failed after ${duration}ms`, {
        eventType,
        eventId: event['@id'],
        duration,
        error: error.message
      });
      
      throw error;
    }
  }
);
```

## Integration with Other Toolkit Components

EventConsumerAction integrates seamlessly with other toolkit components:

- **[RuntimeAction](./runtime-action.md)** - Complementary HTTP request handling for hybrid event/HTTP workflows
- **[AdobeAuth](./adobe-auth.md)** - Authentication for accessing Adobe services from event handlers
- **[AdobeCommerceClient](./adobe-commerce-client.md)** - Make Commerce API calls in response to events
- **[EventMetadataManager](./event-metadata.md)** - Manage event metadata definitions for the events being processed
- **[ProviderManager](./provider.md)** - Manage event providers that generate the events being consumed
- **[RegistrationManager](./registration.md)** - Manage event registrations to subscribe to provider events
- **[GraphQlAction](./graphql-action.md)** - Trigger GraphQL operations from event handlers
- **[OpenWhisk](./openwhisk.md)** - Invoke OpenWhisk actions from event handlers
- **[RestClient](./rest-client.md)** - HTTP calls to external services triggered by events

### Related Documentation:

- **[RuntimeAction](./runtime-action.md)** - For HTTP-based request handling that complements event processing
- **[AdobeAuth](./adobe-auth.md)** - For authenticated API calls within event handlers
- **[AdobeCommerceClient](./adobe-commerce-client.md)** - For Commerce API integration within event processing
- **[EventMetadataManager](./event-metadata.md)** - For managing event metadata definitions that EventConsumerAction processes
- **[ProviderManager](./provider.md)** - For managing event providers that generate events processed by EventConsumerAction
- **[RegistrationManager](./registration.md)** - For managing event subscriptions that deliver events to EventConsumerAction
- **[BearerToken](./bearer-token.md)** - For extracting Bearer tokens when processing authenticated events
- **[GraphQlAction](./graphql-action.md)** - For GraphQL integration within event processing
- **[OpenWhisk](./openwhisk.md)** - For OpenWhisk action invocation within event processing

### Common Integration Patterns:

- **Event + HTTP**: Process events and make HTTP API calls
- **Event + Commerce**: Handle Commerce events and sync with Commerce APIs
- **Event + Auth**: Authenticate and call Adobe services in response to events
- **Event + GraphQL**: Trigger GraphQL operations from event handlers
- **Event + Webhook**: Process webhook payloads that trigger event-driven workflows
- **Event + OpenWhisk**: Trigger serverless actions from event handlers
