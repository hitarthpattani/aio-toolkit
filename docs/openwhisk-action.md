# OpenWhisk Action Documentation

## Overview

The **OpenWhisk Action** component provides a wrapper for creating Adobe I/O Runtime (OpenWhisk) actions with built-in logging, error handling, and parameter management. It simplifies the development of serverless functions by providing a consistent structure, automatic logging setup, and standardized error responses within the Adobe Commerce AIO Toolkit.

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

### 1. Action Wrapper

- **Standardized action structure** with consistent error handling
- **Automatic logging setup** using Adobe I/O SDK Core Logger
- **Parameter handling** with secure parameter logging
- **Error recovery** with proper HTTP status codes

### 2. Logging Integration

- **Adobe I/O SDK Logger** with configurable log levels
- **Secure parameter logging** using Parameters utility
- **Automatic action naming** for logger identification
- **Debug and info logging** for development and production

### 3. Error Management

- **Automatic error catching** with 500 status code responses
- **Structured error responses** using RuntimeActionResponse
- **Error logging** for debugging and monitoring
- **Graceful failure handling** to prevent action crashes

## Usage

### Basic Import

```typescript
const { OpenwhiskAction } = require('@adobe-commerce/aio-toolkit');
```

## API Reference

### OpenwhiskAction

Creates OpenWhisk-compatible action handlers with logging and error handling.

```typescript
static execute(
  name?: string,
  action?: (
    params: { [key: string]: any },
    ctx: { logger: any; headers: { [key: string]: any } }
  ) => Promise<RuntimeActionResponseType>
): (params: { [key: string]: any }) => Promise<RuntimeActionResponseType>
```

**Parameters:**

- `name` (string, optional): Action name for logging identification (default: 'main')
- `action` (function, optional): Action handler function that processes the request

**Returns:** Function that can be used as an Adobe I/O Runtime action handler

**Context Object:**
The action handler receives a context object containing:

- `logger`: Adobe I/O SDK Core Logger instance with configured log level
- `headers`: HTTP request headers from `__ow_headers` parameter

## Examples

### 1. Basic OpenWhisk Action

```typescript
const { 
  OpenwhiskAction, 
  RuntimeActionResponse 
} = require('@adobe-commerce/aio-toolkit');

// Simple action with logging
const helloWorldAction = OpenwhiskAction.execute('hello-world', async (params, ctx) => {
  const { logger } = ctx;
  const { name = 'World' } = params;

  logger.info(`Greeting request for: ${name}`);

  const message = `Hello, ${name}!`;

  logger.info(`Generated greeting: ${message}`);

  return RuntimeActionResponse.success({
    message,
    timestamp: new Date().toISOString(),
    action: 'hello-world'
  });
});

// Export for Adobe I/O Runtime
module.exports.main = helloWorldAction;
```

### 2. Action with Validation

```typescript
const { 
  OpenwhiskAction, 
  RuntimeActionResponse,
  HttpStatus 
} = require('@adobe-commerce/aio-toolkit');

// Action with input validation and error handling
const validatedAction = OpenwhiskAction.execute('data-processor', async (params, ctx) => {
  const { logger } = ctx;
  const { data, operation = 'sum' } = params;

  logger.info(`Processing data with operation: ${operation}`);

  // Validate input
  if (!data || !Array.isArray(data)) {
    logger.error('Invalid input: data must be an array');
    return RuntimeActionResponse.error(HttpStatus.BAD_REQUEST, 'Invalid input: data must be an array');
  }

  if (data.length === 0) {
    logger.warn('Empty data array provided');
    return RuntimeActionResponse.success({
      result: 0,
      operation,
      count: 0,
      message: 'Empty data set'
    });
  }

  // Process data
  let result;
  switch (operation) {
    case 'sum':
      result = data.reduce((acc, val) => acc + (parseFloat(val) || 0), 0);
      break;
    case 'count':
      result = data.length;
      break;
    default:
      logger.error(`Unsupported operation: ${operation}`);
      return RuntimeActionResponse.error(HttpStatus.BAD_REQUEST, `Unsupported operation: ${operation}`);
  }

  logger.info(`Operation ${operation} completed with result: ${result}`);

  return RuntimeActionResponse.success({
    result,
    operation,
    count: data.length,
    processed_at: new Date().toISOString()
  });
});

module.exports.dataProcessor = validatedAction;
```

### 3. Async Processing Action

