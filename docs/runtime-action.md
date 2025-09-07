# RuntimeAction Documentation

## Overview

The **RuntimeAction** feature is a core component of the Adobe Commerce AIO Toolkit that provides a standardized way to create and execute Adobe I/O Runtime actions. It handles request validation, logging, error handling, and response formatting automatically.

## Table of Contents

- [Overview](#overview)
- [Core Components](#core-components)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Response Types](#response-types)
- [Examples](#examples)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)
- [Integration with Other Toolkit Features](#integration-with-other-toolkit-features)
- [Constants Reference](#constants-reference)

## Core Components

### 1. RuntimeAction Class (`src/framework/runtime-action/index.ts`)

The main `RuntimeAction` class provides the `execute` method that wraps your business logic with:

- **Automatic logging** using Adobe I/O SDK
- **Request validation** (parameters and headers)
- **HTTP method validation**
- **Error handling and response formatting**

### 2. RuntimeActionResponse Class (`src/framework/runtime-action/response/index.ts`)

Utility class for creating standardized responses:

- `RuntimeActionResponse.success()` - Creates success responses
- `RuntimeActionResponse.error()` - Creates error responses

### 3. Response Types (`src/framework/runtime-action/types.ts`)

TypeScript enums and interfaces for type safety:

- `HttpStatus` - HTTP status code constants
- `HttpMethod` - HTTP method constants

## Usage

### Basic Usage

```typescript
const {
  RuntimeAction,
  RuntimeActionResponse,
  HttpMethod,
  HttpStatus,
} = require('@adobe-commerce/aio-toolkit');

// Create a simple action
const myAction = RuntimeAction.execute(
  'process-user', // Action name
  [HttpMethod.POST], // Allowed HTTP methods
  ['userId'], // Required parameters
  ['authorization'], // Required headers
  async (params, ctx) => {
    // Your business logic here
    const { userId } = params;
    const { logger } = ctx;

    logger.info(`Processing request for user: ${userId}`);

    // Return success response
    return RuntimeActionResponse.success({
      message: 'Action completed successfully',
      userId: userId,
    });
  }
);

// Export for Adobe I/O Runtime
exports.main = myAction;
```

### Advanced Usage with Custom Logic

```typescript
const advancedAction = RuntimeAction.execute(
  'advanced-action',
  [HttpMethod.GET, HttpMethod.POST],
  ['data'],
  ['content-type'],
  async (params, ctx) => {
    const { data } = params;
    const { logger, headers } = ctx;

    try {
      // Process your data
      const processedData = await processBusinessLogic(data);

      // Return success with custom headers
      return RuntimeActionResponse.success({ result: processedData }, { 'custom-header': 'value' });
    } catch (error) {
      logger.error('Processing failed:', error);
      return RuntimeActionResponse.error(HttpStatus.INTERNAL_ERROR, 'Data processing failed');
    }
  }
);
```

## API Reference

### RuntimeAction.execute()

Creates an executable action function with built-in validation and error handling.

#### Parameters

| Parameter         | Type           | Default         | Description                                |
| ----------------- | -------------- | --------------- | ------------------------------------------ |
| `name`            | `string`       | `'main'`        | Action name for logging                    |
| `httpMethods`     | `HttpMethod[]` | `[]`            | Allowed HTTP methods (empty = all allowed) |
| `requiredParams`  | `string[]`     | `[]`            | Required request parameters                |
| `requiredHeaders` | `string[]`     | `[]`            | Required request headers                   |
| `action`          | `Function`     | Default handler | Your business logic function               |

#### Action Function Signature

```typescript
(
  params: { [key: string]: any },
  ctx: {
    logger: any;
    headers: { [key: string]: any };
  }
) => Promise<ActionResponseType>;
```

#### Context Object

- `logger` - Adobe I/O SDK logger instance
- `headers` - Request headers from `params.__ow_headers`

### RuntimeActionResponse Methods

#### RuntimeActionResponse.success()

```typescript
static success(
  response: object | string,
  headers?: { [key: string]: string }
): SuccessResponse
```

Creates a success response with HTTP 200 status.

#### RuntimeActionResponse.error()

```typescript
static error(
  statusCode: HttpStatus,
  error: string
): ErrorResponse
```

Creates an error response with the specified status code.

## Response Types

### SuccessResponse

```typescript
interface SuccessResponse {
  statusCode: HttpStatus;
  body: object | string;
  headers?: { [key: string]: string };
}
```

### ErrorResponse

```typescript
interface ErrorResponse {
  error: {
    statusCode: HttpStatus;
    body: {
      error: string;
    };
  };
}
```

## Examples

### 1. Simple GET Action

```typescript
const getUserAction = RuntimeAction.execute(
  'get-user',
  [HttpMethod.GET],
  ['userId'],
  [],
  async (params, ctx) => {
    const user = await fetchUser(params.userId);
    return RuntimeActionResponse.success(user);
  }
);
```

### 2. POST Action with Validation

```typescript
const createUserAction = RuntimeAction.execute(
  'create-user',
  [HttpMethod.POST],
  ['name', 'email'],
  ['content-type'],
  async (params, ctx) => {
    const { name, email } = params;
    const { logger } = ctx;

    // Validate email format
    if (!isValidEmail(email)) {
      return RuntimeActionResponse.error(HttpStatus.BAD_REQUEST, 'Invalid email format');
    }

    const newUser = await createUser({ name, email });
    logger.info(`Created user: ${newUser.id}`);

    return RuntimeActionResponse.success(newUser);
  }
);
```

## Error Handling

### Automatic Error Handling

RuntimeAction automatically catches and handles unhandled errors:

```typescript
const autoErrorAction = RuntimeAction.execute('auto-error', [], [], [], async (params, ctx) => {
  // If this throws an error, RuntimeAction will automatically return a 500 error
  throw new Error('Something went wrong!');
});
```

### Custom Error Handling

```typescript
const customErrorAction = RuntimeAction.execute('custom-error', [], [], [], async (params, ctx) => {
  try {
    await riskyOperation();
  } catch (error) {
    // Handle specific errors
    if (error.code === 'NOT_FOUND') {
      return RuntimeActionResponse.error(HttpStatus.NOT_FOUND, 'Resource not found');
    }

    // Re-throw for automatic handling
    throw error;
  }
});
```

## Best Practices

### 1. Use Descriptive Action Names

```typescript
// ✅ Good
RuntimeAction.execute('process-order', ...)
RuntimeAction.execute('validate-user-credentials', ...)

// ❌ Avoid
RuntimeAction.execute('action1', ...)
RuntimeAction.execute('main', ...)
```

### 2. Validate Input Parameters

```typescript
// Always specify required parameters and add custom validation
RuntimeAction.execute(
  'create-order',
  [HttpMethod.POST],
  ['customerId', 'items'], // Required params
  ['authorization'], // Required headers
  async (params, ctx) => {
    // Additional validation
    if (!Array.isArray(params.items) || params.items.length === 0) {
      return RuntimeActionResponse.error(
        HttpStatus.BAD_REQUEST,
        'Items array is required and cannot be empty'
      );
    }

    // Process order...
  }
);
```

### 3. Use Proper HTTP Methods

```typescript
// Specify appropriate HTTP methods for different operations
RuntimeAction.execute('get-user', [HttpMethod.GET], ...)      // Read operations
RuntimeAction.execute('create-user', [HttpMethod.POST], ...)   // Create operations
RuntimeAction.execute('update-user', [HttpMethod.PUT], ...)    // Update operations
RuntimeAction.execute('delete-user', [HttpMethod.DELETE], ...) // Delete operations
```

## Integration with Other Toolkit Features

The RuntimeAction feature integrates seamlessly with other toolkit components:

- **Framework Components**: Use `HttpStatus` and `HttpMethod` enums for consistent response codes and method validation
- **Adobe Commerce Integration**: Use `AdobeCommerceClient` and connection classes within action handlers
- **Adobe I/O Events**: Integrate with `EventMetadataManager`, `ProviderManager`, and `RegistrationManager`
- **Authentication**: Use `BearerToken` utilities for request authentication
- **REST Client**: Leverage `RestClient` for external API calls within actions
- **Validators**: Automatic parameter and header validation through built-in `Validator` utilities
- **Parameters**: Automatic parameter logging and processing through `Parameters` utilities

### Related Components:

- **[EventConsumerAction](./event-consumer-action.md)** - For event-driven processing instead of HTTP requests
- **[GraphQlAction](./graphql-action.md)** - For GraphQL endpoint handling  
- **[OpenWhiskAction](./openwhisk-action.md)** - For serverless function handling
- **[WebhookAction](./webhook-action.md)** - For webhook processing with signature verification
- **[ProviderManager](./provider.md)** - For managing Adobe I/O Events providers via RuntimeAction endpoints
- **[RegistrationManager](./registration.md)** - For managing Adobe I/O Events registrations via RuntimeAction endpoints
- **[EventMetadataManager](./event-metadata.md)** - For managing Adobe I/O Events metadata via RuntimeAction endpoints
- **[AdobeCommerceClient](./adobe-commerce-client.md)** - For Commerce API integration within actions
- **[BearerToken](./bearer-token.md)** - For extracting Bearer tokens from request headers

## Constants Reference

The RuntimeAction class uses constants from the framework's types module for consistent HTTP status codes and method validation.

### Key Constants:

#### HttpStatus

```typescript
enum HttpStatus {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  NOT_FOUND = 404,
  INTERNAL_ERROR = 500,
  // ... other status codes
}
```

#### HttpMethod

```typescript
enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
  // ... other methods
}
```

### Usage Examples:

```typescript
// Using HttpStatus for consistent error responses
return RuntimeActionResponse.error(HttpStatus.BAD_REQUEST, 'Invalid input');
return RuntimeActionResponse.error(HttpStatus.NOT_FOUND, 'User not found');

// Using HttpMethod for action method validation
RuntimeAction.execute('create-item', [HttpMethod.POST], ...);
RuntimeAction.execute('update-item', [HttpMethod.PUT, HttpMethod.PATCH], ...);
```

## Performance Considerations

### RuntimeAction Optimization

1. **Parameter Validation**: Specify required parameters upfront for automatic validation
2. **Method Restrictions**: Limit HTTP methods to reduce unnecessary processing
3. **Logging Levels**: Use appropriate log levels to balance debugging and performance
4. **Error Handling**: Use early returns for validation errors to avoid unnecessary processing
5. **Response Size**: Keep response payloads reasonably sized for optimal performance

### Memory Management

- RuntimeAction creates minimal overhead for request processing
- Automatic cleanup of action context after execution
- Efficient parameter and header processing
- Garbage collection friendly response handling

The RuntimeAction feature provides a robust foundation for creating Adobe I/O Runtime actions with automatic validation, logging, and error handling within the Adobe Commerce AIO Toolkit.
