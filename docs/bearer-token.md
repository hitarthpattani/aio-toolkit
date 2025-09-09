# BearerToken Documentation

## Overview

The **BearerToken** utility provides a simple, reliable way to extract Bearer tokens from Adobe I/O Runtime action parameters. It handles the common pattern of parsing authorization headers in OpenWhisk actions, specifically designed for extracting JWT tokens, API keys, and other Bearer-style authentication tokens from incoming HTTP requests within the Adobe Commerce AIO Toolkit.

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

### 1. Token Extraction

- **Bearer token parsing** from OpenWhisk action parameters
- **Automatic prefix removal** of "Bearer " from authorization headers
- **Case-sensitive matching** for proper Bearer token identification
- **Safe parsing** with undefined returns for invalid/missing tokens

### 2. OpenWhisk Integration

- **Native __ow_headers support** for Adobe I/O Runtime actions
- **Seamless parameter handling** within action contexts
- **No external dependencies** for lightweight integration
- **TypeScript support** with proper type definitions

### 3. Token Format Support

- **JWT tokens** with standard three-part structure
- **API keys** with various character sets and lengths
- **Custom tokens** with special characters, hyphens, underscores
- **Base64 encoded tokens** and other standard formats

## Usage

### Basic Import

```typescript
const { BearerToken } = require('@adobe-commerce/aio-toolkit');
```

### TypeScript Import

```typescript
import { BearerToken } from '@adobe-commerce/aio-toolkit';
```

## API Reference

### BearerToken

Utility class for extracting Bearer tokens from OpenWhisk action parameters.

```typescript
class BearerToken {
  static extract(params: { [key: string]: any }): string | undefined;
}
```

**Methods:**

**extract(params)**

- **Parameters**:
  - `params` (object): OpenWhisk action input parameters containing `__ow_headers`
- **Returns**: `string | undefined` - The Bearer token without the "Bearer " prefix, or undefined if not found
- **Description**: Extracts Bearer token from the authorization header in OpenWhisk action parameters

### Parameter Structure

OpenWhisk actions receive headers in the following structure:

```typescript
interface ActionParams {
  __ow_headers: {
    authorization?: string;
    [key: string]: any;
  };
  [key: string]: any;
}
```

## Examples

### 1. Basic Token Extraction

```typescript
const { BearerToken } = require('@adobe-commerce/aio-toolkit');

// In an OpenWhisk action handler
const myAction = async (params) => {
  const token = BearerToken.extract(params);
  
  if (token) {
    console.log('Token received');
    return { statusCode: 200, body: { authenticated: true } };
  } else {
    return { statusCode: 401, body: { error: 'Unauthorized' } };
  }
};

// Example request parameters
const exampleParams = {
  __ow_headers: {
    authorization: 'Bearer abc123token456',
    'content-type': 'application/json'
  },
  data: 'some request data'
};

const extractedToken = BearerToken.extract(exampleParams); // returns 'abc123token456'
```

### 2. RuntimeAction Integration

```typescript
const { 
  RuntimeAction, 
  BearerToken, 
  RuntimeActionResponse,
  HttpMethod, 
  HttpStatus 
} = require('@adobe-commerce/aio-toolkit');

const secureEndpoint = RuntimeAction.execute(
  'secure-api',
  [HttpMethod.POST],
  ['data'],
  ['Authorization'],
  async (params, ctx) => {
    const { logger } = ctx;
    
    const token = BearerToken.extract(params);
    
    if (!token) {
      logger.warn('Missing Bearer token');
      return RuntimeActionResponse.error(HttpStatus.UNAUTHORIZED, 'Token required');
    }
    
    // Validate token (implement your validation logic)
    const isValid = await validateToken(token);
    
    if (!isValid) {
      return RuntimeActionResponse.error(HttpStatus.UNAUTHORIZED, 'Invalid token');
    }
    
    // Process authenticated request
    const result = await processRequest(params.data);
    
    return RuntimeActionResponse.success({
      message: 'Request processed',
      data: result
    });
  }
);

async function validateToken(token) {
  // Implement your token validation logic
  return token.length > 10;
}

async function processRequest(data) {
  return { processed: true, timestamp: new Date().toISOString() };
}

module.exports.main = secureEndpoint;
```

## Integration with Other Toolkit Components