```typescript
const { 
  OpenwhiskAction, 
  RuntimeActionResponse 
} = require('@adobe-commerce/aio-toolkit');

// Action with asynchronous processing
const asyncAction = OpenwhiskAction.execute('async-processor', async (params, ctx) => {
  const { logger } = ctx;
  const { url } = params;

  logger.info('Starting async processing');

  try {
    // Simulate async operations
    const step1 = await performAsyncOperation1(url);
    const step2 = await performAsyncOperation2(step1);
    const finalResult = await performAsyncOperation3(step2);

    logger.info('Async processing completed successfully');

    return RuntimeActionResponse.success({ 
      result: finalResult,
      steps: 3,
      processed_at: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Async processing failed:', error);
    throw error; // Will be caught by OpenwhiskAction wrapper
  }
});

module.exports.asyncProcessor = asyncAction;
```

## Error Handling

### Automatic Error Handling

```typescript
// Errors are automatically caught and handled
const errorProneAction = OpenwhiskAction.execute('error-prone-action', async (params, ctx) => {
  const { logger } = ctx;

  // This error will be automatically caught
  throw new Error('Something went wrong!');

  // The OpenwhiskAction wrapper will:
  // 1. Log the error
  // 2. Return RuntimeActionResponse.error(HttpStatus.INTERNAL_ERROR, 'server error')
});
```

### Custom Error Handling

```typescript
const { 
  OpenwhiskAction, 
  RuntimeActionResponse,
  HttpStatus 
} = require('@adobe-commerce/aio-toolkit');

const customErrorAction = OpenwhiskAction.execute('custom-error-action', async (params, ctx) => {
  const { logger } = ctx;

  try {
    // Risky operation
    const result = await riskyOperation(params);

    return RuntimeActionResponse.success({ result });
  } catch (error) {
    logger.error('Custom error handling:', error);

    // Return custom error response
    if (error.name === 'ValidationError') {
      return RuntimeActionResponse.error(HttpStatus.BAD_REQUEST, 'Validation failed');
    } else if (error.name === 'NotFoundError') {
      return RuntimeActionResponse.error(HttpStatus.NOT_FOUND, 'Resource not found');
    } else {
      // Re-throw for automatic handling
      throw error;
    }
  }
});
```

## Best Practices

### 1. Action Structure

```typescript
// ✅ Good - Well-structured action
const wellStructuredAction = OpenwhiskAction.execute(
  'well-structured-action',
  async (params, ctx) => {
    const { logger } = ctx;

    // 1. Log action start
    logger.info('Action started');

    // 2. Validate inputs
    if (!params.required_field) {
      return RuntimeActionResponse.error(HttpStatus.BAD_REQUEST, 'Missing required field');
    }

    // 3. Process business logic
    const result = await processBusinessLogic(params);

    // 4. Log success and return
    logger.info('Action completed successfully');
    return RuntimeActionResponse.success({ result });
  }
);
```

### 2. Parameter Validation

```typescript
// ✅ Good - Comprehensive parameter validation
const validatedAction = OpenwhiskAction.execute('validated-action', async (params, ctx) => {
  const { logger } = ctx;

  // Validate required parameters
  const required = ['userId', 'action', 'data'];
  const missing = required.filter(param => !params[param]);

  if (missing.length > 0) {
    logger.error(`Missing parameters: ${missing.join(', ')}`);
    return RuntimeActionResponse.error(HttpStatus.BAD_REQUEST, `Missing parameters: ${missing.join(', ')}`);
  }

  // Validate parameter types
  if (typeof params.userId !== 'string') {
    return RuntimeActionResponse.error(HttpStatus.BAD_REQUEST, 'userId must be a string');
  }

  // Process action
  return RuntimeActionResponse.success({ processed: true });
});
```

### 3. Logging Best Practices

```typescript
// ✅ Good - Effective logging
const wellLoggedAction = OpenwhiskAction.execute('well-logged-action', async (params, ctx) => {
  const { logger } = ctx;

  logger.info('Action started', { userId: params.userId });

  try {
    logger.debug('Processing data', { dataSize: params.data?.length });

    const result = await processData(params.data);

    logger.info('Action completed successfully', {
      resultSize: result.length,
      processingTime: Date.now() - startTime,
    });

    return RuntimeActionResponse.success({ result });
  } catch (error) {
    logger.error('Action failed', {
      error: error.message,
      userId: params.userId,
    });
    throw error;
  }
});
```

## Integration with Other Toolkit Components

The OpenWhisk Action module integrates with other framework components:

