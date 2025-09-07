# ProviderManager Documentation

## Overview

The **ProviderManager** provides a comprehensive interface for managing event providers within Adobe I/O Events. It handles creating, retrieving, listing, and deleting event providers, with built-in validation, error handling, and REST client integration within the Adobe Commerce AIO Toolkit.

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

### 1. Provider Management

- **List providers** with filtering options
- **Get specific providers** by provider ID with query parameters
- **Create new providers** with validation and custom metadata
- **Delete providers** by provider ID

### 2. Adobe I/O Events Integration

- **Adobe Developer Console** authentication support
- **REST API client** integration for HTTP operations
- **Data residency** support (US and Europe regions)
- **HAL+JSON response** handling with hypermedia links

### 3. Provider Configuration

- **Custom provider metadata** support with 3rd party events
- **Instance ID management** for unique provider identification
- **Documentation URL** integration for provider references
- **Event delivery format** configuration

### 4. Error Handling

- **IOEventsApiError** for structured error responses
- **HTTP status code** mapping for different error types
- **Validation error** handling with detailed messages
- **Network error** handling and retry logic

## Usage

### Basic Import

```typescript
const { ProviderManager } = require('@adobe-commerce/aio-toolkit');
```

### TypeScript Import

```typescript
import { 
  ProviderManager, 
  Provider, 
  ProviderInputModel,
  ListProvidersQueryParams,
  GetProviderQueryParams 
} from '@adobe-commerce/aio-toolkit';
```

### Manager Instantiation

```typescript
const providerManager = new ProviderManager(
  'your-client-id',          // Adobe I/O Client ID
  'your-consumer-id',        // Consumer organization ID
  'your-project-id',         // Project ID
  'your-workspace-id',       // Workspace ID
  'your-access-token'        // IMS access token
);
```

## API Reference

### ProviderManager

Main class for managing event provider operations with Adobe I/O Events API.

```typescript
class ProviderManager {
  constructor(
    clientId: string,
    consumerId: string,
    projectId: string,
    workspaceId: string,
    accessToken: string
  );

  async list(queryParams?: ListProvidersQueryParams): Promise<Provider[]>;
  async get(providerId: string, queryParams?: GetProviderQueryParams): Promise<Provider>;
  async create(providerData: ProviderInputModel): Promise<Provider>;
  async delete(providerId: string): Promise<void>;
}
```

### Provider Interface

```typescript
interface Provider {
  id: string;
  label: string;
  description: string;
  source: string;
  docs_url?: string;
  provider_metadata: string;
  instance_id?: string;
  event_delivery_format: string;
  publisher: string;
  _links?: {
    'rel:eventmetadata'?: HALLink;
    'rel:update'?: HALLink;
    self?: HALLink;
  };
}
```

### ProviderInputModel Interface

```typescript
interface ProviderInputModel {
  label: string;                         // Required: Provider display name
  description?: string;                  // Optional: Provider description
  docs_url?: string;                     // Optional: Documentation URL
  provider_metadata?: string;            // Optional: Provider metadata ID (default: '3rd_party_custom_events')
  instance_id?: string;                  // Optional: Technical instance ID
  data_residency_region?: string;        // Optional: Data region (default: 'va6')
}
```

### Query Parameter Interfaces

```typescript
interface ListProvidersQueryParams {
  providerMetadataId?: string;           // Filter by provider metadata ID
  instanceId?: string;                   // Filter by instance ID
  providerMetadataIds?: string[];        // Filter by multiple metadata IDs
  eventmetadata?: boolean;               // Include event metadata in response
}

interface GetProviderQueryParams {
  eventmetadata?: boolean;               // Include event metadata in response
}
```

### Method Parameters

**list(queryParams?)**
- `queryParams` (ListProvidersQueryParams, optional): Filtering and metadata options
- **Returns**: `Promise<Provider[]>` - Array of providers

**get(providerId, queryParams?)**
- `providerId` (string): The ID of the provider to retrieve
- `queryParams` (GetProviderQueryParams, optional): Query options
- **Returns**: `Promise<Provider>` - Specific provider data

