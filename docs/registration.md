# RegistrationManager Documentation

## Overview

The **RegistrationManager** provides a comprehensive interface for managing event registrations within Adobe I/O Events. It handles creating, retrieving, listing, and deleting event registrations for subscribing to provider events, with built-in validation, error handling, and REST client integration within the Adobe Commerce AIO Toolkit.

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

### 1. Registration Management

- **List registrations** with filtering options and automatic pagination
- **Get specific registrations** by registration ID
- **Create new registrations** with event subscriptions and webhook configuration
- **Delete registrations** by registration ID

### 2. Event Subscription Configuration

- **Events of interest** configuration for specific provider events
- **Multiple delivery types** support (webhook, webhook_batch, journal, aws_eventbridge)
- **Webhook URL** configuration for event delivery
- **Runtime action** integration for serverless event processing

### 3. Adobe I/O Events Integration

- **Adobe Developer Console** authentication support
- **REST API client** integration for HTTP operations
- **Event filtering** by provider ID and event codes
- **HAL+JSON response** handling

### 4. Error Handling

- **IOEventsApiError** for structured error responses
- **HTTP status code** mapping for different error types
- **Validation error** handling with detailed messages
- **Network error** handling and retry logic

## Usage

### Basic Import

```typescript
const { RegistrationManager } = require('@adobe-commerce/aio-toolkit');
```

### TypeScript Import

```typescript
import { 
  RegistrationManager, 
  Registration, 
  RegistrationCreateModel,
  EventsOfInterestInputModel,
  ListRegistrationQueryParams 
} from '@adobe-commerce/aio-toolkit';
```

### Manager Instantiation

```typescript
const registrationManager = new RegistrationManager(
  'your-client-id',          // Adobe I/O Client ID
  'your-consumer-id',        // Consumer organization ID
  'your-project-id',         // Project ID
  'your-workspace-id',       // Workspace ID
  'your-access-token'        // IMS access token
);
```

## API Reference

### RegistrationManager

Main class for managing event registration operations with Adobe I/O Events API.

```typescript
class RegistrationManager {
  constructor(
    clientId: string,
    consumerId: string,
    projectId: string,
    workspaceId: string,
    accessToken: string
  );

  async list(queryParams?: ListRegistrationQueryParams): Promise<Registration[]>;
  async get(registrationId: string): Promise<Registration>;
  async create(registrationData: RegistrationCreateModel): Promise<Registration>;
  async delete(registrationId: string): Promise<void>;
}
```

### Registration Interface

```typescript
interface Registration {
  registration_id: string;
  name: string;
  description?: string;
  webhook_url?: string;
  events_of_interest?: Array<{
    provider_id: string;
    event_code: string;
  }>;
  delivery_type: string;
  enabled: boolean;
  created_date: string;
  updated_date: string;
  runtime_action?: string;
  [key: string]: any;
}
```

### RegistrationCreateModel Interface

```typescript
interface RegistrationCreateModel {
  client_id: string;                                    // Required: Adobe I/O Client ID
  name: string;                                         // Required: Registration name
  description?: string;                                 // Optional: Registration description
  webhook_url?: string;                                 // Optional: Webhook URL for event delivery
  events_of_interest: EventsOfInterestInputModel[];     // Required: Events to subscribe to
  delivery_type: 'webhook' | 'webhook_batch' | 'journal' | 'aws_eventbridge'; // Required: Delivery method
  runtime_action?: string;                              // Optional: Runtime action for processing
  enabled?: boolean;                                    // Optional: Enable/disable registration
}
```

### EventsOfInterestInputModel Interface

```typescript
interface EventsOfInterestInputModel {
  provider_id: string;                                  // Provider ID to subscribe to
  event_code: string;                                   // Event code to subscribe to
}
```

### Method Parameters

**list(queryParams?)**
- `queryParams` (ListRegistrationQueryParams, optional): Filtering options
- **Returns**: `Promise<Registration[]>` - Array of registrations across all pages

**get(registrationId)**
- `registrationId` (string): The ID of the registration to retrieve
- **Returns**: `Promise<Registration>` - Specific registration data

**create(registrationData)**
- `registrationData` (RegistrationCreateModel): The registration input data
- **Returns**: `Promise<Registration>` - The created registration

**delete(registrationId)**
- `registrationId` (string): The ID of the registration to delete
- **Returns**: `Promise<void>` - No content returned on successful deletion

## Examples

### 1. Basic Registration Operations

