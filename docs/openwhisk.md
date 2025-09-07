# OpenWhisk Documentation

## Overview

The **OpenWhisk** module provides a client interface for interacting with Apache OpenWhisk serverless platform within the Adobe Commerce AIO Toolkit. It enables direct invocation of OpenWhisk actions with proper authentication, parameter handling, and response management. This module is useful for creating distributed serverless architectures and action orchestration.

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

### 1. OpenWhisk Client

- **Direct action invocation** with blocking and non-blocking modes
- **Authentication handling** with API key management
- **Parameter passing** with flexible data structures
- **Response handling** with activation results

### 2. Action Management

- **Synchronous execution** with blocking invocation
- **Parameter serialization** for complex data types
- **Result extraction** from activation responses
- **Error propagation** from remote actions

### 3. Serverless Integration

- **Distributed architecture** support for microservices
- **Action orchestration** for complex workflows
- **Remote execution** of serverless functions
- **Scalable processing** with OpenWhisk infrastructure

## Usage

### Basic Import

```typescript
const { Openwhisk } = require('@adobe-commerce/aio-toolkit');
```

## API Reference

### Openwhisk

Client for invoking OpenWhisk actions with authentication and parameter handling.

```typescript
class Openwhisk {
  constructor(host: string, apiKey: string);

  async execute(action: string, params: Dict): Promise<Activation<Dict>>;
}
```

**Constructor Parameters:**

- `host` (string): OpenWhisk API host URL
- `apiKey` (string): Authentication API key for OpenWhisk

**Methods:**

**execute(action, params)**

- **Parameters**:
  - `action` (string): Name of the OpenWhisk action to invoke
  - `params` (Dict): Parameters to pass to the action
- **Returns**: Promise<Activation<Dict>> - OpenWhisk activation result
- **Description**: Invokes an OpenWhisk action with blocking execution

### Activation Response

```typescript
interface Activation<T> {
  activationId: string;
  response: {
    success: boolean;
    result: T;
  };
  // Additional OpenWhisk activation metadata
}
```

## Examples

### 1. Basic OpenWhisk Action Invocation

```typescript
const { Openwhisk } = require('@adobe-commerce/aio-toolkit');

const openwhisk = new Openwhisk('https://openwhisk.example.com', 'your-api-key');

// Simple action invocation
const invokeAction = async () => {
  try {
    const result = await openwhisk.execute('hello-world', {
      name: 'John Doe',
      message: 'Hello from OpenWhisk!'
    });

    console.log('Success:', result.response.success);
    console.log('Result:', result.response.result);
    console.log('Activation ID:', result.activationId);
    
    return result;
  } catch (error) {
    console.error('Action invocation failed:', error.message);
    throw error;
  }
};
```

### 2. Multiple Action Composition

```typescript
const { Openwhisk } = require('@adobe-commerce/aio-toolkit');

const openwhisk = new Openwhisk('https://openwhisk.example.com', 'your-api-key');

// Compose multiple actions in a workflow
const processData = async (inputData) => {
  try {
    // Step 1: Validate data
    const validation = await openwhisk.execute('data-validator', {
      data: inputData
    });
    
    if (!validation.response.success) {
      throw new Error('Data validation failed');
    }

    // Step 2: Transform data
    const transformation = await openwhisk.execute('data-transformer', {
      data: validation.response.result
    });

    return transformation.response.result;
  } catch (error) {
    console.error('Data processing failed:', error.message);
    throw error;
  }
};
```

### 3. Error Handling with Retry Logic

```typescript
const { Openwhisk } = require('@adobe-commerce/aio-toolkit');

const openwhisk = new Openwhisk('https://openwhisk.example.com', 'your-api-key');

// Execute action with retry logic
const executeWithRetry = async (actionName, params, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await openwhisk.execute(actionName, params);
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      console.warn(`Attempt ${attempt} failed, retrying...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
};
```

## Error Handling

### Common Error Scenarios

```typescript
const handleOpenWhiskErrors = async (openwhisk, actionName, params) => {
  try {
    const result = await openwhisk.execute(actionName, params);
    return { success: true, result: result.response.result };
  } catch (error) {
    if (error.message.includes('authentication')) {
      return { success: false, error: 'Authentication failed' };
    } else if (error.message.includes('not found')) {
      return { success: false, error: 'Action not found' };
    } else if (error.message.includes('timeout')) {
      return { success: false, error: 'Action execution timeout' };
    } else {
      return { success: false, error: 'Unknown error occurred' };
    }
  }
};
```

## Best Practices

### 1. Client Configuration

```typescript
// ✅ Good - Proper client configuration
const createOpenWhiskClient = (config) => {
  if (!config.host || !config.apiKey) {
    throw new Error('OpenWhisk host and API key are required');
  }

  return new Openwhisk(config.host, config.apiKey);
};

// ❌ Bad - No configuration validation
const badClient = new Openwhisk('', ''); // Will fail at runtime
```

### 2. Parameter Validation

```typescript
// ✅ Good - Validate parameters before invocation
const executeWithValidation = async (openwhisk, actionName, params) => {
  if (!params || typeof params !== 'object') {
    throw new Error('Parameters must be an object');
  }

  return await openwhisk.execute(actionName, params);
};
```

### 3. Resource Management

```typescript
// ✅ Good - Reuse client instances
class OpenWhiskManager {
  constructor(host, apiKey) {
    this.client = new Openwhisk(host, apiKey);
  }