**create(providerData)**
- `providerData` (ProviderInputModel): The provider input data
- **Returns**: `Promise<Provider>` - The created provider

**delete(providerId)**
- `providerId` (string): The ID of the provider to delete
- **Returns**: `Promise<void>` - No content returned on successful deletion

## Examples

### 1. Basic Provider Operations

```typescript
const { ProviderManager } = require('@adobe-commerce/aio-toolkit');

// Initialize manager with Adobe I/O credentials
const providerManager = new ProviderManager(
  process.env.ADOBE_CLIENT_ID,
  process.env.ADOBE_CONSUMER_ID,
  process.env.ADOBE_PROJECT_ID,
  process.env.ADOBE_WORKSPACE_ID,
  process.env.ADOBE_ACCESS_TOKEN
);

const performBasicOperations = async () => {
  try {
    // List all providers
    const allProviders = await providerManager.list();
    console.log('All providers:', allProviders.length);

    // Create a new provider
    const newProvider = await providerManager.create({
      label: 'My Custom Provider',
      description: 'Provider for custom business events',
      docs_url: 'https://docs.example.com/events',
      provider_metadata: '3rd_party_custom_events',
      instance_id: 'production-instance',
      data_residency_region: 'va6'
    });
    console.log('Created provider:', newProvider.id);

    // Get specific provider with event metadata
    const specificProvider = await providerManager.get(newProvider.id, {
      eventmetadata: true
    });
    console.log('Retrieved provider:', specificProvider.label);

    // List providers with filtering
    const filteredProviders = await providerManager.list({
      providerMetadataId: '3rd_party_custom_events',
      eventmetadata: true
    });
    console.log('Filtered providers:', filteredProviders.length);

  } catch (error) {
    console.error('Provider operation failed:', error.message);
  }
};

performBasicOperations();
```

### 2. Provider Management with Error Handling

```typescript
const { ProviderManager, IOEventsApiError } = require('@adobe-commerce/aio-toolkit');

const providerManager = new ProviderManager(
  process.env.ADOBE_CLIENT_ID,
  process.env.ADOBE_CONSUMER_ID,
  process.env.ADOBE_PROJECT_ID,
  process.env.ADOBE_WORKSPACE_ID,
  process.env.ADOBE_ACCESS_TOKEN
);

const createProviderWithErrorHandling = async () => {
  const providerData = {
    label: 'E-commerce Events Provider',
    description: 'Provider for e-commerce platform events',
    docs_url: 'https://docs.mystore.com/events',
    provider_metadata: '3rd_party_custom_events',
    instance_id: 'ecommerce-prod-v1',
    data_residency_region: 'irl1' // Europe region
  };

  try {
    const result = await providerManager.create(providerData);
    
    console.log('Provider created successfully:');
    console.log('Provider ID:', result.id);
    console.log('Provider Label:', result.label);
    console.log('Instance ID:', result.instance_id);
    console.log('Documentation URL:', result.docs_url);
    
    return result;
  } catch (error) {
    if (error instanceof IOEventsApiError) {
      // Handle Adobe I/O Events API errors
      console.error('Adobe I/O Events API Error:');
      console.error('Status Code:', error.statusCode);
      console.error('Error Code:', error.code);
      console.error('Message:', error.message);
      
      // Handle specific error cases
      if (error.statusCode === 409) {
        console.error('Provider with this instance_id already exists');
      } else if (error.statusCode === 400) {
        console.error('Invalid provider data provided');
      }
    } else {
      // Handle other errors
      console.error('Unexpected error:', error.message);
    }
    
    return null;
  }
};

createProviderWithErrorHandling();
```

### 3. Provider Cleanup and Management