```typescript
const { RegistrationManager } = require('@adobe-commerce/aio-toolkit');

// Initialize manager with Adobe I/O credentials
const registrationManager = new RegistrationManager(
  process.env.ADOBE_CLIENT_ID,
  process.env.ADOBE_CONSUMER_ID,
  process.env.ADOBE_PROJECT_ID,
  process.env.ADOBE_WORKSPACE_ID,
  process.env.ADOBE_ACCESS_TOKEN
);

const performBasicOperations = async () => {
  try {
    // List all registrations
    const allRegistrations = await registrationManager.list();
    console.log('All registrations:', allRegistrations.length);

    // Create a new registration
    const newRegistration = await registrationManager.create({
      client_id: process.env.ADOBE_CLIENT_ID,
      name: 'User Events Registration',
      description: 'Subscribe to user creation and update events',
      webhook_url: 'https://myapp.com/webhook/user-events',
      events_of_interest: [
        {
          provider_id: 'user-provider-123',
          event_code: 'com.example.user.created'
        },
        {
          provider_id: 'user-provider-123',
          event_code: 'com.example.user.updated'
        }
      ],
      delivery_type: 'webhook',
      enabled: true
    });
    console.log('Created registration:', newRegistration.registration_id);

    // Get specific registration
    const specificRegistration = await registrationManager.get(newRegistration.registration_id);
    console.log('Retrieved registration:', specificRegistration.name);

    // List with query parameters
    const enabledRegistrations = await registrationManager.list({
      enabled: true
    });
    console.log('Enabled registrations:', enabledRegistrations.length);

  } catch (error) {
    console.error('Registration operation failed:', error.message);
  }
};

performBasicOperations();
```

### 2. Advanced Registration with Error Handling

```typescript
const { RegistrationManager, IOEventsApiError } = require('@adobe-commerce/aio-toolkit');

const registrationManager = new RegistrationManager(
  process.env.ADOBE_CLIENT_ID,
  process.env.ADOBE_CONSUMER_ID,
  process.env.ADOBE_PROJECT_ID,
  process.env.ADOBE_WORKSPACE_ID,
  process.env.ADOBE_ACCESS_TOKEN
);

const createOrderEventRegistration = async () => {
  const registrationData = {
    client_id: process.env.ADOBE_CLIENT_ID,
    name: 'E-commerce Order Events',
    description: 'Registration for order lifecycle events',
    webhook_url: 'https://api.mystore.com/webhooks/orders',
    events_of_interest: [
      {
        provider_id: 'ecommerce-provider-456',
        event_code: 'com.mystore.order.placed'
      },
      {
        provider_id: 'ecommerce-provider-456',
        event_code: 'com.mystore.order.shipped'
      },
      {
        provider_id: 'ecommerce-provider-456',
        event_code: 'com.mystore.order.delivered'
      },
      {
        provider_id: 'ecommerce-provider-456',
        event_code: 'com.mystore.order.cancelled'
      }
    ],
    delivery_type: 'webhook_batch',
    enabled: true
  };

  try {
    const result = await registrationManager.create(registrationData);
    
    console.log('Registration created successfully:');
    console.log('Registration ID:', result.registration_id);
    console.log('Registration Name:', result.name);
    console.log('Webhook URL:', result.webhook_url);
    console.log('Events Subscribed:', result.events_of_interest.length);
    console.log('Delivery Type:', result.delivery_type);
    console.log('Status:', result.enabled ? 'Enabled' : 'Disabled');
    
    return result;
  } catch (error) {
    if (error instanceof IOEventsApiError) {
      // Handle Adobe I/O Events API errors
      console.error('Adobe I/O Events API Error:');
      console.error('Status Code:', error.statusCode);
      console.error('Error Code:', error.code);
      console.error('Message:', error.message);
      
      // Handle specific error cases
      if (error.statusCode === 400) {
        console.error('Invalid registration data. Check required fields and webhook URL format.');
      } else if (error.statusCode === 409) {
        console.error('Registration with this name already exists');
      }
    } else {
      // Handle other errors
      console.error('Unexpected error:', error.message);
    }
    
    return null;
  }
};

createOrderEventRegistration();
```

### 3. Registration Management and Cleanup

