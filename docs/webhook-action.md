# WebhookAction Documentation

## Overview

The **WebhookAction** module provides a secure, feature-rich webhook handling system within the Adobe Commerce AIO Toolkit. It creates HTTP endpoints that can receive webhook payloads with signature verification, parameter validation, and structured response handling. The module supports Adobe Commerce webhook patterns and generic webhook processing with built-in security features.

## Table of Contents

- [Overview](#overview)
- [Core Features](#core-features)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Signature Verification](#signature-verification)
- [Response Types](#response-types)
- [Error Handling](#error-handling)
- [Security](#security)
- [Best Practices](#best-practices)
- [Integration with Other Toolkit Components](#integration-with-other-toolkit-components)
- [Constants Reference](#constants-reference)

## Core Features

### 1. Webhook Endpoint Creation

- **HTTP endpoint creation** for GET and POST requests using RuntimeAction
- **Automatic payload parsing** from base64-encoded request bodies  
- **Parameter validation** with required parameters and headers
- **Context injection** with logger and headers

### 2. Signature Verification

- **Cryptographic signature verification** using RSA SHA256
- **Multiple verification modes** (disabled, enabled, base64-enabled)
- **Public key validation** for secure webhook authentication
- **Adobe Commerce webhook compatibility**

### 3. Structured Responses

- **Operation-based responses** (success, exception, add, replace, remove)
- **Adobe Commerce compatible** response format
- **Error handling** with proper HTTP status codes
- **Flexible response patterns**

### 4. Security Features

- **Request validation** with parameter and header checking
- **Signature verification** to ensure payload authenticity
- **Secure logging** with hidden sensitive information
- **Error handling** with appropriate status codes

## Usage

### Basic Import

```typescript
const { WebhookAction, WebhookActionResponse } = require('@adobe-commerce/aio-toolkit');
```

### SignatureVerification Import

```typescript
const { SignatureVerification } = require('@adobe-commerce/aio-toolkit');
```

## API Reference

### WebhookAction

Creates webhook endpoints with signature verification and validation.

```typescript
static execute(
  name?: string,
  requiredParams?: string[],
  requiredHeaders?: string[],
  signatureVerification?: SignatureVerification,
  action?: (
    params: { [key: string]: any },
    ctx: { logger: any; headers: { [key: string]: any } }
  ) => Promise<RuntimeActionResponseType>
): (params: { [key: string]: any }) => Promise<RuntimeActionResponseType>
```

**Parameters:**

- `name` (string, optional): Webhook name suffix (default: 'main')
- `requiredParams` (string[], optional): Required parameter names (default: [])
- `requiredHeaders` (string[], optional): Required header names (default: ['Authorization'])
- `signatureVerification` (SignatureVerification, optional): Verification mode (default: DISABLED)
- `action` (function, optional): Webhook handler function

**Returns:** Function that can be used as an Adobe I/O Runtime action handler

### SignatureVerification Enum

```typescript
enum SignatureVerification {
  DISABLED = 0,           // No signature verification
  ENABLED = 1,            // RSA SHA256 signature verification
  ENABLED_WITH_BASE64 = 2 // Base64-encoded signature verification
}
```

### WebhookActionResponse

Provides Adobe Commerce compatible response methods.

```typescript
class WebhookActionResponse {
  static success(): SuccessResponse;
  static exception(exceptionClass?: string, message?: string): ExceptionResponse;
  static add(path: string, value: any, instance?: string): AddResponse;
  static replace(path: string, value: any, instance?: string): ReplaceResponse;
  static remove(path: string): RemoveResponse;
}
```

## Examples

### 1. Basic Webhook Handler

```typescript
const { 
  WebhookAction, 
  WebhookActionResponse,
  SignatureVerification 
} = require('@adobe-commerce/aio-toolkit');

// Simple webhook handler
const basicWebhook = WebhookAction.execute(
  'basic-webhook',
  ['event_type'],
  ['Authorization'],
  SignatureVerification.DISABLED,
  async (params, ctx) => {
    const { logger } = ctx;
    const { event_type, data } = params;

    logger.info(`Received webhook event: ${event_type}`);

    // Process webhook data
    switch (event_type) {
      case 'user.created':
        logger.info('Processing user creation event');
        break;
      case 'order.placed':
        logger.info('Processing order placement event');
        break;
      default:
        logger.warn(`Unknown event type: ${event_type}`);
    }

    return WebhookActionResponse.success();
  }
);

module.exports.main = basicWebhook;
```

### 2. Secure Webhook with Signature Verification

```typescript
const { 
  WebhookAction, 
  WebhookActionResponse,
  SignatureVerification 
} = require('@adobe-commerce/aio-toolkit');

// Webhook with signature verification
const secureWebhook = WebhookAction.execute(
  'secure-webhook',
  ['event_type', 'data'],
  ['Authorization', 'X-Signature'],
  SignatureVerification.ENABLED,
  async (params, ctx) => {
    const { logger } = ctx;
    const { event_type, data } = params;

    logger.info('Processing verified webhook', {
      event_type,
      timestamp: new Date().toISOString()
    });

    try {
      // Process webhook payload
      const result = await processWebhookData(event_type, data);

      logger.info('Webhook processed successfully', { result });

      return WebhookActionResponse.success();
    } catch (error) {
      logger.error('Webhook processing failed:', error);

      return WebhookActionResponse.exception(
        'ProcessingException',
        error.message
      );
    }
  }
);

// Helper function
async function processWebhookData(eventType, data) {
  // Implement your webhook processing logic
  return { processed: true, eventType, timestamp: Date.now() };
}

module.exports.main = secureWebhook;
```

### 3. Data Manipulation Webhook

```typescript
const { 
  WebhookAction, 
  WebhookActionResponse,
  SignatureVerification 
} = require('@adobe-commerce/aio-toolkit');

// Webhook that modifies data in response
const dataWebhook = WebhookAction.execute(
  'data-webhook',
  ['product_data'],
  ['Authorization'],
  SignatureVerification.DISABLED,
  async (params, ctx) => {
    const { logger } = ctx;
    const { product_data, operation } = params;

    logger.info(`Processing product data operation: ${operation}`);

    try {
      switch (operation) {
        case 'add_field':
          // Add a field to the product data
          return WebhookActionResponse.add(
            'custom_field',
            'custom_value',
            'product_instance'
          );

        case 'update_price':
          // Replace price with calculated value
          const newPrice = calculatePrice(product_data.base_price);
          return WebhookActionResponse.replace(
            'price',
            newPrice,
            'product_instance'
          );

        case 'remove_deprecated':
          // Remove deprecated field
          return WebhookActionResponse.remove('deprecated_field');

        default:
          return WebhookActionResponse.success();
      }
    } catch (error) {
      logger.error('Data operation failed:', error);
      
      return WebhookActionResponse.exception(
        'DataOperationException',
        `Failed to process ${operation}: ${error.message}`
      );
    }
  }
);

// Helper function
function calculatePrice(basePrice) {
  // Implement your price calculation logic
  return basePrice * 1.2; // Example: 20% markup
}

module.exports.main = dataWebhook;
```

## Signature Verification

### Verification Modes

#### DISABLED (0)
No signature verification is performed. Suitable for internal or trusted environments.

```typescript
const webhook = WebhookAction.execute(
  'internal-webhook',
  [],
  [],
  SignatureVerification.DISABLED,
  handler
);
```

#### ENABLED (1)
Standard RSA SHA256 signature verification using a public key.

```typescript
// Requires PUBLIC_KEY environment variable
const webhook = WebhookAction.execute(
  'secure-webhook',
  ['data'],
  ['Authorization', 'X-Signature'],
  SignatureVerification.ENABLED,
  handler
);
```

#### ENABLED_WITH_BASE64 (2)
RSA SHA256 signature verification with base64-encoded signatures.

```typescript
// For systems that base64-encode signatures
const webhook = WebhookAction.execute(
  'b64-webhook',
  ['data'],
  ['Authorization', 'X-Signature-Base64'],
  SignatureVerification.ENABLED_WITH_BASE64,
  handler
);
```

## Response Types

### Success Response

```typescript
return WebhookActionResponse.success();
// Returns: { op: 'success' }
```

### Exception Response

```typescript
return WebhookActionResponse.exception('ValidationException', 'Invalid data');
// Returns: { op: 'exception', class: 'ValidationException', message: 'Invalid data' }
```

### Data Manipulation Responses

```typescript
// Add data
return WebhookActionResponse.add('path.to.field', 'new_value', 'instance');

// Replace data  
return WebhookActionResponse.replace('path.to.field', 'updated_value', 'instance');

// Remove data
return WebhookActionResponse.remove('path.to.field');
```

## Error Handling

### Automatic Error Handling

WebhookAction automatically handles various error scenarios:

```typescript
const errorHandledWebhook = WebhookAction.execute(
  'error-handled',
  ['required_field'],
  ['Authorization'],
  SignatureVerification.DISABLED,
  async (params, ctx) => {
    const { logger } = ctx;

    // Missing required parameters are handled automatically
    // Invalid signatures are handled automatically
    // Malformed JSON payloads are handled automatically

    try {
      // Your webhook logic
      const result = await processData(params.required_field);
      return WebhookActionResponse.success();
    } catch (error) {
      // Return appropriate error response
      return WebhookActionResponse.exception(
        'ProcessingException',
        error.message
      );
    }
  }
);
```

### Common Error Patterns

```typescript
// Validation errors
if (!isValidData(params.data)) {
  return WebhookActionResponse.exception(
    'ValidationException',
    'Invalid data format'
  );
}

// Not found errors
if (!resourceExists(params.resource_id)) {
  return WebhookActionResponse.exception(
    'NotFoundException',
    'Resource not found'
  );
}

// Authorization errors
if (!isAuthorized(ctx.headers.Authorization)) {
  return WebhookActionResponse.exception(
    'AuthorizationException',
    'Insufficient permissions'
  );
}
```

## Security

### Required Headers

Always specify required headers for security:

```typescript
// ✅ Good - Require authorization
const secureWebhook = WebhookAction.execute(
  'secure',
  ['data'],
  ['Authorization'],  // Require auth header
  SignatureVerification.ENABLED,
  handler
);

// ❌ Bad - No security headers
const insecureWebhook = WebhookAction.execute(
  'insecure',
  ['data'],
  [],  // No required headers
  SignatureVerification.DISABLED,
  handler
);
```

### Public Key Management

```typescript
// Set PUBLIC_KEY environment variable for signature verification
process.env.PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
-----END PUBLIC KEY-----`;
```

### Secure Parameter Logging

WebhookAction uses secure parameter logging to hide sensitive data:

```typescript
// Sensitive data is automatically hidden in logs
const webhook = WebhookAction.execute(
  'logging-webhook',
  ['data'],
  ['Authorization'],
  SignatureVerification.DISABLED,
  async (params, ctx) => {
    // Parameters are logged securely by default
    ctx.logger.debug('Processing webhook data');
    
    return WebhookActionResponse.success();
  }
);
```

## Best Practices

### 1. Parameter Validation

```typescript
// ✅ Good - Validate required parameters
const validatedWebhook = WebhookAction.execute(
  'validated-webhook',
  ['event_type', 'data'],  // Specify required parameters
  ['Authorization'],
  SignatureVerification.ENABLED,
  async (params, ctx) => {
    const { logger } = ctx;
    const { event_type, data } = params;

    // Additional validation
    if (!['user.created', 'order.placed'].includes(event_type)) {
      return WebhookActionResponse.exception(
        'ValidationException',
        'Invalid event type'
      );
    }

    return WebhookActionResponse.success();
  }
);
```

### 2. Error Handling

```typescript
// ✅ Good - Comprehensive error handling
const robustWebhook = WebhookAction.execute(
  'robust-webhook',
  ['data'],
  ['Authorization'],
  SignatureVerification.ENABLED,
  async (params, ctx) => {
    const { logger } = ctx;

    try {
      const result = await processWebhookData(params.data);
      
      logger.info('Webhook processed successfully');
      return WebhookActionResponse.success();
    } catch (error) {
      logger.error('Webhook processing failed:', error);

      if (error.name === 'ValidationError') {
        return WebhookActionResponse.exception('ValidationException', error.message);
      } else if (error.name === 'NetworkError') {
        return WebhookActionResponse.exception('NetworkException', 'Service unavailable');
      } else {
        return WebhookActionResponse.exception('ProcessingException', 'Internal error occurred');
      }
    }
  }
);
```

### 3. Logging and Monitoring

```typescript
// ✅ Good - Comprehensive logging
const monitoredWebhook = WebhookAction.execute(
  'monitored-webhook',
  ['event_type'],
  ['Authorization'],
  SignatureVerification.ENABLED,
  async (params, ctx) => {
    const { logger } = ctx;
    const startTime = Date.now();

    logger.info('Webhook processing started', {
      event_type: params.event_type,
      timestamp: new Date().toISOString()
    });

    try {
      const result = await processWebhook(params);

      const duration = Date.now() - startTime;
      logger.info('Webhook processing completed', {
        event_type: params.event_type,
        duration,
        success: true
      });

      return WebhookActionResponse.success();
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Webhook processing failed', {
        event_type: params.event_type,
        duration,
        error: error.message,
        success: false
      });

      return WebhookActionResponse.exception('ProcessingException', error.message);
    }
  }
);
```

## Integration with Other Toolkit Components

The WebhookAction module integrates seamlessly with other toolkit components:

- **[RuntimeAction](./runtime-action.md)**: Built on RuntimeAction for HTTP endpoint creation
- **[AdobeCommerceClient](./adobe-commerce-client.md)**: Can make API calls from webhook handlers
- **[AdobeAuth](./adobe-auth.md)**: Can handle authentication within webhooks
- **[BearerToken](./bearer-token.md)**: Extract Bearer tokens for webhook authentication
- **[EventConsumerAction](./event-consumer-action.md)**: Can trigger event processing from webhooks
- **[GraphQlAction](./graphql-action.md)**: Can process GraphQL operations in webhook handlers

### RuntimeAction Integration

WebhookAction is built on RuntimeAction:

```typescript
// WebhookAction internally creates RuntimeAction handlers
const webhook = WebhookAction.execute(
  'webhook-name',
  ['data'],
  ['Authorization'],
  SignatureVerification.ENABLED,
  async (params, ctx) => {
    // Handler logic using RuntimeAction foundation
    return WebhookActionResponse.success();
  }
);

// Equivalent RuntimeAction (for comparison)
const { RuntimeAction, HttpMethod } = require('@adobe-commerce/aio-toolkit');

const equivalentAction = RuntimeAction.execute(
  'webhook-name',
  [HttpMethod.GET, HttpMethod.POST],
  ['data'],
  ['Authorization'],
  async (params, ctx) => {
    // Manual webhook handling logic
    return RuntimeActionResponse.success({ processed: true });
  }
);
```

### AdobeCommerceClient Integration

Use AdobeCommerceClient within webhook handlers:

```typescript
const { 
  WebhookAction, 
  WebhookActionResponse,
  AdobeCommerceClient,
  SignatureVerification 
} = require('@adobe-commerce/aio-toolkit');

const commerceWebhook = WebhookAction.execute(
  'commerce-webhook',
  ['order_data'],
  ['Authorization'],
  SignatureVerification.ENABLED,
  async (params, ctx) => {
    const { logger } = ctx;
    const { order_data } = params;

    try {
      // Create Adobe Commerce client
      const client = new AdobeCommerceClient({
        host: process.env.COMMERCE_HOST,
        // ... other config
      });

      // Update order status in Adobe Commerce
      await client.put(`/orders/${order_data.id}`, {
        status: 'processing'
      });

      logger.info('Order updated successfully');
      return WebhookActionResponse.success();
    } catch (error) {
      logger.error('Failed to update order:', error);
      return WebhookActionResponse.exception(
        'CommerceException',
        'Failed to update order status'
      );
    }
  }
);
```

### EventConsumerAction Integration

Trigger event processing from webhooks:

```typescript
const { 
  WebhookAction, 
  WebhookActionResponse,
  EventConsumerAction,
  SignatureVerification 
} = require('@adobe-commerce/aio-toolkit');

// Webhook that triggers event processing
const eventWebhook = WebhookAction.execute(
  'event-webhook',
  ['webhook_data'],
  ['Authorization'],
  SignatureVerification.ENABLED,
  async (params, ctx) => {
    const { logger } = ctx;

    try {
      // Transform webhook data to event format
      const eventData = {
        event_type: params.webhook_data.type,
        event_data: params.webhook_data.payload,
        source: 'webhook',
        timestamp: new Date().toISOString()
      };

      // Process as event (this would be in a separate event handler)
      logger.info('Webhook converted to event', { event_type: eventData.event_type });

      return WebhookActionResponse.success();
    } catch (error) {
      logger.error('Event conversion failed:', error);
      return WebhookActionResponse.exception(
        'EventException',
        'Failed to process webhook as event'
      );
    }
  }
);
```

### Related Documentation:

- **[RuntimeAction](./runtime-action.md)** - For HTTP endpoint foundation
- **[AdobeCommerceClient](./adobe-commerce-client.md)** - For Adobe Commerce API calls
- **[RegistrationManager](./registration.md)** - For managing webhook registrations that deliver events to WebhookAction
- **[EventConsumerAction](./event-consumer-action.md)** - For event processing that WebhookAction can trigger
- **[AdobeAuth](./adobe-auth.md)** - For authentication handling
- **[BearerToken](./bearer-token.md)** - For Bearer token extraction and authentication

### Common Integration Patterns:

- **WebhookAction + AdobeCommerceClient**: Process webhooks and update Adobe Commerce
- **WebhookAction + EventConsumerAction**: Convert webhooks to events for processing
- **WebhookAction + AdobeAuth**: Secure webhook endpoints with authentication
- **WebhookAction + BearerToken**: Authenticate webhooks using Bearer tokens
- **WebhookAction + GraphQlAction**: Process GraphQL mutations from webhook data

## Constants Reference

The WebhookAction module integrates with the toolkit's types module for consistent HTTP status handling.

### Key Constants Used in WebhookAction:

- **HttpMethod**: GET and POST methods are supported by default
- **HttpStatus**: Used for error responses and validation
- **SignatureVerification**: Enum for signature verification modes

### Quick Reference:

```typescript
const { SignatureVerification, HttpStatus } = require('@adobe-commerce/aio-toolkit');

// Signature verification modes:
SignatureVerification.DISABLED          // 0 - No verification
SignatureVerification.ENABLED           // 1 - RSA SHA256 verification
SignatureVerification.ENABLED_WITH_BASE64 // 2 - Base64-encoded verification

// WebhookAction automatically handles HTTP status codes:
// - HttpStatus.OK (200) for successful webhook processing
// - HttpStatus.BAD_REQUEST (400) for validation errors
// - HttpStatus.UNAUTHORIZED (401) for signature verification failures
// - HttpStatus.INTERNAL_ERROR (500) for processing errors
```

### WebhookActionResponse Operations:

```typescript
const { WebhookActionResponse } = require('@adobe-commerce/aio-toolkit');

// Available response operations:
WebhookActionResponse.success()                    // { op: 'success' }
WebhookActionResponse.exception(class, message)    // { op: 'exception', class, message }
WebhookActionResponse.add(path, value, instance)   // { op: 'add', path, value, instance }
WebhookActionResponse.replace(path, value, instance) // { op: 'replace', path, value, instance }
WebhookActionResponse.remove(path)                 // { op: 'remove', path }
```

For comprehensive examples and best practices with HTTP constants, refer to the RuntimeAction types module.

## Performance Considerations

### WebhookAction Optimization

1. **Signature Verification**: Use DISABLED for internal webhooks to reduce processing overhead
2. **Parameter Validation**: Validate parameters early to avoid unnecessary processing
3. **Logging**: Use appropriate log levels to balance debugging and performance
4. **Payload Processing**: Handle large payloads efficiently with streaming when possible
5. **Error Handling**: Implement fast-fail patterns for invalid requests

### Memory Management

- Process webhook payloads efficiently without storing large objects
- Clean up resources after webhook processing
- Use efficient JSON parsing for large payloads
- Monitor memory usage for high-frequency webhooks

### Best Practices for Performance

1. **Minimize Processing Time**: Keep webhook handlers lightweight and fast
2. **Async Operations**: Use proper async patterns for non-blocking operations
3. **Signature Verification**: Only enable when necessary for security
4. **Parameter Validation**: Use early validation to reject invalid requests quickly
5. **Response Optimization**: Use appropriate response types for different scenarios

The WebhookAction module provides a secure, efficient webhook handling system within the Adobe Commerce AIO Toolkit, enabling reliable webhook processing with signature verification, structured responses, and comprehensive error handling.