- **[OpenWhisk](./openwhisk.md)**: Can be invoked by OpenWhisk client
- **[RuntimeAction](./runtime-action.md)**: Provides similar functionality for HTTP endpoints
- **Parameters**: Uses Parameters utility for secure logging
- **RuntimeActionResponse**: Uses for response structure

### OpenWhisk Client Integration

OpenWhisk Actions can be invoked by OpenWhisk client:

```typescript
const { Openwhisk, OpenwhiskAction } = require('@adobe-commerce/aio-toolkit');

// Create an action
const myAction = OpenwhiskAction.execute('my-action', async (params, ctx) => {
  const { logger } = ctx;
  logger.info('Action invoked via OpenWhisk client');

  return RuntimeActionResponse.success({
    message: 'Hello from OpenWhisk Action!',
    timestamp: new Date().toISOString()
  });
});

// Invoke the action using OpenWhisk client
const client = new Openwhisk('https://openwhisk.example.com', 'api-key');
const result = await client.execute('my-action', { param1: 'value1' });
```

### Action Framework Comparison

```typescript
// OpenWhisk Action (for serverless functions)
const openwhiskAction = OpenwhiskAction.execute('serverless-function', async (params, ctx) => {
  // Serverless function logic
  return RuntimeActionResponse.success({ result: 'processed' });
});

// RuntimeAction (for HTTP endpoints)
const { RuntimeAction, HttpMethod } = require('@adobe-commerce/aio-toolkit');
const httpAction = RuntimeAction.execute(
  'http-endpoint',
  [HttpMethod.POST],
  ['param1'],
  ['Authorization'],
  async (params, ctx) => {
    // HTTP endpoint logic
    return RuntimeActionResponse.success({ result: 'processed' });
  }
);
```

### Related Documentation:

- **[OpenWhisk](./openwhisk.md)** - For invoking OpenWhisk Actions
- **[RuntimeAction](./runtime-action.md)** - For HTTP endpoint actions
- **[EventConsumerAction](./event-consumer-action.md)** - For event-driven processing
- **[AdobeAuth](./adobe-auth.md)** - For authentication in actions

### Common Integration Patterns:

- **OpenWhisk Action + OpenWhisk**: Serverless function invocation
- **OpenWhisk Action + RuntimeAction**: Hybrid serverless and HTTP architectures
- **OpenWhisk Action + EventConsumerAction**: Event-driven serverless processing

## Constants Reference

The OpenWhisk Action module integrates with the toolkit's types module for consistent HTTP status handling.

### Key Constants Used in OpenWhisk Action:

- **HttpStatus**: Used for response status codes in action handlers

### Quick Reference:

```typescript
const { HttpStatus } = require('@adobe-commerce/aio-toolkit');

// OpenWhisk Action uses these status codes:
// - HttpStatus.OK (200) for successful responses
// - HttpStatus.BAD_REQUEST (400) for validation errors
// - HttpStatus.NOT_FOUND (404) for missing resources
// - HttpStatus.INTERNAL_ERROR (500) for server errors (automatic)
```

### Automatic Status Code Usage:

```typescript
// OpenWhisk Action automatically returns 500 for unhandled errors
// Custom status codes can be returned in action handlers:
return RuntimeActionResponse.error(HttpStatus.BAD_REQUEST, 'Invalid input');
```

For comprehensive examples and best practices with HTTP constants, refer to the RuntimeAction types module.

## Performance Considerations

### OpenWhisk Action Optimization

1. **Logging Efficiency**: Use appropriate log levels to avoid performance overhead
2. **Parameter Handling**: Keep parameters reasonably sized for efficient processing
3. **Error Handling**: Implement efficient error handling to avoid unnecessary processing
4. **Resource Management**: Clean up resources properly in action handlers
5. **Async Operations**: Use proper async/await patterns for non-blocking operations

### Memory Management

- Avoid storing large objects in action scope
- Clean up resources after use
- Use efficient data structures for processing
- Monitor memory usage in long-running actions

### Best Practices for Performance

1. **Use Appropriate Log Levels**: Set LOG_LEVEL appropriately for production
2. **Validate Early**: Perform input validation early to avoid unnecessary processing
3. **Handle Errors Efficiently**: Use proper error handling patterns
4. **Monitor Performance**: Track action execution times and optimize bottlenecks

The OpenWhisk Action module provides a robust wrapper for creating Adobe I/O Runtime actions with built-in logging, error handling, and parameter management, simplifying serverless function development within the Adobe Commerce AIO Toolkit.
