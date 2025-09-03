# Usage Examples

This document shows how to use the Adobe Commerce AIO Toolkit in your projects.

## Installation

Install directly from GitHub:
```bash
npm install github:hitarthpattani/aio-toolkit
```

Or if published to npm:
```bash
npm install @adobe-commerce/aio-toolkit
```

## ES Module (ESM) Usage

```javascript
import { Action, HttpMethod, HttpStatus, ActionResponse } from '@adobe-commerce/aio-toolkit';

// Create an action handler
const handler = Action.execute(
  'my-action',                           // Action name
  [HttpMethod.GET, HttpMethod.POST],     // Allowed HTTP methods
  ['name', 'email'],                     // Required parameters
  ['authorization'],                     // Required headers
  async (params, ctx) => {               // Your action logic
    const { name, email } = params;
    ctx.logger.info(`Processing request for ${name}`);
    
    return ActionResponse.success({
      message: `Hello ${name}!`,
      email: email
    });
  }
);

// Export for Adobe App Builder
exports.main = handler;
```

## CommonJS Usage

```javascript
const { Action, HttpMethod, HttpStatus, ActionResponse } = require('@adobe-commerce/aio-toolkit');

// Create an action handler
const handler = Action.execute(
  'my-action',
  [HttpMethod.POST],
  ['productId'],
  ['x-api-key'],
  async (params, ctx) => {
    try {
      const { productId } = params;
      
      // Your business logic here
      const result = await processProduct(productId);
      
      return ActionResponse.success(result);
    } catch (error) {
      ctx.logger.error('Action failed:', error);
      return ActionResponse.error(HttpStatus.INTERNAL_ERROR, error.message);
    }
  }
);

module.exports = { main: handler };
```

## Available Exports

### Action
- `Action.execute(name, httpMethods, requiredParams, requiredHeaders, actionFn)` - Creates action handler

### ActionResponse
- `ActionResponse.success(data, headers?)` - Creates success response
- `ActionResponse.error(statusCode, message)` - Creates error response

### HttpStatus Enum
- `HttpStatus.OK` (200)
- `HttpStatus.BAD_REQUEST` (400)
- `HttpStatus.UNAUTHORIZED` (401)
- `HttpStatus.NOT_FOUND` (404)
- `HttpStatus.METHOD_NOT_ALLOWED` (405)
- `HttpStatus.INTERNAL_ERROR` (500)

### HttpMethod Enum
- `HttpMethod.GET` ("get")
- `HttpMethod.POST` ("post")
- `HttpMethod.PUT` ("put")
- `HttpMethod.DELETE` ("delete")
- `HttpMethod.PATCH` ("patch")
- `HttpMethod.HEAD` ("head")
- `HttpMethod.OPTIONS` ("options")

### Utilities
- `Parameters.stringify(params)` - Safe parameter serialization
- `Validator.getMissingKeys(obj, required)` - Validation helper
- `Validator.checkMissingRequestInputs(params, requiredParams, requiredHeaders)` - Request validation

## TypeScript Support

Full TypeScript support with type definitions:

```typescript
import { 
  Action, 
  HttpMethod, 
  HttpStatus, 
  ActionResponse,
  ActionResponseType 
} from '@adobe-commerce/aio-toolkit';

const handler = Action.execute(
  'typed-action',
  [HttpMethod.POST],
  ['userId'],
  [],
  async (params: { [key: string]: any }, ctx): Promise<ActionResponseType> => {
    const userId = params.userId as string;
    
    return ActionResponse.success({
      userId,
      timestamp: new Date().toISOString()
    });
  }
);
```