The BearerToken utility integrates seamlessly with other toolkit components:

- **[RuntimeAction](./runtime-action.md)** - Extract tokens in HTTP endpoint handlers
- **[EventConsumerAction](./event-consumer-action.md)** - Process authenticated events
- **[AdobeCommerceClient](./adobe-commerce-client.md)** - Use extracted tokens for Commerce API calls
- **[AdobeAuth](./adobe-auth.md)** - Complement IMS authentication with Bearer tokens

### Related Documentation:

- **[RuntimeAction](./runtime-action.md)** - For creating secure HTTP endpoints with token authentication
- **[EventConsumerAction](./event-consumer-action.md)** - For processing authenticated events
- **[AdobeCommerceClient](./adobe-commerce-client.md)** - For using tokens with Commerce API calls
- **[AdobeAuth](./adobe-auth.md)** - For complementary IMS authentication patterns

### Common Integration Patterns:

- **BearerToken + RuntimeAction**: Secure HTTP endpoints with token validation
- **BearerToken + AdobeCommerceClient**: User-context Commerce API operations
- **BearerToken + EventConsumerAction**: Authenticated event processing

## Error Handling

### Common Error Scenarios

```typescript
const { BearerToken } = require('@adobe-commerce/aio-toolkit');

const handleTokenErrors = (params) => {
  const token = BearerToken.extract(params);
  
  if (token === undefined) {
    if (!params.__ow_headers) {
      return { error: 'No headers provided' };
    } else if (!params.__ow_headers.authorization) {
      return { error: 'No authorization header' };
    } else if (!params.__ow_headers.authorization.startsWith('Bearer ')) {
      return { error: 'Not a Bearer token' };
    }
    return { error: 'Token extraction failed' };
  }
  
  if (token === '') {
    return { error: 'Empty Bearer token' };
  }
  
  return { token, success: true };
};
```

## Best Practices

### 1. Always Validate Extracted Tokens

```typescript
// ✅ Good - Always check if token exists
const secureAction = async (params) => {
  const token = BearerToken.extract(params);
  
  if (!token || token.length < 10) {
    return { statusCode: 401, body: { error: 'Invalid token' } };
  }
  
  return await processWithToken(token);
};
```

### 2. Secure Token Logging

```typescript
// ✅ Good - Safe token logging
const safeLoggingAction = async (params) => {
  const token = BearerToken.extract(params);
  
  if (token) {
    console.log(`Token received: ${token.substring(0, 4)}...${token.slice(-4)}`);
  }
  
  return await processToken(token);
};
```

## Security Considerations

### Token Validation

- **Never log complete tokens** - Use partial logging for debugging
- **Validate token format** before processing
- **Implement token expiry** checks when applicable
- **Use secure channels** for token transmission

### Authentication vs Authorization

```typescript
// Authentication: Verify the token is valid
const authenticateToken = (token) => {
  return token && token.length > 10; // Basic validation
};

// Authorization: Check if token has required permissions
const authorizeToken = (token, requiredPermissions) => {
  // Implement permission checking logic
  return true; // Placeholder
};
```

## Constants Reference

The BearerToken utility uses standard OpenWhisk parameter structures and integrates with the toolkit's response types.

### Key Constants Used with BearerToken:

- **HttpStatus**: Used in actions that validate Bearer tokens
- **HTTP Headers**: Works with standard Authorization header format

### Quick Reference:

```typescript
// Standard Bearer token format
const bearerHeader = 'Bearer <token_value>';

// OpenWhisk parameter structure
const params = {
  __ow_headers: {
    authorization: bearerHeader,
    // other headers...
  },
  // other parameters...
};

// Extraction result
const token = BearerToken.extract(params); // returns '<token_value>' or undefined
```

## Performance Considerations

### BearerToken Optimization

1. **Lightweight Extraction**: Simple string operation with minimal overhead
2. **No External Dependencies**: Pure utility function with no network calls
3. **Memory Efficient**: Returns string references without copying large data
4. **Fast Validation**: Use early validation patterns to reject invalid tokens quickly

The BearerToken utility provides a simple, secure, and efficient way to extract Bearer tokens from Adobe I/O Runtime action parameters, enabling robust authentication patterns within the Adobe Commerce AIO Toolkit ecosystem.