```typescript
const { RegistrationManager } = require('@adobe-commerce/aio-toolkit');

const registrationManager = new RegistrationManager(
  process.env.ADOBE_CLIENT_ID,
  process.env.ADOBE_CONSUMER_ID,
  process.env.ADOBE_PROJECT_ID,
  process.env.ADOBE_WORKSPACE_ID,
  process.env.ADOBE_ACCESS_TOKEN
);

const manageRegistrations = async () => {
  try {
    // List all registrations
    const allRegistrations = await registrationManager.list();
    
    console.log(`Found ${allRegistrations.length} registrations`);

    // Analyze each registration
    for (const registration of allRegistrations) {
      console.log(`\n--- Registration: ${registration.name} ---`);
      console.log(`ID: ${registration.registration_id}`);
      console.log(`Status: ${registration.enabled ? 'Enabled' : 'Disabled'}`);
      console.log(`Delivery Type: ${registration.delivery_type}`);
      console.log(`Created: ${registration.created_date}`);
      
      if (registration.webhook_url) {
        console.log(`Webhook URL: ${registration.webhook_url}`);
      }
      
      if (registration.runtime_action) {
        console.log(`Runtime Action: ${registration.runtime_action}`);
      }
      
      if (registration.events_of_interest) {
        console.log(`Subscribed to ${registration.events_of_interest.length} event(s):`);
        registration.events_of_interest.forEach(event => {
          console.log(`  - ${event.event_code} from ${event.provider_id}`);
        });
      }
    }

    // Find and manage test registrations
    const testRegistrations = allRegistrations.filter(r => 
      r.name.toLowerCase().includes('test') || 
      r.description?.toLowerCase().includes('test')
    );

    if (testRegistrations.length > 0) {
      console.log(`\nFound ${testRegistrations.length} test registration(s)`);
      
      for (const testReg of testRegistrations) {
        console.log(`Deleting test registration: ${testReg.name}`);
        await registrationManager.delete(testReg.registration_id);
        console.log('✓ Deleted successfully');
      }
    }

  } catch (error) {
    if (error.statusCode === 404) {
      console.log('Registration not found');
    } else if (error.statusCode === 403) {
      console.log('Not authorized to manage registrations');
    } else {
      console.error('Registration management failed:', error.message);
    }
  }
};

manageRegistrations();
```

## Error Handling

### IOEventsApiError Structure

RegistrationManager uses `IOEventsApiError` for structured error handling:

```typescript
try {
  const result = await registrationManager.create(registrationData);
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
const handleCommonErrors = async (registrationManager, registrationData) => {
  try {
    return await registrationManager.create(registrationData);
  } catch (error) {
    switch (error.statusCode) {
      case 400:
        console.error('Validation Error: Check required fields (client_id, name, events_of_interest)');
        if (error.message.includes('webhook_url')) {
          console.error('Invalid webhook URL format');
        }
        break;
      case 401:
        console.error('Authentication Error: Check access token');
        break;
      case 403:
        console.error('Authorization Error: Insufficient permissions');
        break;
      case 404:
        console.error('Not Found: Invalid provider_id in events_of_interest');
        break;
      case 409:
        console.error('Conflict: Registration name already exists');
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

### 1. Use Environment Variables for Client Configuration

```typescript
// ✅ Good - Use environment variables
const registrationData = {
  client_id: process.env.ADOBE_CLIENT_ID,
  name: 'Production Events',
  webhook_url: process.env.WEBHOOK_ENDPOINT_URL,
  // ... other fields
};

// ❌ Bad - Hard-coded values
const badRegistrationData = {
  client_id: 'hardcoded-client-id',
  name: 'Events',
  webhook_url: 'https://hardcoded-url.com/webhook',
  // ... other fields
};
```

### 2. Use Descriptive Registration Names and Event Codes

```typescript
// ✅ Good - Descriptive and organized
const goodRegistrationData = {
  client_id: process.env.ADOBE_CLIENT_ID,
  name: 'Customer Lifecycle Events - Production',
  description: 'Handles customer registration, profile updates, and deletion events',
  events_of_interest: [
    {
      provider_id: 'customer-service-provider',
      event_code: 'com.company.customer.registered'
    },
    {
      provider_id: 'customer-service-provider', 
      event_code: 'com.company.customer.profile.updated'
    }
  ],
  delivery_type: 'webhook'
};

// ❌ Bad - Generic and unclear
const badRegistrationData = {
  client_id: process.env.ADOBE_CLIENT_ID,
  name: 'Events',
  events_of_interest: [
    {
      provider_id: 'provider1',
      event_code: 'event1'
    }
  ],
  delivery_type: 'webhook'
};
```

### 3. Choose Appropriate Delivery Types

```typescript
// ✅ Good - Choose based on use case
const realtimeRegistration = {
  name: 'Real-time Order Notifications',
  delivery_type: 'webhook',           // For immediate processing
  webhook_url: 'https://api.mystore.com/webhooks/orders'
};

const batchRegistration = {
  name: 'Daily Analytics Events',
  delivery_type: 'webhook_batch',     // For batch processing
  webhook_url: 'https://analytics.mystore.com/webhooks/batch'
};