```typescript
const { ProviderManager } = require('@adobe-commerce/aio-toolkit');

const providerManager = new ProviderManager(
  process.env.ADOBE_CLIENT_ID,
  process.env.ADOBE_CONSUMER_ID,
  process.env.ADOBE_PROJECT_ID,
  process.env.ADOBE_WORKSPACE_ID,
  process.env.ADOBE_ACCESS_TOKEN
);

const manageProviders = async () => {
  try {
    // List providers with specific metadata
    const customProviders = await providerManager.list({
      providerMetadataId: '3rd_party_custom_events'
    });
    
    console.log(`Found ${customProviders.length} custom providers`);

    // Get detailed information for each provider
    for (const provider of customProviders) {
      const detailedProvider = await providerManager.get(provider.id, {
        eventmetadata: true
      });
      
      console.log(`Provider: ${detailedProvider.label}`);
      console.log(`Instance: ${detailedProvider.instance_id}`);
      console.log(`Metadata: ${detailedProvider.provider_metadata}`);
      
      // Check if provider has event metadata links
      if (detailedProvider._links?.['rel:eventmetadata']) {
        console.log('Has event metadata available');
      }
    }

    // Delete specific provider (be careful in production!)
    const providerToDelete = customProviders.find(p => 
      p.instance_id === 'test-provider'
    );
    
    if (providerToDelete) {
      await providerManager.delete(providerToDelete.id);
      console.log('Test provider deleted successfully');
    }

  } catch (error) {
    if (error.statusCode === 404) {
      console.log('Provider not found');
    } else if (error.statusCode === 403) {
      console.log('Not authorized to manage providers');
    } else {
      console.error('Provider management failed:', error.message);
    }
  }
};

manageProviders();
```

## Error Handling

### IOEventsApiError Structure

ProviderManager uses `IOEventsApiError` for structured error handling:

```typescript
try {
  const result = await providerManager.create(providerData);
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
const handleCommonErrors = async (providerManager, providerData) => {
  try {
    return await providerManager.create(providerData);
  } catch (error) {
    switch (error.statusCode) {
      case 400:
        console.error('Validation Error: Check required fields (label is required)');
        break;
      case 401:
        console.error('Authentication Error: Check access token');
        break;
      case 403:
        console.error('Authorization Error: Insufficient permissions');
        break;
      case 404:
        console.error('Not Found: Invalid provider ID or resource');
        break;
      case 409:
        console.error('Conflict: Provider with instance_id already exists');
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
const providerManager = new ProviderManager(
  process.env.ADOBE_CLIENT_ID,
  process.env.ADOBE_CONSUMER_ID,
  process.env.ADOBE_PROJECT_ID,
  process.env.ADOBE_WORKSPACE_ID,
  process.env.ADOBE_ACCESS_TOKEN
);

// ❌ Bad - Hard-coded credentials
const badManager = new ProviderManager(
  'hardcoded-client-id',
  'hardcoded-consumer-id',
  // ... other hardcoded values
);
```

### 2. Use Descriptive Provider Labels and Instance IDs

```typescript
// ✅ Good - Descriptive and unique identifiers
const goodProviderData = {
  label: 'E-commerce Order Events',
  description: 'Provider for order processing events',
  instance_id: 'ecommerce-orders-prod-v2',
  provider_metadata: '3rd_party_custom_events'
};

// ❌ Bad - Generic or unclear identifiers
const badProviderData = {
  label: 'Events',
  instance_id: 'provider1',
  provider_metadata: '3rd_party_custom_events'
};
```

### 3. Choose Appropriate Data Residency Region

```typescript
// ✅ Good - Specify region based on data requirements
const euProvider = {
  label: 'EU Customer Events',
  description: 'GDPR-compliant customer events',
  data_residency_region: 'irl1', // Europe
  instance_id: 'eu-customers-prod'
};

const usProvider = {
  label: 'US Order Events',
  description: 'US-based order processing events',
  data_residency_region: 'va6', // US (default)
  instance_id: 'us-orders-prod'
};
```

## Integration with Other Toolkit Components

The ProviderManager integrates seamlessly with other toolkit components:

