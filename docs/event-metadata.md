# EventMetadataManager Documentation

## Overview

The **EventMetadataManager** provides a comprehensive interface for managing event metadata within Adobe I/O Events. It handles creating, retrieving, listing, and deleting event metadata for providers, with built-in validation, error handling, and REST client integration within the Adobe Commerce AIO Toolkit.

## Table of Contents

- [Overview](#overview)
- [Core Features](#core-features)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)
- [Integration with Other Toolkit Components](#integration-with-other-toolkit-components)
- [Constants Reference](#constants-reference)

## Core Features

### 1. Event Metadata Management

- **List event metadata** for providers
- **Get specific event metadata** by provider and event code
- **Create new event metadata** with validation
- **Delete event metadata** (all or specific)

### 2. Adobe I/O Events Integration

- **Adobe Developer Console** authentication support
- **REST API client** integration for HTTP operations
- **CloudEvents specification** compliance for event codes
- **HAL+JSON response** handling

### 3. Data Validation

- **Input validation** for required fields and data types
- **Event code validation** with reverse-DNS naming convention
- **Sample event template** handling with automatic base64 encoding
- **Provider ID validation** for API operations

### 4. Error Handling

- **IOEventsApiError** for structured error responses
- **HTTP status code** mapping for different error types
- **Validation error** handling with detailed messages
- **Network error** handling and retry logic

## Usage

### Basic Import

```typescript
const { EventMetadataManager } = require('@adobe-commerce/aio-toolkit');
```

### TypeScript Import

```typescript
import { 
  EventMetadataManager, 
  EventMetadata, 
  EventMetadataInputModel 
} from '@adobe-commerce/aio-toolkit';
```

### Manager Instantiation

```typescript
const eventMetadataManager = new EventMetadataManager(
  'your-client-id',          // Adobe I/O Client ID
  'your-consumer-id',        // Consumer organization ID
  'your-project-id',         // Project ID
  'your-workspace-id',       // Workspace ID
  'your-access-token'        // IMS access token
);
```

## API Reference

### EventMetadataManager

Main class for managing event metadata operations with Adobe I/O Events API.

```typescript
class EventMetadataManager {
  constructor(
    clientId: string,
    consumerId: string,
    projectId: string,
    workspaceId: string,
    accessToken: string
  );

  async list(providerId: string): Promise<EventMetadata[]>;
  async get(providerId: string, eventCode: string): Promise<EventMetadata>;
  async create(providerId: string, eventMetadataData: EventMetadataInputModel): Promise<EventMetadata>;
  async delete(providerId: string, eventCode?: string): Promise<void>;
}
```

### EventMetadata Interface

```typescript
interface EventMetadata {
  event_code: string;
  label?: string;
  description?: string;
  sample_event_template?: string;
  [key: string]: any;
}
```

### EventMetadataInputModel Interface

```typescript
interface EventMetadataInputModel {
  event_code: string;          // CloudEvents type (reverse-DNS recommended)
  label: string;               // Display label in Adobe Developer Console
  description: string;         // Description shown in console
  sample_event_template?: Record<string, any>; // Optional sample event JSON
}
```

### Method Parameters

**list(providerId)**
- `providerId` (string): The ID of the provider to fetch event metadata for
- **Returns**: `Promise<EventMetadata[]>` - Array of event metadata

**get(providerId, eventCode)**
- `providerId` (string): The ID of the provider
- `eventCode` (string): The event code to retrieve
- **Returns**: `Promise<EventMetadata>` - Specific event metadata

**create(providerId, eventMetadataData)**
- `providerId` (string): The ID of the provider to create event metadata for
- `eventMetadataData` (EventMetadataInputModel): The event metadata input data
- **Returns**: `Promise<EventMetadata>` - The created event metadata

**delete(providerId, eventCode?)**
- `providerId` (string): The ID of the provider
- `eventCode` (string, optional): Optional event code to delete specific metadata
- **Returns**: `Promise<void>` - No content returned on successful deletion

## Examples

### 1. Basic Event Metadata Operations

```typescript
const { EventMetadataManager } = require('@adobe-commerce/aio-toolkit');

// Initialize manager with Adobe I/O credentials
const eventManager = new EventMetadataManager(
  process.env.ADOBE_CLIENT_ID,
  process.env.ADOBE_CONSUMER_ID,
  process.env.ADOBE_PROJECT_ID,
  process.env.ADOBE_WORKSPACE_ID,
  process.env.ADOBE_ACCESS_TOKEN
);

const performBasicOperations = async () => {
  const providerId = 'my-provider-123';

  try {
    // List all event metadata for a provider
    const allMetadata = await eventManager.list(providerId);
    console.log('All event metadata:', allMetadata);

    // Create new event metadata
    const newMetadata = await eventManager.create(providerId, {
      event_code: 'com.example.user.created',
      label: 'User Created',
      description: 'Triggered when a new user is created',
      sample_event_template: {
        user_id: 'user123',
        name: 'John Doe',
        email: 'john@example.com',
        created_at: '2023-01-01T00:00:00Z'
      }
    });
    console.log('Created metadata:', newMetadata);

    // Get specific event metadata
    const specificMetadata = await eventManager.get(providerId, 'com.example.user.created');
    console.log('Retrieved metadata:', specificMetadata);

  } catch (error) {
    console.error('Event metadata operation failed:', error.message);
  }
};

performBasicOperations();
```

### 2. Event Metadata with Error Handling

```typescript
const { EventMetadataManager, IOEventsApiError } = require('@adobe-commerce/aio-toolkit');

const eventManager = new EventMetadataManager(
  process.env.ADOBE_CLIENT_ID,
  process.env.ADOBE_CONSUMER_ID,
  process.env.ADOBE_PROJECT_ID,
  process.env.ADOBE_WORKSPACE_ID,
  process.env.ADOBE_ACCESS_TOKEN
);

const createEventMetadataWithErrorHandling = async () => {
  const providerId = 'my-provider-123';
  
  const eventMetadataData = {
    event_code: 'com.mycompany.order.placed',
    label: 'Order Placed',
    description: 'Event triggered when a customer places an order',
    sample_event_template: {
      order_id: 'ord_123456',
      customer_id: 'cust_789',
      total_amount: 99.99,
      currency: 'USD',
      items: [
        { product_id: 'prod_001', quantity: 2, price: 29.99 },
        { product_id: 'prod_002', quantity: 1, price: 39.99 }
      ]
    }
  };

  try {
    const result = await eventManager.create(providerId, eventMetadataData);
    
    console.log('Event metadata created successfully:');
    console.log('Event Code:', result.event_code);
    console.log('Label:', result.label);
    
    return result;
  } catch (error) {
    if (error instanceof IOEventsApiError) {
      // Handle Adobe I/O Events API errors
      console.error('Adobe I/O Events API Error:');
      console.error('Status Code:', error.statusCode);
      console.error('Error Code:', error.code);
      console.error('Message:', error.message);
    } else {
      // Handle other errors
      console.error('Unexpected error:', error.message);
    }
    
    return null;
  }
};

createEventMetadataWithErrorHandling();
```

### 3. Delete Event Metadata Operations

```typescript
const { EventMetadataManager } = require('@adobe-commerce/aio-toolkit');

const eventManager = new EventMetadataManager(
  process.env.ADOBE_CLIENT_ID,
  process.env.ADOBE_CONSUMER_ID,
  process.env.ADOBE_PROJECT_ID,
  process.env.ADOBE_WORKSPACE_ID,
  process.env.ADOBE_ACCESS_TOKEN
);

const deleteEventMetadata = async () => {
  const providerId = 'my-provider-123';

  try {
    // Delete specific event metadata by event code
    await eventManager.delete(providerId, 'com.example.user.created');
    console.log('Specific event metadata deleted successfully');

    // Delete all event metadata for a provider
    await eventManager.delete(providerId);
    console.log('All event metadata deleted for provider');

  } catch (error) {
    if (error.statusCode === 404) {
      console.log('Event metadata not found');
    } else if (error.statusCode === 403) {
      console.log('Not authorized to delete event metadata');
    } else {
      console.error('Delete operation failed:', error.message);
    }
  }
};

deleteEventMetadata();
```

## Error Handling

### IOEventsApiError Structure

EventMetadataManager uses `IOEventsApiError` for structured error handling:

```typescript
try {
  const result = await eventManager.create(providerId, eventData);
} catch (error) {
  if (error instanceof IOEventsApiError) {
    console.log('Status Code:', error.statusCode); // HTTP status code
    console.log('Error Code:', error.code);         // Adobe I/O error code
    console.log('Message:', error.message);         // Error message
  }
}
```

### Common Error Scenarios

```typescript
const handleCommonErrors = async (eventManager, providerId, eventData) => {
  try {
    return await eventManager.create(providerId, eventData);
  } catch (error) {
    switch (error.statusCode) {
      case 400:
        console.error('Validation Error: Check required fields');
        break;
      case 401:
        console.error('Authentication Error: Check access token');
        break;
      case 403:
        console.error('Authorization Error: Insufficient permissions');
        break;
      case 404:
        console.error('Not Found: Provider or resource not found');
        break;
      case 409:
        console.error('Conflict: Event metadata already exists');
        break;
      case 500:
        console.error('Server Error: Adobe I/O Events API error');
        break;
      default:
        console.error('Unexpected error:', error.message);
    }
    return null;
  }
};
```

## Best Practices

### 1. Use Environment Variables for Credentials

```typescript
// ✅ Good - Use environment variables
const eventManager = new EventMetadataManager(
  process.env.ADOBE_CLIENT_ID,
  process.env.ADOBE_CONSUMER_ID,
  process.env.ADOBE_PROJECT_ID,
  process.env.ADOBE_WORKSPACE_ID,
  process.env.ADOBE_ACCESS_TOKEN
);

// ❌ Bad - Hard-coded credentials
const badManager = new EventMetadataManager(
  'hardcoded-client-id',
  'hardcoded-consumer-id',
  // ... other hardcoded values
);
```

### 2. Follow CloudEvents Naming Convention

```typescript
// ✅ Good - Reverse-DNS event codes
const goodEventData = {
  event_code: 'com.mycompany.user.created',    // Reverse-DNS format
  label: 'User Created',
  description: 'Event triggered when a user is created'
};

// ❌ Bad - Generic event codes
const badEventData = {
  event_code: 'user_created',                  // Too generic
  label: 'User Created',
  description: 'User creation event'
};
```

### 3. Reuse Manager Instances

```typescript
// ✅ Good - Reuse manager instance
class EventService {
  constructor() {
    this.eventManager = new EventMetadataManager(
      process.env.ADOBE_CLIENT_ID,
      process.env.ADOBE_CONSUMER_ID,
      process.env.ADOBE_PROJECT_ID,
      process.env.ADOBE_WORKSPACE_ID,
      process.env.ADOBE_ACCESS_TOKEN
    );
  }

  async listEvents(providerId) {
    return await this.eventManager.list(providerId);
  }

  async createEvent(providerId, eventData) {
    return await this.eventManager.create(providerId, eventData);
  }
}

// ❌ Bad - Creating new manager for each operation
const badListEvents = async (providerId) => {
  const manager = new EventMetadataManager(/* credentials */);
  return await manager.list(providerId);
};
```

## Integration with Other Toolkit Components

The EventMetadataManager integrates seamlessly with other toolkit components:

- **[RestClient](./rest-client.md)** - Uses RestClient internally for Adobe I/O Events API calls
- **[RuntimeAction](./runtime-action.md)** - Use within action handlers for event metadata operations
- **[EventConsumerAction](./event-consumer-action.md)** - Process events defined by event metadata
- **[ProviderManager](./provider.md)** - Manage providers that use the event metadata definitions
- **[RegistrationManager](./registration.md)** - Create registrations that subscribe to events defined by metadata
- **[WebhookAction](./webhook-action.md)** - Handle webhook events that correspond to event metadata
- **[AdobeAuth](./adobe-auth.md)** - Generate access tokens for EventMetadataManager authentication

### RuntimeAction Integration

Use EventMetadataManager within RuntimeAction handlers:

```typescript
const { 
  RuntimeAction, 
  RuntimeActionResponse, 
  EventMetadataManager,
  HttpMethod, 
  HttpStatus 
} = require('@adobe-commerce/aio-toolkit');

const eventMetadataAction = RuntimeAction.execute(
  'event-metadata-manager',
  [HttpMethod.POST],
  ['providerId', 'eventData'],
  ['Authorization'],
  async (params, ctx) => {
    const { logger } = ctx;
    const { providerId, eventData } = params;

    try {
      const eventManager = new EventMetadataManager(
        process.env.ADOBE_CLIENT_ID,
        process.env.ADOBE_CONSUMER_ID,
        process.env.ADOBE_PROJECT_ID,
        process.env.ADOBE_WORKSPACE_ID,
        process.env.ADOBE_ACCESS_TOKEN
      );

      const result = await eventManager.create(providerId, eventData);
      
      logger.info('Event metadata created successfully');
      
      return RuntimeActionResponse.success({
        message: 'Event metadata created',
        eventCode: result.event_code,
        label: result.label
      });
    } catch (error) {
      logger.error('Event metadata creation failed:', error);
      return RuntimeActionResponse.error(HttpStatus.INTERNAL_ERROR, 'Failed to create event metadata');
    }
  }
);
```

### Related Documentation:

- **[RestClient](./rest-client.md)** - For HTTP client operations used internally
- **[RuntimeAction](./runtime-action.md)** - For creating HTTP endpoints that manage event metadata
- **[EventConsumerAction](./event-consumer-action.md)** - For processing events defined by event metadata
- **[ProviderManager](./provider.md)** - For managing providers that EventMetadataManager creates metadata for
- **[RegistrationManager](./registration.md)** - For creating registrations that subscribe to events defined by metadata
- **[WebhookAction](./webhook-action.md)** - For handling webhook events
- **[AdobeAuth](./adobe-auth.md)** - For generating access tokens for authentication

### Common Integration Patterns:

- **EventMetadataManager + RuntimeAction**: HTTP endpoints for event metadata management
- **EventMetadataManager + EventConsumerAction**: Define and process events
- **EventMetadataManager + AdobeAuth**: Authenticated event metadata operations
- **EventMetadataManager + WebhookAction**: Handle events defined by metadata

## Constants Reference

EventMetadataManager uses constants from Adobe I/O Events globals and standard HTTP status codes.

### Adobe I/O Events Configuration:

```typescript
// EventMetadataManager uses internal constants for:
// - Adobe I/O Events Base URL
// - HAL+JSON content type
// - Required headers (Authorization, x-api-key, Accept, Content-Type)
```

### CloudEvents Specification:

```typescript
// Event codes should follow CloudEvents type specification:
// - Reverse-DNS naming (com.company.service.event)
// - CloudEvents spec: https://github.com/cloudevents/spec/blob/master/spec.md#type
```

### HTTP Status Codes:

```typescript
// Common status codes returned by Adobe I/O Events API:
// - 200: Success
// - 201: Created
// - 204: No Content (for deletions)
// - 400: Bad Request (validation errors)
// - 401: Unauthorized (authentication failure)
// - 403: Forbidden (insufficient permissions)
// - 404: Not Found (provider or event metadata not found)
// - 409: Conflict (duplicate event metadata)
// - 500: Internal Server Error
```

## Performance Considerations

### EventMetadataManager Optimization

1. **Instance Reuse**: Reuse EventMetadataManager instances across multiple operations
2. **Batch Operations**: When possible, batch multiple event metadata operations
3. **Caching**: Cache frequently accessed event metadata to reduce API calls
4. **Error Handling**: Implement proper error handling and retry logic for network failures

### Best Practices for Performance

1. **Connection Management**: RestClient handles HTTP connections efficiently
2. **Token Management**: Refresh access tokens proactively to avoid authentication failures
3. **Validation**: Validate input data before making API calls to reduce failed requests
4. **Monitoring**: Track API usage and response times for optimization

The EventMetadataManager provides a robust, type-safe interface for managing Adobe I/O Events metadata with built-in validation, error handling, and seamless integration with other Adobe Commerce AIO Toolkit components.