const journalRegistration = {
  name: 'Audit Trail Events',
  delivery_type: 'journal',           // For pulling events on demand
  enabled: true
};
```

## Integration with Other Toolkit Components

The RegistrationManager integrates seamlessly with other toolkit components:

- **[RestClient](./rest-client.md)** - Uses RestClient internally for Adobe I/O Events API calls
- **[RuntimeAction](./runtime-action.md)** - Use within action handlers for registration management
- **[WebhookAction](./webhook-action.md)** - Process webhook events from registrations
- **[EventConsumerAction](./event-consumer-action.md)** - Handle events received through registrations
- **[ProviderManager](./provider.md)** - Manage providers that registrations subscribe to
- **[EventMetadataManager](./event-metadata.md)** - Manage metadata for events in registrations
- **[AdobeAuth](./adobe-auth.md)** - Generate access tokens for RegistrationManager authentication

### WebhookAction Integration

Use RegistrationManager with WebhookAction to process registered events:

```typescript
const { 
  WebhookAction, 
  WebhookActionResponse, 
  RegistrationManager 
} = require('@adobe-commerce/aio-toolkit');

const eventWebhookHandler = WebhookAction.execute(
  'event-webhook-handler',
  async (params, ctx) => {
    const { logger } = ctx;
    const { event_data, event_code, provider_id } = params;

    try {
      // Process the event based on its type
      switch (event_code) {
        case 'com.company.order.placed':
          await processOrderPlaced(event_data);
          logger.info('Order placed event processed');
          break;
        case 'com.company.customer.registered':
          await processCustomerRegistered(event_data);
          logger.info('Customer registered event processed');
          break;
        default:
          logger.warn(`Unknown event code: ${event_code}`);
      }
      
      return WebhookActionResponse.success({
        message: 'Event processed successfully',
        event_code
      });
    } catch (error) {
      logger.error('Event processing failed:', error);
      return WebhookActionResponse.exception(error);
    }
  }
);

const processOrderPlaced = async (eventData) => {
  // Process order placed event
  console.log('Processing order:', eventData.order_id);
};

const processCustomerRegistered = async (eventData) => {
  // Process customer registration event
  console.log('Processing customer:', eventData.customer_id);
};
```

### Related Documentation:

- **[RestClient](./rest-client.md)** - For HTTP client operations used internally
- **[RuntimeAction](./runtime-action.md)** - For creating HTTP endpoints that manage registrations
- **[WebhookAction](./webhook-action.md)** - For processing webhook events from registrations
- **[EventConsumerAction](./event-consumer-action.md)** - For handling events received through registrations
- **[ProviderManager](./provider.md)** - For managing providers that registrations subscribe to
- **[EventMetadataManager](./event-metadata.md)** - For managing event metadata definitions
- **[AdobeAuth](./adobe-auth.md)** - For generating access tokens for authentication

### Common Integration Patterns:

- **RegistrationManager + WebhookAction**: Create registrations and handle webhook events
- **RegistrationManager + ProviderManager**: Manage providers and subscribe to their events
- **RegistrationManager + EventConsumerAction**: Subscribe to events and process them
- **RegistrationManager + RuntimeAction**: HTTP endpoints for registration management

## Constants Reference

RegistrationManager uses constants and configurations specific to Adobe I/O Events.

### Delivery Types:

```typescript
// Supported delivery types:
// - 'webhook': Real-time HTTP POST to webhook_url
// - 'webhook_batch': Batched HTTP POST to webhook_url
// - 'journal': Events stored for polling/pulling
// - 'aws_eventbridge': Delivery to AWS EventBridge
```

### Registration States:

```typescript
// Registration enabled states:
// - true: Registration is active and receiving events
// - false: Registration is disabled, not receiving events
```

### HTTP Status Codes:

```typescript
// Common status codes returned by Adobe I/O Events API:
// - 200: Success
// - 201: Created
// - 204: No Content (for deletions)
// - 400: Bad Request (validation errors, invalid webhook URL)
// - 401: Unauthorized (authentication failure)
// - 403: Forbidden (insufficient permissions)
// - 404: Not Found (registration or provider not found)
// - 409: Conflict (duplicate registration name)
// - 500: Internal Server Error
```

## Performance Considerations

### RegistrationManager Optimization

1. **Instance Reuse**: Reuse RegistrationManager instances across multiple operations
2. **Batch Operations**: When possible, batch multiple registration operations
3. **Caching**: Cache frequently accessed registration data to reduce API calls
4. **Error Handling**: Implement proper error handling and retry logic for webhook failures

### Best Practices for Performance

1. **Connection Management**: RestClient handles HTTP connections efficiently
2. **Token Management**: Refresh access tokens proactively to avoid authentication failures
3. **Validation**: Validate input data before making API calls to reduce failed requests
4. **Webhook Endpoints**: Ensure webhook endpoints are reliable and responsive
5. **Event Processing**: Design event handlers to be idempotent and efficient

The RegistrationManager provides a robust, type-safe interface for managing Adobe I/O Events registrations with built-in validation, error handling, and seamless integration with other Adobe Commerce AIO Toolkit components.