- **[RestClient](./rest-client.md)** - Uses RestClient internally for Adobe I/O Events API calls
- **[RuntimeAction](./runtime-action.md)** - Use within action handlers for provider management operations
- **[EventConsumerAction](./event-consumer-action.md)** - Process events from managed providers
- **[EventMetadataManager](./event-metadata.md)** - Manage event metadata for created providers
- **[WebhookAction](./webhook-action.md)** - Handle webhook events from providers
- **[AdobeAuth](./adobe-auth.md)** - Generate access tokens for ProviderManager authentication

### RuntimeAction Integration

Use ProviderManager within RuntimeAction handlers:

```typescript
const { 
  RuntimeAction, 
  RuntimeActionResponse, 
  ProviderManager,
  HttpMethod, 
  HttpStatus 
} = require('@adobe-commerce/aio-toolkit');

const providerManagementAction = RuntimeAction.execute(
  'provider-management',
  [HttpMethod.POST],
  ['operation', 'providerData'],
  ['Authorization'],
  async (params, ctx) => {
    const { logger } = ctx;
    const { operation, providerData } = params;

    try {
      const providerManager = new ProviderManager(
        process.env.ADOBE_CLIENT_ID,
        process.env.ADOBE_CONSUMER_ID,
        process.env.ADOBE_PROJECT_ID,
        process.env.ADOBE_WORKSPACE_ID,
        process.env.ADOBE_ACCESS_TOKEN
      );

      let result;
      switch (operation) {
        case 'create':
          result = await providerManager.create(providerData);
          logger.info('Provider created successfully');
          break;
        case 'list':
          result = await providerManager.list();
          logger.info('Providers listed successfully');
          break;
        default:
          throw new Error(`Invalid operation: ${operation}`);
      }
      
      return RuntimeActionResponse.success({
        message: `Provider ${operation} completed`,
        data: result
      });
    } catch (error) {
      logger.error('Provider management failed:', error);
      return RuntimeActionResponse.error(HttpStatus.INTERNAL_ERROR, 'Provider operation failed');
    }
  }
);
```

### Related Documentation:

- **[RestClient](./rest-client.md)** - For HTTP client operations used internally
- **[RuntimeAction](./runtime-action.md)** - For creating HTTP endpoints that manage providers
- **[EventConsumerAction](./event-consumer-action.md)** - For processing events from managed providers
- **[EventMetadataManager](./event-metadata.md)** - For managing event metadata for providers
- **[WebhookAction](./webhook-action.md)** - For handling webhook events
- **[AdobeAuth](./adobe-auth.md)** - For generating access tokens for authentication

### Common Integration Patterns:

- **ProviderManager + EventMetadataManager**: Create providers and define their event metadata
- **ProviderManager + RuntimeAction**: HTTP endpoints for provider management
- **ProviderManager + EventConsumerAction**: Manage providers and process their events
- **ProviderManager + AdobeAuth**: Authenticated provider operations

## Constants Reference

ProviderManager uses constants from Adobe I/O Events globals and configuration.

### Data Residency Regions:

```typescript
// Supported data residency regions:
// - 'va6': US region (default)
// - 'irl1': Europe region
```

### Provider Metadata Types:

```typescript
// Common provider metadata types:
// - '3rd_party_custom_events': Default for custom third-party events
// - Custom metadata IDs can be used for specific event types
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
// - 404: Not Found (provider not found)
// - 409: Conflict (duplicate instance_id)
// - 500: Internal Server Error
```

## Performance Considerations

### ProviderManager Optimization

1. **Instance Reuse**: Reuse ProviderManager instances across multiple operations
2. **Batch Operations**: When possible, batch multiple provider operations
3. **Caching**: Cache frequently accessed provider data to reduce API calls
4. **Error Handling**: Implement proper error handling and retry logic for network failures

### Best Practices for Performance

1. **Connection Management**: RestClient handles HTTP connections efficiently
2. **Token Management**: Refresh access tokens proactively to avoid authentication failures
3. **Validation**: Validate input data before making API calls to reduce failed requests
4. **Monitoring**: Track API usage and response times for optimization

The ProviderManager provides a robust, type-safe interface for managing Adobe I/O Events providers with built-in validation, error handling, and seamless integration with other Adobe Commerce AIO Toolkit components.
