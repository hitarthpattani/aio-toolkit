# Adobe Commerce Client Documentation

## Overview

The **Adobe Commerce Client** is a comprehensive HTTP client specifically designed for interacting with Adobe Commerce (Magento) APIs. It provides multiple authentication methods, automatic token management, request/response logging, and error handling for seamless integration with Adobe Commerce instances.

## Table of Contents

- [Overview](#overview)
- [Core Components](#core-components)
- [Authentication Methods](#authentication-methods)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Connection Types](#connection-types)
- [Examples](#examples)
- [Error Handling](#error-handling)
- [Token Management](#token-management)
- [Best Practices](#best-practices)
- [Constants Reference](#constants-reference)

## Core Components

### 1. AdobeCommerceClient (`src/commerce/adobe-commerce-client/index.ts`)

The main client class that provides HTTP methods (GET, POST, PUT, DELETE) with:

- **Automatic authentication** via connection strategies
- **Request/response logging** with Adobe I/O SDK
- **Error handling** with detailed error responses
- **HTTP/2 support** for better performance

### 2. Connection Interface (`src/commerce/adobe-commerce-client/types.ts`)

Defines the contract for authentication strategies:

```typescript
interface Connection {
  extend: (client: Got) => Promise<Got>;
}
```

### 3. Authentication Connections

Three built-in authentication methods:

- **BasicAuthConnection** - Username/password authentication
- **ImsConnection** - Adobe IMS OAuth2 authentication
- **Oauth1aConnection** - OAuth 1.0a authentication

## Authentication Methods

### 1. Basic Authentication

Uses Adobe Commerce admin credentials to generate access tokens.

**Features:**

- Automatic token generation and caching
- Token expiration handling (3600 seconds default)
- State-based token storage using Adobe I/O SDK

### 2. IMS (Identity Management Services) Authentication

Uses Adobe IMS for OAuth2-based authentication.

**Features:**

- Client credentials flow
- Configurable scopes
- Automatic token refresh
- Customizable IMS host (default: `https://ims-na1.adobelogin.com`)

### 3. OAuth 1.0a Authentication

Traditional OAuth 1.0a flow for legacy integrations.

**Features:**

- HMAC-SHA256 signature method
- Consumer key/secret and access token/secret
- Automatic header generation for each request

## Usage

### Basic Setup

```typescript
const { AdobeCommerceClient } = require('@adobe-commerce/aio-toolkit');
const { BasicAuthConnection } = require('@adobe-commerce/aio-toolkit');

// Create connection
const connection = new BasicAuthConnection(
  'https://your-commerce-store.com',
  'admin-username',
  'admin-password'
);

// Create client
const client = new AdobeCommerceClient('https://your-commerce-store.com', connection);

// Make API calls
const products = await client.get('rest/V1/products');
const newProduct = await client.post('rest/V1/products', {}, productData);
```

### With Custom Logger

```typescript
const { Core } = require('@adobe/aio-sdk');

const logger = Core.Logger('my-commerce-app', { level: 'info' });

const client = new AdobeCommerceClient('https://your-commerce-store.com', connection, logger);
```

## API Reference

### AdobeCommerceClient Constructor

```typescript
constructor(
  baseUrl: string,
  connection: Connection,
  logger?: any
)
```

#### Parameters

| Parameter    | Type         | Required | Description                                      |
| ------------ | ------------ | -------- | ------------------------------------------------ |
| `baseUrl`    | `string`     | Yes      | Adobe Commerce store base URL                    |
| `connection` | `Connection` | Yes      | Authentication connection strategy               |
| `logger`     | `any`        | No       | Custom logger (defaults to Adobe I/O SDK logger) |

### HTTP Methods

#### GET Request

```typescript
async get(
  endpoint: string,
  headers?: Record<string, string>
): Promise<any>
```

#### POST Request

```typescript
async post(
  endpoint: string,
  headers?: Record<string, string>,
  payload?: any
): Promise<any>
```

#### PUT Request

```typescript
async put(
  endpoint: string,
  headers?: Record<string, string>,
  payload?: any
): Promise<any>
```

#### DELETE Request

```typescript
async delete(
  endpoint: string,
  headers?: Record<string, string>
): Promise<any>
```

### Response Format

All methods return a standardized response:

```typescript
// Success Response
{
  success: true,
  message: any // The actual API response data
}

// Error Response
{
  success: false,
  statusCode: number,
  message: string,
  body?: any // Error response body if available
}
```

## Connection Types

### 1. BasicAuthConnection

```typescript
const { BasicAuthConnection } = require('@adobe-commerce/aio-toolkit');

const connection = new BasicAuthConnection(
  'https://your-store.com',
  'admin-username',
  'admin-password',
  logger? // Optional custom logger
);
```

**Use Cases:**

- Development and testing environments
- Simple integrations with admin credentials
- Quick prototyping

### 2. ImsConnection

```typescript
const { ImsConnection } = require('@adobe-commerce/aio-toolkit');

const connection = new ImsConnection(
  'your-client-id',
  'your-client-secret',
  'your-technical-account-id',
  'your-technical-account-email',
  'your-ims-org-id',
  ['AdobeID', 'openid', 'adobeio_api'], // Scopes array
  logger?, // Optional custom logger
  'adobe-commerce-client' // Optional context name
);
```

**Use Cases:**

- Production environments
- Adobe App Builder applications
- Enterprise integrations requiring OAuth2

### 3. Oauth1aConnection

```typescript
const { Oauth1aConnection } = require('@adobe-commerce/aio-toolkit');

const connection = new Oauth1aConnection(
  'consumer-key',
  'consumer-secret',
  'access-token',
  'access-token-secret',
  logger? // Optional custom logger
);
```

**Use Cases:**

- Legacy integrations
- Third-party applications using OAuth 1.0a
- Custom authentication flows

## Examples

### 1. Product Management

```typescript
const { AdobeCommerceClient } = require('@adobe-commerce/aio-toolkit');
const { BasicAuthConnection } = require('@adobe-commerce/aio-toolkit');

const connection = new BasicAuthConnection('https://your-store.com', 'admin', 'password123');

const client = new AdobeCommerceClient('https://your-store.com', connection);

// Get all products
const productsResponse = await client.get('rest/V1/products');
if (productsResponse.success) {
  console.log('Products:', productsResponse.message);
}

// Create a new product
const productData = {
  product: {
    sku: 'test-product-001',
    name: 'Test Product',
    price: 29.99,
    status: 1,
    type_id: 'simple',
    attribute_set_id: 4,
  },
};

const createResponse = await client.post('rest/V1/products', {}, productData);
if (createResponse.success) {
  console.log('Product created:', createResponse.message);
}
```

### 2. Customer Management with IMS

```typescript
const { ImsConnection } = require('@adobe-commerce/aio-toolkit');

const imsConnection = new ImsConnection(
  process.env.ADOBE_CLIENT_ID,
  process.env.ADOBE_CLIENT_SECRET,
  process.env.ADOBE_TECHNICAL_ACCOUNT_ID,
  process.env.ADOBE_TECHNICAL_ACCOUNT_EMAIL,
  process.env.ADOBE_IMS_ORG_ID,
  ['AdobeID', 'openid', 'adobeio_api']
);

const client = new AdobeCommerceClient('https://your-store.com', imsConnection);

// Get customer by ID
const customerResponse = await client.get('rest/V1/customers/123');
if (customerResponse.success) {
  console.log('Customer:', customerResponse.message);
} else {
  console.error('Error:', customerResponse.message);
}
```

### 3. Order Processing with OAuth 1.0a

```typescript
const { Oauth1aConnection } = require('@adobe-commerce/aio-toolkit');

const oauthConnection = new Oauth1aConnection(
  process.env.CONSUMER_KEY,
  process.env.CONSUMER_SECRET,
  process.env.ACCESS_TOKEN,
  process.env.ACCESS_TOKEN_SECRET
);

const client = new AdobeCommerceClient('https://your-store.com', oauthConnection);

// Get orders
const ordersResponse = await client.get('rest/V1/orders');
if (ordersResponse.success) {
  const orders = ordersResponse.message.items;
  console.log(`Found ${orders.length} orders`);

  // Update order status
  for (const order of orders) {
    if (order.status === 'pending') {
      const updateResponse = await client.put(
        `rest/V1/orders/${order.entity_id}`,
        {},
        { status: 'processing' }
      );

      if (updateResponse.success) {
        console.log(`Order ${order.entity_id} updated to processing`);
      }
    }
  }
}
```

### 4. Bulk Operations

```typescript
const client = new AdobeCommerceClient('https://your-store.com', connection);

// Bulk product update
const productUpdates = [
  { sku: 'product-1', price: 19.99 },
  { sku: 'product-2', price: 29.99 },
  { sku: 'product-3', price: 39.99 },
];

const results = await Promise.all(
  productUpdates.map(async update => {
    const response = await client.put(
      `rest/V1/products/${update.sku}`,
      {},
      { product: { price: update.price } }
    );

    return {
      sku: update.sku,
      success: response.success,
      message: response.message,
    };
  })
);

console.log('Bulk update results:', results);
```

## Error Handling

### Automatic Error Handling

The client automatically handles various error scenarios:

```typescript
// Network errors
{
  success: false,
  statusCode: 500,
  message: "Unexpected error, check logs. Original error \"Network timeout\""
}

// API errors
{
  success: false,
  statusCode: 400,
  message: "Invalid product data",
  body: {
    message: "The product SKU is required",
    parameters: ["sku"]
  }
}
```

### Custom Error Handling

```typescript
const response = await client.get('rest/V1/products/invalid-sku');

if (!response.success) {
  switch (response.statusCode) {
    case 404:
      console.log('Product not found');
      break;
    case 401:
      console.log('Authentication failed');
      break;
    case 500:
      console.log('Server error:', response.message);
      break;
    default:
      console.log('API error:', response.message);
  }
} else {
  console.log('Product data:', response.message);
}
```

### Retry Logic

```typescript
async function makeRequestWithRetry(client, endpoint, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const response = await client.get(endpoint);

    if (response.success) {
      return response;
    }

    // Retry on server errors
    if (response.statusCode >= 500 && attempt < maxRetries) {
      console.log(`Attempt ${attempt} failed, retrying...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      continue;
    }

    return response;
  }
}
```

## Token Management

### Automatic Token Caching

Both BasicAuth and IMS connections automatically cache tokens:

- **BasicAuth**: Tokens cached for 3600 seconds (1 hour)
- **IMS**: Tokens cached based on `expires_in` with 3600-second buffer
- **Storage**: Uses Adobe I/O SDK State for persistent storage

### Manual Token Management

```typescript
// Force token refresh by clearing cache
const { State } = require('@adobe/aio-sdk');

const state = await State.init();
await state.delete('adobe_commerce_basic_auth_token');
await state.delete('adobe_commerce_ims_token');

// Next API call will generate new tokens
```

### Token Debugging

```typescript
// Enable debug logging to see token operations
const logger = Core.Logger('commerce-client', { level: 'debug' });
const client = new AdobeCommerceClient(baseUrl, connection, logger);

// Debug logs will show:
// - Token generation requests
// - Token caching operations
// - Token usage in API calls
```

## Best Practices

### 1. Environment-Specific Configurations

```typescript
// config/commerce.js
const config = {
  development: {
    baseUrl: 'https://dev-store.com',
    auth: {
      type: 'basic',
      username: process.env.DEV_ADMIN_USER,
      password: process.env.DEV_ADMIN_PASS,
    },
  },
  production: {
    baseUrl: 'https://prod-store.com',
    auth: {
      type: 'ims',
      clientId: process.env.PROD_IMS_CLIENT_ID,
      clientSecret: process.env.PROD_IMS_CLIENT_SECRET,
      technicalAccountId: process.env.PROD_TECHNICAL_ACCOUNT_ID,
      technicalAccountEmail: process.env.PROD_TECHNICAL_ACCOUNT_EMAIL,
      imsOrgId: process.env.PROD_IMS_ORG_ID,
      scopes: ['AdobeID', 'openid', 'adobeio_api'],
    },
  },
};

// Usage
const env = process.env.NODE_ENV || 'development';
const { baseUrl, auth } = config[env];

let connection;
if (auth.type === 'basic') {
  connection = new BasicAuthConnection(baseUrl, auth.username, auth.password);
} else if (auth.type === 'ims') {
  connection = new ImsConnection(
    auth.clientId, 
    auth.clientSecret, 
    auth.technicalAccountId,
    auth.technicalAccountEmail,
    auth.imsOrgId,
    auth.scopes
  );
}

const client = new AdobeCommerceClient(baseUrl, connection);
```

### 2. Error Handling Patterns

```typescript
const robustCommerceCall = async (client, endpoint, data) => {
  try {
    const response = await client.post(endpoint, {}, data);
    
    if (response.success) {
      return { success: true, data: response.message };
    } else {
      // Handle Commerce API errors
      console.error('Commerce API error:', response.message);
      return { success: false, error: response.message };
    }
  } catch (error) {
    // Handle network/connection errors
    if (error.code === 'ECONNREFUSED') {
      return { success: false, error: 'Commerce store is unavailable' };
    } else if (error.response?.status === 401) {
      return { success: false, error: 'Authentication failed' };
    } else {
      return { success: false, error: 'Unexpected error occurred' };
    }
  }
};
```

### 3. Connection Reuse

```typescript
// ✅ Good - Reuse connection instances
class CommerceService {
  constructor() {
    this.connection = new ImsConnection(/* ... */);
    this.client = new AdobeCommerceClient(baseUrl, this.connection);
  }

  async getProduct(sku) {
    return await this.client.get(`rest/V1/products/${sku}`);
  }

  async createProduct(productData) {
    return await this.client.post('rest/V1/products', {}, productData);
  }
}

// ❌ Bad - Creating new connections for each call
const badGetProduct = async (sku) => {
  const connection = new ImsConnection(/* ... */); // Expensive!
  const client = new AdobeCommerceClient(baseUrl, connection);
  return await client.get(`rest/V1/products/${sku}`);
};
```

## Integration with Other Toolkit Components

The Adobe Commerce Client integrates seamlessly with other toolkit components:

- **[RuntimeAction](./runtime-action.md)**: Use within RuntimeAction handlers for Adobe I/O Runtime HTTP requests
- **[AdobeAuth](./adobe-auth.md)**: Direct Adobe IMS authentication used by ImsConnection
- **[EventConsumerAction](./event-consumer-action.md)**: Use within Event handlers for event-driven Commerce operations
- **[GraphQlAction](./graphql-action.md)**: Use for GraphQL-based Commerce API integration
- **[WebhookAction](./webhook-action.md)**: Process Commerce webhooks and events
- **[RestClient](./rest-client.md)**: Leverages the framework's REST client for token generation

### Related Documentation:

- **[RuntimeAction](./runtime-action.md)** - For HTTP-based Commerce API integration
- **[AdobeAuth](./adobe-auth.md)** - For Adobe IMS authentication used by Commerce Client
- **[EventConsumerAction](./event-consumer-action.md)** - For event-driven Commerce operations (webhooks, async processing)
- **[WebhookAction](./webhook-action.md)** - For processing Commerce webhooks with signature verification
- **[GraphQlAction](./graphql-action.md)** - For GraphQL-based Commerce API endpoints

### Common Integration Patterns:

- **Commerce + RuntimeAction**: HTTP endpoints that interact with Commerce APIs
- **Commerce + AdobeAuth**: Direct IMS authentication for Commerce integrations
- **Commerce + EventConsumerAction**: Process Commerce webhooks and events
- **Commerce + WebhookAction**: Secure webhook processing with signature verification
- **Commerce + GraphQlAction**: GraphQL APIs with Commerce data integration

## Constants Reference

The Adobe Commerce Client uses constants from the framework's types module for consistent error handling.

### HTTP Status Handling

```typescript
const { HttpStatus } = require('@adobe-commerce/aio-toolkit');

// Handle Commerce API responses with proper status codes
if (response.success) {
  return { statusCode: HttpStatus.OK, body: response.message };
} else {
  return { statusCode: HttpStatus.BAD_REQUEST, body: { error: response.message } };
}
```

### Connection Types

```typescript
// Available connection types for Commerce authentication:
// - BasicAuthConnection: Username/password authentication
// - ImsConnection: Adobe IMS token-based authentication  
// - Oauth1aConnection: OAuth 1.0a signature-based authentication
```

For comprehensive HTTP status code usage, refer to the RuntimeAction documentation.

## Performance Considerations

### Adobe Commerce Client Optimization

1. **Connection Reuse**: Reuse client and connection instances across multiple API calls
2. **Batch Operations**: Use batch APIs when available for multiple operations
3. **Caching**: Cache frequently accessed data like product catalogs
4. **Error Handling**: Implement proper error handling and retry logic
5. **Request Optimization**: Use appropriate HTTP methods and minimize payload sizes

### Authentication Performance

- **IMS Token Caching**: ImsConnection automatically handles token caching and renewal
- **Connection Pooling**: Reuse connections to reduce authentication overhead
- **Async Operations**: Use async/await patterns for non-blocking API calls

The Adobe Commerce Client provides a robust, type-safe interface for interacting with Adobe Commerce APIs, with built-in authentication handling and error management within the Adobe Commerce AIO Toolkit.
