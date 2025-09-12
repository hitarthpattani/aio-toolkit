# OnboardEvents Documentation

## Overview

The **OnboardEvents** component is a comprehensive orchestration utility in the Adobe Commerce AIO Toolkit that automates the complete onboarding process for Adobe I/O Events. It provides a streamlined workflow for creating providers, event metadata, and registrations in a single operation, making it easy to set up complete event-driven integrations for Adobe Commerce and other Adobe services.

## Table of Contents

- [Overview](#overview)
- [Core Features](#core-features)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Configuration](#configuration)
- [Examples](#examples)
- [Input Structure](#input-structure)
- [Output Structure](#output-structure)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)
- [Integration with Other Toolkit Components](#integration-with-other-toolkit-components)
- [Performance Considerations](#performance-considerations)

## Core Features

### 1. Complete Event Onboarding Orchestration

- **Single Operation Setup** - Creates providers, event metadata, and registrations in one coordinated process
- **Dependency Management** - Handles the proper order of creation (providers → events → registrations)
- **Relationship Mapping** - Automatically maps relationships between providers, registrations, and events
- **Atomic Operations** - Each entity type is processed independently with proper error handling

### 2. Intelligent Input Processing

- **Nested Input Parsing** - Converts hierarchical input structure to flat entities with relationships
- **Data Validation** - Validates input structure and required fields before processing
- **Entity Extraction** - Extracts providers, registrations, and events with proper cross-references
- **Flexible Configuration** - Supports optional fields with sensible defaults

### 3. Robust State Management

- **Duplicate Detection** - Automatically detects and skips existing providers, events, and registrations
- **Raw Data Preservation** - Preserves original API response data for existing and newly created items
- **Comprehensive Results** - Detailed reporting of created, skipped, and failed operations
- **Error Recovery** - Continues processing even when individual items fail

### 4. Adobe I/O Events Integration

- **Multi-Service Coordination** - Integrates ProviderManager, EventMetadataManager, and RegistrationManager
- **Authentication Management** - Handles Adobe I/O authentication across all services
- **API Error Handling** - Structured error handling for all Adobe I/O Events API operations
- **Response Normalization** - Consistent response format regardless of underlying API variations

## Usage

### Basic Import

```typescript
const { OnboardEvents } = require('@adobe-commerce/aio-toolkit');
```

### TypeScript Import

```typescript
import { 
  OnboardEvents,
  OnboardEventsInput,
  OnboardEventsResponse,
  OnboardProvider,
  OnboardRegistration,
  OnboardEvent
} from '@adobe-commerce/aio-toolkit';
```

### Instance Creation

```typescript
const onboardEvents = new OnboardEvents(
  'My Adobe Commerce Project',    // Project name for logging
  'your-consumer-id',             // Adobe I/O Consumer ID
  'your-project-id',              // Adobe I/O Project ID
  'your-workspace-id',            // Adobe I/O Workspace ID
  'your-api-key',                 // Adobe I/O API Key (Client ID)
  'your-access-token'             // Adobe I/O Access Token
);
```

## API Reference

### OnboardEvents Class

Main orchestration class for handling the complete Adobe I/O Events onboarding workflow.

```typescript
class OnboardEvents {
  constructor(
    projectName: string,
    consumerId: string,
    projectId: string,
    workspaceId: string,
    apiKey: string,
    accessToken: string
  );

  async process(input: OnboardEventsInput): Promise<OnboardEventsResponse>;
  getLogger(): Logger;
}
```

### Constructor Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectName` | `string` | Yes | Display name for the project (used in logging and provider labels) |
| `consumerId` | `string` | Yes | Adobe I/O Consumer organization ID |
| `projectId` | `string` | Yes | Adobe I/O Project ID |
| `workspaceId` | `string` | Yes | Adobe I/O Workspace ID |
| `apiKey` | `string` | Yes | Adobe I/O API Key (Client ID) |
| `accessToken` | `string` | Yes | Adobe I/O Access Token (IMS token) |

### Methods

**process(input)**
- `input` (OnboardEventsInput): Complete onboarding configuration
- **Returns**: `Promise<OnboardEventsResponse>` - Detailed results of all operations

**getLogger()**
- **Returns**: `Logger` - Configured logger instance for consistent logging

## Configuration

### OnboardEventsInput Structure

```typescript
interface OnboardEventsInput {
  providers: OnboardProvider[];
}

interface OnboardProvider {
  key: string;                              // Unique provider identifier
  label: string;                            // Provider display name
  description: string;                      // Provider description
  docsUrl: string | null;                   // Documentation URL (optional)
  registrations: OnboardRegistration[];     // Array of registrations
}

interface OnboardRegistration {
  key: string;                              // Unique registration identifier
  label: string;                            // Registration display name
  description: string;                      // Registration description
  events: OnboardEvent[];                   // Array of events
}

interface OnboardEvent {
  eventCode: string;                        // CloudEvents-compliant event code
  runtimeAction: string;                    // Adobe I/O Runtime action endpoint
  deliveryType: string;                     // Delivery type ('webhook', 'journal')
  sampleEventTemplate: Record<string, any>; // Sample event payload
}
```

### OnboardEventsResponse Structure

```typescript
interface OnboardEventsResponse {
  createdProviders: CreateProviderResult[];      // Provider creation results
  createdEvents: CreateEventResult[];           // Event metadata creation results
  createdRegistrations: CreateRegistrationResult[]; // Registration creation results
}
```

## Examples

### 1. Basic E-commerce Event Onboarding

```typescript
import { OnboardEvents } from '@adobe-commerce/aio-toolkit';

const onboardEvents = new OnboardEvents(
  'My E-commerce Store',
  process.env.ADOBE_CONSUMER_ID!,
  process.env.ADOBE_PROJECT_ID!,
  process.env.ADOBE_WORKSPACE_ID!,
  process.env.ADOBE_API_KEY!,
  process.env.ADOBE_ACCESS_TOKEN!
);

const basicOnboardingExample = async () => {
  const input = {
    providers: [
      {
        key: 'ecommerce-provider',
        label: 'E-commerce Events Provider',
        description: 'Provider for e-commerce platform events',
        docsUrl: 'https://docs.mystore.com/events',
        registrations: [
          {
            key: 'order-events',
            label: 'Order Events Registration',
            description: 'Registration for order-related events',
            events: [
              {
                eventCode: 'com.mystore.order.placed',
                runtimeAction: 'mystore/order-placed-handler',
                deliveryType: 'webhook',
                sampleEventTemplate: {
                  orderId: 'ord_123456',
                  customerId: 'cust_789',
                  totalAmount: 99.99,
                  currency: 'USD',
                  status: 'placed',
                  timestamp: '2023-01-01T12:00:00Z'
                }
              },
              {
                eventCode: 'com.mystore.order.shipped',
                runtimeAction: 'mystore/order-shipped-handler',
                deliveryType: 'journal',
                sampleEventTemplate: {
                  orderId: 'ord_123456',
                  trackingNumber: 'TN123456789',
                  carrier: 'UPS',
                  shippedAt: '2023-01-02T10:00:00Z'
                }
              }
            ]
          }
        ]
      }
    ]
  };

  try {
    const result = await onboardEvents.process(input);
    
    console.log('Onboarding completed successfully!');
    console.log(`Providers: ${result.createdProviders.length} processed`);
    console.log(`Events: ${result.createdEvents.length} processed`);
    console.log(`Registrations: ${result.createdRegistrations.length} processed`);
    
    // Check results
    result.createdProviders.forEach(provider => {
      if (provider.created) {
        console.log(`✅ Created provider: ${provider.provider.label}`);
      } else if (provider.skipped) {
        console.log(`⏭️ Skipped existing provider: ${provider.provider.label}`);
      } else {
        console.log(`❌ Failed to create provider: ${provider.error}`);
      }
    });
    
    return result;
  } catch (error) {
    console.error('Onboarding failed:', error.message);
    return null;
  }
};

basicOnboardingExample();
```

### 2. Multi-Provider Setup

```typescript
import { OnboardEvents } from '@adobe-commerce/aio-toolkit';

const onboardEvents = new OnboardEvents(
  'Enterprise Commerce Platform',
  process.env.ADOBE_CONSUMER_ID!,
  process.env.ADOBE_PROJECT_ID!,
  process.env.ADOBE_WORKSPACE_ID!,
  process.env.ADOBE_API_KEY!,
  process.env.ADOBE_ACCESS_TOKEN!
);

const multiProviderExample = async () => {
  const input = {
    providers: [
      {
        key: 'commerce-core',
        label: 'Commerce Core Events',
        description: 'Core commerce platform events',
        docsUrl: 'https://docs.enterprise.com/commerce-events',
        registrations: [
          {
            key: 'order-events',
            label: 'Order Events',
            description: 'Order lifecycle events',
            events: [
              {
                eventCode: 'com.enterprise.commerce.order.created',
                runtimeAction: 'commerce/order-created',
                deliveryType: 'webhook',
                sampleEventTemplate: {
                  orderId: 'ord_98765',
                  customerId: 'cust_12345',
                  totalAmount: 109.97,
                  status: 'pending'
                }
              }
            ]
          }
        ]
      },
      {
        key: 'inventory-system',
        label: 'Inventory Management',
        description: 'Inventory and stock events',
        docsUrl: null,
        registrations: [
          {
            key: 'stock-events',
            label: 'Stock Events',
            description: 'Stock level changes',
            events: [
              {
                eventCode: 'com.enterprise.inventory.stock.updated',
                runtimeAction: 'inventory/stock-updated',
                deliveryType: 'journal',
                sampleEventTemplate: {
                  productId: 'prod_001',
                  previousQuantity: 100,
                  newQuantity: 85
                }
              }
            ]
          }
        ]
      }
    ]
  };

  try {
    const result = await onboardEvents.process(input);
    
    // Quick results summary
    const summary = {
      providers: { created: 0, skipped: 0, failed: 0 },
      events: { created: 0, skipped: 0, failed: 0 },
      registrations: { created: 0, skipped: 0, failed: 0 }
    };

    result.createdProviders.forEach(p => p.created ? summary.providers.created++ : p.skipped ? summary.providers.skipped++ : summary.providers.failed++);
    result.createdEvents.forEach(e => e.created ? summary.events.created++ : e.skipped ? summary.events.skipped++ : summary.events.failed++);
    result.createdRegistrations.forEach(r => r.created ? summary.registrations.created++ : r.skipped ? summary.registrations.skipped++ : summary.registrations.failed++);
    
    console.log('Onboarding Summary:', summary);
    return result;
  } catch (error) {
    console.error('Multi-provider onboarding failed:', error.message);
    return null;
  }
};
```

### 3. Error Handling and Recovery

```typescript
import { OnboardEvents, IOEventsApiError } from '@adobe-commerce/aio-toolkit';

const handleOnboardingWithErrors = async () => {
  const onboardEvents = new OnboardEvents(
    'Commerce System',
    process.env.ADOBE_CONSUMER_ID!,
    process.env.ADOBE_PROJECT_ID!,
    process.env.ADOBE_WORKSPACE_ID!,
    process.env.ADOBE_API_KEY!,
    process.env.ADOBE_ACCESS_TOKEN!
  );

  try {
    const result = await onboardEvents.process(input);
    
    // Check for failures in individual operations
    const failures = {
      providers: result.createdProviders.filter(p => p.error),
      events: result.createdEvents.filter(e => e.error),
      registrations: result.createdRegistrations.filter(r => r.error)
    };
    
    if (failures.providers.length + failures.events.length + failures.registrations.length > 0) {
      console.log('Some operations failed:', {
        failedProviders: failures.providers.length,
        failedEvents: failures.events.length,
        failedRegistrations: failures.registrations.length
      });
      
      // Log specific errors
      failures.providers.forEach(p => console.error(`Provider ${p.provider.key}: ${p.error}`));
      failures.events.forEach(e => console.error(`Event ${e.event.eventCode}: ${e.error}`));
      failures.registrations.forEach(r => console.error(`Registration ${r.registration.key}: ${r.error}`));
    }
    
    return result;
    
  } catch (error) {
    if (error instanceof IOEventsApiError) {
      console.error('Adobe I/O API Error:', {
        statusCode: error.statusCode,
        code: error.code,
        message: error.message
      });
    } else {
      console.error('Unexpected error:', error.message);
    }
    
    return null;
  }
};
```

## Input Structure

### Hierarchical Input Format

The OnboardEvents component accepts a nested hierarchical structure that represents the relationship between providers, registrations, and events:

```typescript
{
  providers: [
    {
      key: "provider-key",                    // Unique identifier
      label: "Provider Display Name",         // Human-readable name
      description: "Provider description",    // Detailed description
      docsUrl: "https://docs.example.com",    // Documentation URL (optional)
      registrations: [                       // Array of registrations
        {
          key: "registration-key",            // Unique identifier
          label: "Registration Display Name", // Human-readable name
          description: "Registration desc",   // Detailed description
          events: [                          // Array of events
            {
              eventCode: "com.example.event", // CloudEvents-compliant code
              runtimeAction: "ns/action",     // Runtime action endpoint
              deliveryType: "webhook",        // 'webhook' or 'journal'
              sampleEventTemplate: {         // Sample event payload
                field1: "value1",
                field2: "value2"
              }
            }
          ]
        }
      ]
    }
  ]
}
```

### Internal Entity Parsing

OnboardEvents internally converts the hierarchical structure into flat entities with relationships:

**ParsedProvider:**
```typescript
{
  key: string;
  label: string;
  description: string;
  docsUrl: string | null;
}
```

**ParsedRegistration:**
```typescript
{
  key: string;
  label: string;
  description: string;
  providerKey: string;        // Reference to parent provider
}
```

**ParsedEvent:**
```typescript
{
  eventCode: string;
  runtimeAction: string;
  deliveryType: string;
  sampleEventTemplate: any;
  registrationKey: string;    // Reference to parent registration
  providerKey: string;        // Reference to root provider
}
```

## Output Structure

### Comprehensive Results

OnboardEvents provides detailed results for each operation:

```typescript
{
  createdProviders: [
    {
      created: boolean,         // Whether provider was newly created
      skipped: boolean,         // Whether provider already existed
      provider: {
        id?: string,           // Adobe I/O Events provider ID
        instanceId?: string,   // Technical instance ID
        key: string,           // Original key from input
        label: string,         // Provider label
        originalLabel: string, // Original label before project prefixing
        description?: string,  // Provider description
        docsUrl?: string      // Documentation URL
      },
      error?: string,          // Error message if creation failed
      reason?: string,         // Reason for skipping (if applicable)
      raw?: any               // Raw API response data
    }
  ],
  createdEvents: [
    {
      created: boolean,        // Whether event was newly created
      skipped: boolean,        // Whether event already existed
      event: {
        id?: string,          // Event metadata ID
        eventCode: string,    // CloudEvents event code
        label?: string,       // Event display label
        description?: string, // Event description
        sampleEventTemplate?: any // Sample event payload
      },
      provider?: {            // Reference to associated provider
        id?: string,
        key: string,
        label: string,
        originalLabel: string
      },
      error?: string,         // Error message if creation failed
      reason?: string,        // Reason for skipping (if applicable)
      raw?: any              // Raw API response data
    }
  ],
  createdRegistrations: [
    {
      created: boolean,       // Whether registration was newly created
      skipped: boolean,       // Whether registration already existed
      registration: {
        id?: string,         // Adobe I/O Events registration ID
        key: string,         // Original key from input
        label: string,       // Registration label
        originalLabel: string, // Original label before project prefixing
        description?: string, // Registration description
        clientId?: string,   // Adobe I/O Client ID
        name?: string,       // Registration name
        webhookUrl?: string, // Webhook URL (if applicable)
        deliveryType?: string, // Delivery type ('webhook' or 'journal')
        runtimeAction?: string // Runtime action endpoint
      },
      provider?: {           // Reference to associated provider
        id?: string,
        key: string,
        label: string,
        originalLabel: string
      },
      error?: string,        // Error message if creation failed
      reason?: string,       // Reason for skipping (if applicable)
      raw?: any             // Raw API response data
    }
  ]
}
```

## Error Handling

### Structured Error Management

OnboardEvents provides comprehensive error handling at multiple levels:

```typescript
const handleOnboardingErrors = async () => {
  try {
    const result = await onboardEvents.process(input);
    
    // Check for individual item failures
    const failedProviders = result.createdProviders.filter(p => p.error);
    const failedEvents = result.createdEvents.filter(e => e.error);
    const failedRegistrations = result.createdRegistrations.filter(r => r.error);
    
    if (failedProviders.length > 0) {
      console.log('Failed providers:', failedProviders.map(p => ({
        key: p.provider.key,
        error: p.error
      })));
    }
    
    if (failedEvents.length > 0) {
      console.log('Failed events:', failedEvents.map(e => ({
        eventCode: e.event.eventCode,
        error: e.error
      })));
    }
    
    if (failedRegistrations.length > 0) {
      console.log('Failed registrations:', failedRegistrations.map(r => ({
        key: r.registration.key,
        error: r.error
      })));
    }
    
  } catch (error) {
    // Handle overall process failures
    console.error('Overall onboarding process failed:', error.message);
    
    // Handle specific error types
    if (error.message.includes('Consumer ID is required')) {
      console.error('Configuration error: Check Adobe I/O credentials');
    } else if (error.message.includes('Access token')) {
      console.error('Authentication error: Refresh your access token');
    } else {
      console.error('Unexpected error:', error);
    }
  }
};
```

### Common Error Scenarios

```typescript
const handleCommonErrors = async (onboardEvents, input) => {
  try {
    return await onboardEvents.process(input);
  } catch (error) {
    switch (true) {
      case error.message.includes('required'):
        console.error('Configuration Error: Missing required parameters');
        break;
      case error.message.includes('authentication'):
        console.error('Authentication Error: Check access token validity');
        break;
      case error.message.includes('authorization'):
        console.error('Authorization Error: Insufficient permissions');
        break;
      case error.message.includes('network'):
        console.error('Network Error: Check internet connection and Adobe I/O status');
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
const onboardEvents = new OnboardEvents(
  'My Commerce Project',
  process.env.ADOBE_CONSUMER_ID!,
  process.env.ADOBE_PROJECT_ID!,
  process.env.ADOBE_WORKSPACE_ID!,
  process.env.ADOBE_API_KEY!,
  process.env.ADOBE_ACCESS_TOKEN!
);

// ❌ Bad - Hard-coded credentials
const badOnboardEvents = new OnboardEvents(
  'Project',
  'hardcoded-consumer-id',
  'hardcoded-project-id',
  // ... other hardcoded values
);
```

### 2. Use Descriptive Keys and Labels

```typescript
// ✅ Good - Descriptive and unique identifiers
const goodInput = {
  providers: [
    {
      key: 'ecommerce-order-system-v2',
      label: 'E-commerce Order Management System v2.0',
      description: 'Handles all order lifecycle events for the e-commerce platform',
      registrations: [
        {
          key: 'order-lifecycle-events',
          label: 'Order Lifecycle Event Registration',
          description: 'Registers for order creation, update, and completion events'
        }
      ]
    }
  ]
};

// ❌ Bad - Generic or unclear identifiers
const badInput = {
  providers: [
    {
      key: 'provider1',
      label: 'Provider',
      description: 'Events',
      registrations: [
        {
          key: 'reg1',
          label: 'Registration',
          description: 'Events'
        }
      ]
    }
  ]
};
```

### 3. Follow CloudEvents Naming Convention

```typescript
// ✅ Good - CloudEvents-compliant event codes
const goodEventCodes = [
  'com.mycompany.ecommerce.order.created',
  'com.mycompany.ecommerce.order.updated',
  'com.mycompany.ecommerce.customer.registered',
  'com.mycompany.inventory.stock.low'
];

// ❌ Bad - Non-compliant event codes
const badEventCodes = [
  'order_created',
  'ORDER-UPDATED',
  'customer.reg',
  'stock_alert'
];
```

### 4. Structure Input Hierarchically

```typescript
// ✅ Good - Logical grouping of related events
const wellStructuredInput = {
  providers: [
    {
      key: 'commerce-core',
      label: 'Commerce Core Events',
      registrations: [
        {
          key: 'customer-events',
          label: 'Customer Events',
          events: [
            { eventCode: 'com.company.customer.created', /* ... */ },
            { eventCode: 'com.company.customer.updated', /* ... */ },
            { eventCode: 'com.company.customer.deleted', /* ... */ }
          ]
        },
        {
          key: 'order-events',
          label: 'Order Events',
          events: [
            { eventCode: 'com.company.order.created', /* ... */ },
            { eventCode: 'com.company.order.shipped', /* ... */ }
          ]
        }
      ]
    }
  ]
};

// ❌ Bad - Mixed or illogical grouping
const poorlyStructuredInput = {
  providers: [
    {
      key: 'mixed-provider',
      label: 'Mixed Events',
      registrations: [
        {
          key: 'random-events',
          label: 'Random Events',
          events: [
            { eventCode: 'com.company.customer.created', /* ... */ },
            { eventCode: 'com.company.inventory.updated', /* ... */ },
            { eventCode: 'com.company.order.created', /* ... */ }
          ]
        }
      ]
    }
  ]
};
```

### 5. Handle Results Comprehensively

```typescript
// ✅ Good - Comprehensive result handling
const handleResults = (result: OnboardEventsResponse) => {
  const summary = {
    providers: {
      created: result.createdProviders.filter(p => p.created).length,
      skipped: result.createdProviders.filter(p => p.skipped).length,
      failed: result.createdProviders.filter(p => p.error).length
    },
    events: {
      created: result.createdEvents.filter(e => e.created).length,
      skipped: result.createdEvents.filter(e => e.skipped).length,
      failed: result.createdEvents.filter(e => e.error).length
    },
    registrations: {
      created: result.createdRegistrations.filter(r => r.created).length,
      skipped: result.createdRegistrations.filter(r => r.skipped).length,
      failed: result.createdRegistrations.filter(r => r.error).length
    }
  };
  
  console.log('Onboarding Summary:', summary);
  
  // Handle failures
  if (summary.providers.failed > 0 || summary.events.failed > 0 || summary.registrations.failed > 0) {
    console.warn('Some operations failed - check individual results for details');
  }
  
  return summary;
};

// ❌ Bad - Ignoring detailed results
const badResultHandling = (result: OnboardEventsResponse) => {
  console.log('Onboarding completed');
  // Missing detailed analysis and error handling
};
```

## Integration with Other Toolkit Components

The OnboardEvents component orchestrates multiple toolkit components:

### Internal Component Usage

- **[InputParser](./input-parser.md)** - Converts hierarchical input to flat entities with relationships
- **[ProviderManager](./provider.md)** - Creates and manages Adobe I/O Events providers
- **[EventMetadataManager](./event-metadata.md)** - Creates and manages event metadata definitions
- **[RegistrationManager](./registration.md)** - Creates and manages event registrations
- **[AdobeAuth](./adobe-auth.md)** - Handles authentication for all Adobe I/O API calls

### RuntimeAction Integration

Use OnboardEvents within RuntimeAction handlers for dynamic event setup:

```typescript
import { 
  RuntimeAction, 
  RuntimeActionResponse, 
  OnboardEvents,
  HttpMethod, 
  HttpStatus 
} from '@adobe-commerce/aio-toolkit';

const dynamicOnboardingAction = RuntimeAction.execute(
  'dynamic-event-onboarding',
  [HttpMethod.POST],
  ['onboardingConfig'],
  ['Authorization'],
  async (params, ctx) => {
    const { logger } = ctx;
    const { onboardingConfig } = params;

    try {
      const onboardEvents = new OnboardEvents(
        'Dynamic Commerce Setup',
        process.env.ADOBE_CONSUMER_ID!,
        process.env.ADOBE_PROJECT_ID!,
        process.env.ADOBE_WORKSPACE_ID!,
        process.env.ADOBE_API_KEY!,
        process.env.ADOBE_ACCESS_TOKEN!
      );

      const result = await onboardEvents.process(onboardingConfig);
      
      const summary = {
        providersCreated: result.createdProviders.filter(p => p.created).length,
        eventsCreated: result.createdEvents.filter(e => e.created).length,
        registrationsCreated: result.createdRegistrations.filter(r => r.created).length,
        totalOperations: result.createdProviders.length + result.createdEvents.length + result.createdRegistrations.length
      };
      
      logger.info('Dynamic onboarding completed', summary);
      
      return RuntimeActionResponse.success({
        message: 'Event onboarding completed successfully',
        summary,
        detailedResults: result
      });
    } catch (error) {
      logger.error('Dynamic onboarding failed:', error);
      return RuntimeActionResponse.error(HttpStatus.INTERNAL_ERROR, 'Onboarding process failed');
    }
  }
);

exports.main = dynamicOnboardingAction;
```

### Related Documentation:

- **[ProviderManager](./provider.md)** - For understanding provider creation and management
- **[EventMetadataManager](./event-metadata.md)** - For understanding event metadata creation
- **[RegistrationManager](./registration.md)** - For understanding registration creation and management
- **[RuntimeAction](./runtime-action.md)** - For creating HTTP endpoints that handle onboarding
- **[EventConsumerAction](./event-consumer-action.md)** - For processing events created by OnboardEvents
- **[AdobeAuth](./adobe-auth.md)** - For generating access tokens for authentication