  async execute(actionName, params) {
    return await this.client.execute(actionName, params);
  }
}
```

## Integration with Other Toolkit Components

The OpenWhisk module integrates seamlessly with other toolkit components:

- **[OpenWhisk Action](./openwhisk-action.md)**: Provides action wrapper functionality
- **[RuntimeAction](./runtime-action.md)**: Can invoke OpenWhisk actions from HTTP endpoints
- **[EventConsumerAction](./event-consumer-action.md)**: Can trigger OpenWhisk actions from events
- **[AdobeAuth](./adobe-auth.md)**: Can provide authentication for OpenWhisk action calls

### RuntimeAction Integration

Use OpenWhisk in RuntimeAction handlers:

```typescript
const { 
  RuntimeAction, 
  Openwhisk,
  RuntimeActionResponse,
  HttpMethod, 
  HttpStatus 
} = require('@adobe-commerce/aio-toolkit');

const openwhiskProxyAction = RuntimeAction.execute(
  'openwhisk-proxy',
  [HttpMethod.POST],
  ['action_name', 'params'],
  ['Authorization'],
  async (params, ctx) => {
    const { logger } = ctx;
    const { action_name, params: actionParams } = params;

    try {
      const openwhisk = new Openwhisk(process.env.OPENWHISK_HOST, process.env.OPENWHISK_API_KEY);

      const result = await openwhisk.execute(action_name, actionParams);

      return RuntimeActionResponse.success({
        success: result.response.success,
        result: result.response.result,
        activation_id: result.activationId,
      });
    } catch (error) {
      logger.error('OpenWhisk proxy failed:', error);
      return RuntimeActionResponse.error(HttpStatus.INTERNAL_ERROR, error.message);
    }
  }
);
```

### EventConsumerAction Integration

Trigger OpenWhisk actions from events:

```typescript
const { 
  EventConsumerAction, 
  Openwhisk,
  RuntimeActionResponse,
  HttpStatus
} = require('@adobe-commerce/aio-toolkit');

const eventTriggeredAction = EventConsumerAction.execute(
  'event-triggered-openwhisk',
  ['event_type', 'event_data'],
  [],
  async (params, ctx) => {
    const { logger } = ctx;
    const { event_type, event_data } = params;

    try {
      const openwhisk = new Openwhisk(process.env.OPENWHISK_HOST, process.env.OPENWHISK_API_KEY);

      // Map event types to OpenWhisk actions
      const actionMap = {
        'user.created': 'process-new-user',
        'order.placed': 'process-new-order',
        'payment.completed': 'process-payment',
      };

      const actionName = actionMap[event_type];

      if (!actionName) {
        return RuntimeActionResponse.success({ message: 'No action mapped for event type' });
      }

      const result = await openwhisk.execute(actionName, {
        event_type,
        event_data,
        timestamp: new Date().toISOString(),
      });

      return RuntimeActionResponse.success({
        message: 'OpenWhisk action triggered',
        action: actionName,
        success: result.response.success,
        activation_id: result.activationId,
      });
    } catch (error) {
      logger.error('Event-triggered OpenWhisk action failed:', error);
      return RuntimeActionResponse.error(HttpStatus.INTERNAL_ERROR, error.message);
    }
  }
);
```

### Related Documentation:

- **[OpenWhisk Action](./openwhisk-action.md)** - For action wrapper functionality
- **[RuntimeAction](./runtime-action.md)** - For creating HTTP endpoints that invoke OpenWhisk actions
- **[EventConsumerAction](./event-consumer-action.md)** - For event-driven OpenWhisk action invocation
- **[AdobeAuth](./adobe-auth.md)** - For authentication in OpenWhisk calls

### Common Integration Patterns:

- **OpenWhisk + RuntimeAction**: HTTP endpoints that proxy to OpenWhisk actions
- **OpenWhisk + EventConsumerAction**: Event-driven OpenWhisk action invocation
- **OpenWhisk + AdobeAuth**: Authenticated OpenWhisk action calls

## Constants Reference

The OpenWhisk module integrates with the toolkit's types module for consistent HTTP status handling.

### Key Constants Used in OpenWhisk:

- **HttpStatus**: Used in RuntimeAction handlers that invoke OpenWhisk actions

### Quick Reference:

```typescript
const { HttpStatus } = require('@adobe-commerce/aio-toolkit');

// OpenWhisk integration can use these status codes:
// - HttpStatus.OK (200) for successful action invocations
// - HttpStatus.BAD_REQUEST (400) for invalid parameters
// - HttpStatus.INTERNAL_ERROR (500) for OpenWhisk execution errors
```

For comprehensive examples and best practices with HTTP constants, refer to the RuntimeAction types module.

## Performance Considerations

### OpenWhisk Optimization

1. **Client Reuse**: Reuse OpenWhisk client instances to avoid connection overhead
2. **Parameter Size**: Keep parameters reasonably sized for efficient serialization
3. **Parallel Execution**: Use parallel execution for independent actions
4. **Error Handling**: Implement proper error handling and retry logic
5. **Timeout Management**: Set appropriate timeouts for action execution

### Memory Management

- Reuse client instances across multiple invocations
- Avoid storing large result sets in memory
- Clean up resources after use
- Monitor memory usage in long-running processes

The OpenWhisk module provides a robust client interface for Apache OpenWhisk integration within the Adobe Commerce AIO Toolkit, enabling serverless action invocation with proper authentication, parameter handling, and error management.