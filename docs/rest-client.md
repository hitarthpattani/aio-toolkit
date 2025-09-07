# RestClient Documentation

## Overview

The **RestClient** module provides a simple, robust HTTP client for making RESTful API calls within the Adobe Commerce AIO Toolkit. Built on top of node-fetch, it offers a clean interface for GET, POST, PUT, and DELETE operations with automatic JSON handling, error management, and flexible header configuration.

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

### 1. HTTP Method Support

- **GET**: Retrieve data from APIs
- **POST**: Create new resources with payload
- **PUT**: Update existing resources with payload
- **DELETE**: Remove resources

### 2. Automatic JSON Handling

- **Request serialization**: Automatically converts payloads to JSON
- **Response parsing**: Automatically parses JSON responses
- **Content-Type headers**: Automatically sets appropriate headers

### 3. Error Management

- **HTTP error detection**: Throws errors for non-2xx status codes
- **Network error handling**: Catches and re-throws network errors
- **Detailed error messages**: Provides meaningful error information

### 4. Flexible Configuration

- **Custom headers**: Support for authentication and custom headers
- **Payload handling**: Automatic JSON serialization for POST/PUT requests
- **Response handling**: Automatic JSON parsing of responses

## Usage

### Basic Import

```typescript
const { RestClient } = require('@adobe-commerce/aio-toolkit');
```

### TypeScript Import

```typescript
import { RestClient, Headers } from '@adobe-commerce/aio-toolkit';
```

### Class Instantiation

```typescript
const client = new RestClient();
```

## API Reference

### RestClient

HTTP client for making RESTful API calls with automatic JSON handling.

```typescript
class RestClient {
  async get(endpoint: string, headers?: Headers): Promise<any>;
  async post(endpoint: string, headers?: Headers, payload?: any): Promise<any>;
  async put(endpoint: string, headers?: Headers, payload?: any): Promise<any>;
  async delete(endpoint: string, headers?: Headers): Promise<any>;
  async apiCall(endpoint: string, method?: string, headers?: Headers, payload?: any): Promise<any>;
}
```

### Headers Interface

```typescript
interface Headers {
  [key: string]: string;
}
```

### Method Parameters

**get(endpoint, headers)**

- `endpoint` (string): The URL endpoint to call
- `headers` (Headers, optional): HTTP headers to include

**post(endpoint, headers, payload)**

- `endpoint` (string): The URL endpoint to call
- `headers` (Headers, optional): HTTP headers to include
- `payload` (any, optional): Data to send in request body

**put(endpoint, headers, payload)**

- `endpoint` (string): The URL endpoint to call
- `headers` (Headers, optional): HTTP headers to include
- `payload` (any, optional): Data to send in request body

**delete(endpoint, headers)**

- `endpoint` (string): The URL endpoint to call
- `headers` (Headers, optional): HTTP headers to include

**apiCall(endpoint, method, headers, payload)**

- `endpoint` (string): The URL endpoint to call
- `method` (string, optional): HTTP method (default: 'POST')
- `headers` (Headers, optional): HTTP headers to include
- `payload` (any, optional): Data to send in request body

## Examples

### 1. Basic GET Request

```typescript
const { RestClient } = require('@adobe-commerce/aio-toolkit');

const client = new RestClient();

// Simple GET request
const getData = async () => {
  try {
    const response = await client.get('https://api.example.com/users');
    console.log('Users:', response);
    return response;
  } catch (error) {
    console.error('GET request failed:', error.message);
    throw error;
  }
};

// GET with headers
const getDataWithAuth = async () => {
  const headers = {
    'Authorization': 'Bearer your-token-here',
    'Accept': 'application/json'
  };

  try {
    const response = await client.get('https://api.example.com/protected-data', headers);
    return response;
  } catch (error) {
    console.error('Authenticated GET failed:', error.message);
    throw error;
  }
};
```

### 2. POST and PUT Requests

```typescript
const { RestClient } = require('@adobe-commerce/aio-toolkit');

const client = new RestClient();

// Create new resource with POST
const createUser = async (userData) => {
  const headers = {
    'Authorization': 'Bearer your-token-here',
    'Content-Type': 'application/json'
  };

  try {
    const response = await client.post('https://api.example.com/users', headers, userData);
    console.log('User created:', response);
    return response;
  } catch (error) {
    console.error('POST request failed:', error.message);
    throw error;
  }
};

// Update resource with PUT
const updateUser = async (userId, userData) => {
  const headers = {
    'Authorization': 'Bearer your-token-here'
  };

  try {
    const response = await client.put(`https://api.example.com/users/${userId}`, headers, userData);
    console.log('User updated:', response);
    return response;
  } catch (error) {
    console.error('PUT request failed:', error.message);
    throw error;
  }
};

// Usage examples
const newUser = { name: 'John Doe', email: 'john@example.com' };
createUser(newUser);

const updatedData = { name: 'John Smith' };
updateUser('123', updatedData);
```

### 3. DELETE Request and Error Handling

```typescript
const { RestClient } = require('@adobe-commerce/aio-toolkit');

const client = new RestClient();

// DELETE request with comprehensive error handling
const deleteUser = async (userId) => {
  const headers = {
    'Authorization': 'Bearer your-token-here'
  };

  try {
    const response = await client.delete(`https://api.example.com/users/${userId}`, headers);
    
    // Handle 204 No Content response
    if (response === null) {
      console.log(`User ${userId} deleted successfully`);
      return { success: true, message: 'User deleted' };
    }
    
    return response;
  } catch (error) {
    // Handle different error types
    if (error.message.includes('404')) {
      console.error('User not found');
      return { success: false, error: 'User not found' };
    } else if (error.message.includes('403')) {
      console.error('Not authorized to delete user');
      return { success: false, error: 'Not authorized' };
    } else {
      console.error('Delete request failed:', error.message);
      return { success: false, error: error.message };
    }
  }
};

// Usage
deleteUser('123');
```

## Error Handling

### Automatic Error Detection

RestClient automatically throws errors for non-2xx status codes:

```typescript
const handleApiErrors = async () => {
  const client = new RestClient();
  
  try {
    const response = await client.get('https://api.example.com/not-found');
  } catch (error) {
    if (error.message.includes('404')) {
      console.log('Resource not found');
    } else if (error.message.includes('500')) {
      console.log('Server error');
    } else {
      console.log('Other error:', error.message);
    }
  }
};
```

### Custom Error Handling Patterns

```typescript
const robustApiCall = async (endpoint, data) => {
  const client = new RestClient();
  const headers = { 'Authorization': 'Bearer token' };

  try {
    const response = await client.post(endpoint, headers, data);
    return { success: true, data: response };
  } catch (error) {
    // Network errors
    if (error.code === 'ECONNREFUSED') {
      return { success: false, error: 'Service unavailable' };
    }
    
    // HTTP errors
    if (error.message.includes('status:')) {
      const status = error.message.match(/status: (\d+)/)?.[1];
      return { 
        success: false, 
        error: `HTTP ${status} error`,
        statusCode: parseInt(status)
      };
    }
    
    // Other errors
    return { success: false, error: 'Unexpected error occurred' };
  }
};
```

## Best Practices

### 1. Reuse Client Instances

```typescript
// ✅ Good - Reuse client instance
class ApiService {
  constructor() {
    this.client = new RestClient();
    this.baseHeaders = {
      'Authorization': 'Bearer ' + process.env.API_TOKEN,
      'Accept': 'application/json'
    };
  }

  async getUsers() {
    return await this.client.get('/users', this.baseHeaders);
  }

  async createUser(userData) {
    return await this.client.post('/users', this.baseHeaders, userData);
  }
}

// ❌ Bad - Creating new client for each call
const badApiCall = async () => {
  const client = new RestClient(); // Creates new instance every time
  return await client.get('/users');
};
```

### 2. Handle Different Response Types

```typescript
const flexibleApiCall = async (endpoint) => {
  const client = new RestClient();
  
  try {
    const response = await client.get(endpoint);
    
    // Handle null response (204 No Content)
    if (response === null) {
      return { success: true, message: 'No content' };
    }
    
    // Handle JSON response
    if (typeof response === 'object') {
      return { success: true, data: response };
    }
    
    // Handle text response
    if (typeof response === 'string') {
      return { success: true, text: response };
    }
    
    return { success: true, response };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
```

### 3. Environment-Based Configuration

```typescript
class ConfigurableApiClient {
  constructor() {
    this.client = new RestClient();
    this.baseUrl = process.env.API_BASE_URL || 'https://api.example.com';
    this.defaultHeaders = {
      'Authorization': `Bearer ${process.env.API_TOKEN}`,
      'User-Agent': 'Adobe Commerce AIO Toolkit'
    };
  }

  async get(path, additionalHeaders = {}) {
    const headers = { ...this.defaultHeaders, ...additionalHeaders };
    return await this.client.get(`${this.baseUrl}${path}`, headers);
  }

  async post(path, data, additionalHeaders = {}) {
    const headers = { ...this.defaultHeaders, ...additionalHeaders };
    return await this.client.post(`${this.baseUrl}${path}`, headers, data);
  }
}
```

## Integration with Other Toolkit Components

The RestClient integrates seamlessly with other toolkit components:

- **[BearerToken](./bearer-token.md)** - Extract tokens for API authentication
- **[RuntimeAction](./runtime-action.md)** - Use within action handlers for external API calls
- **[WebhookAction](./webhook-action.md)** - Make API calls from webhook handlers
- **[EventConsumerAction](./event-consumer-action.md)** - Integrate with external services from event handlers
- **[AdobeCommerceClient](./adobe-commerce-client.md)** - RestClient is used internally for Commerce API calls

### RuntimeAction Integration

Use RestClient within RuntimeAction handlers for external API calls:

```typescript
const { 
  RuntimeAction, 
  RuntimeActionResponse, 
  RestClient,
  HttpMethod, 
  HttpStatus 
} = require('@adobe-commerce/aio-toolkit');

const externalApiAction = RuntimeAction.execute(
  'external-api-proxy',
  [HttpMethod.POST],
  ['data'],
  ['Authorization'],
  async (params, ctx) => {
    const { logger } = ctx;
    const { data } = params;

    try {
      const client = new RestClient();
      const headers = {
        'Authorization': params.__ow_headers.authorization,
        'Content-Type': 'application/json'
      };

      // Make external API call
      const response = await client.post('https://external-api.com/process', headers, data);

      logger.info('External API call successful');
      
      return RuntimeActionResponse.success({
        message: 'Data processed by external API',
        result: response
      });
    } catch (error) {
      logger.error('External API call failed:', error);
      return RuntimeActionResponse.error(HttpStatus.INTERNAL_ERROR, 'External API error');
    }
  }
);
```

### BearerToken Integration

Combine BearerToken and RestClient for authenticated API calls:

```typescript
const { 
  BearerToken, 
  RestClient, 
  RuntimeAction,
  RuntimeActionResponse,
  HttpMethod,
  HttpStatus
} = require('@adobe-commerce/aio-toolkit');

const authenticatedApiAction = RuntimeAction.execute(
  'authenticated-api',
  [HttpMethod.POST],
  ['endpoint', 'data'],
  ['Authorization'],
  async (params, ctx) => {
    const { logger } = ctx;
    const { endpoint, data } = params;

    // Extract Bearer token from request
    const token = BearerToken.extract(params);

    if (!token) {
      return RuntimeActionResponse.error(HttpStatus.UNAUTHORIZED, 'Bearer token required');
    }

    try {
      const client = new RestClient();
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Make authenticated API call
      const response = await client.post(endpoint, headers, data);

      return RuntimeActionResponse.success({
        message: 'API call completed',
        data: response
      });
    } catch (error) {
      logger.error('Authenticated API call failed:', error);
      
      if (error.message.includes('401')) {
        return RuntimeActionResponse.error(HttpStatus.UNAUTHORIZED, 'Invalid token');
      }
      
      return RuntimeActionResponse.error(HttpStatus.INTERNAL_ERROR, 'API call failed');
    }
  }
);
```

### Related Documentation:

- **[BearerToken](./bearer-token.md)** - For extracting Bearer tokens for API authentication
- **[RuntimeAction](./runtime-action.md)** - For creating HTTP endpoints that use RestClient
- **[WebhookAction](./webhook-action.md)** - For webhook handlers that call external APIs
- **[EventConsumerAction](./event-consumer-action.md)** - For event-driven external API integration
- **[AdobeCommerceClient](./adobe-commerce-client.md)** - Uses RestClient internally for Commerce API calls

### Common Integration Patterns:

- **RestClient + BearerToken**: Authenticated external API calls
- **RestClient + RuntimeAction**: HTTP endpoints that proxy to external APIs
- **RestClient + WebhookAction**: Webhook handlers that trigger external API calls
- **RestClient + EventConsumerAction**: Event-driven external service integration

## Constants Reference

The RestClient works with standard HTTP methods and status codes.

### HTTP Methods Supported:

- **GET**: Retrieve data
- **POST**: Create resources (default for apiCall method)
- **PUT**: Update resources
- **DELETE**: Remove resources

### Common Status Codes:

```typescript
// RestClient throws errors for non-2xx responses:
// - 400 Bad Request
// - 401 Unauthorized
// - 403 Forbidden
// - 404 Not Found
// - 500 Internal Server Error
// - etc.

// Special handling for:
// - 204 No Content: Returns null
// - JSON content-type: Parses as JSON
// - Other content-types: Returns as text
```

### Usage with Toolkit Constants:

```typescript
const { RestClient, HttpStatus } = require('@adobe-commerce/aio-toolkit');

const handleApiResponse = async (endpoint) => {
  const client = new RestClient();
  
  try {
    const response = await client.get(endpoint);
    return { statusCode: HttpStatus.OK, data: response };
  } catch (error) {
    if (error.message.includes('404')) {
      return { statusCode: HttpStatus.NOT_FOUND, error: 'Not found' };
    } else if (error.message.includes('401')) {
      return { statusCode: HttpStatus.UNAUTHORIZED, error: 'Unauthorized' };
    } else {
      return { statusCode: HttpStatus.INTERNAL_ERROR, error: 'API error' };
    }
  }
};
```

## Performance Considerations

### RestClient Optimization

1. **Instance Reuse**: Reuse RestClient instances across multiple API calls
2. **Connection Management**: Built on node-fetch for efficient HTTP connections
3. **Memory Efficient**: Automatic JSON parsing without large memory overhead
4. **Error Handling**: Fast error detection and proper cleanup

### Best Practices for Performance

1. **Reuse Clients**: Create one RestClient instance per service/class
2. **Header Reuse**: Define common headers once and reuse them
3. **Async Operations**: Use proper async/await patterns for non-blocking calls
4. **Error Recovery**: Implement retry logic for transient failures when appropriate

### Memory Management

- RestClient creates minimal overhead for HTTP operations
- Automatic JSON parsing without storing large intermediate objects
- Proper cleanup of HTTP connections through node-fetch
- Garbage collection friendly implementation

The RestClient provides a simple, reliable HTTP client interface for external API integration within the Adobe Commerce AIO Toolkit, with automatic JSON handling, error management, and seamless integration with other toolkit components.
