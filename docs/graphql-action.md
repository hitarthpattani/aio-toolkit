# GraphQlAction Documentation

## Overview

The **GraphQlAction** component provides a complete GraphQL server implementation for the Adobe Commerce AIO Toolkit. It creates RuntimeAction-based HTTP endpoints that can execute GraphQL queries and mutations with schema validation, introspection control, variable handling, and comprehensive error management. The component is built on top of the standard GraphQL.js library and integrates seamlessly with the toolkit's RuntimeAction system.

## Table of Contents

- [Overview](#overview)
- [Core Features](#core-features)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Examples](#examples)
- [GraphQL Patterns](#graphql-patterns)
- [Schema Design](#schema-design)
- [Error Handling](#error-handling)
- [Security](#security)
- [Best Practices](#best-practices)
- [Integration with Framework](#integration-with-framework)
- [Constants Reference](#constants-reference)

## Core Features

### 1. GraphQL Server Creation

- **Schema-based execution** with GraphQL.js integration
- **RuntimeAction-based endpoints** for HTTP GET and POST requests
- **Resolver function support** with context injection
- **Variable handling** for parameterized queries

### 2. Security Features

- **Introspection control** to disable schema introspection in production
- **Query validation** with built-in GraphQL validation
- **Error handling** with proper HTTP status codes
- **Authentication support** through RuntimeAction headers

### 3. Development Features

- **Context injection** with logger, headers, and parameters
- **Flexible resolver patterns** for data fetching
- **Variable parsing** for JSON and object variables
- **Operation name support** for named queries

## Usage

### Basic Import

```typescript
const { GraphQlAction } = require('@adobe-commerce/aio-toolkit');
```

### Individual Import

```typescript
const { GraphQlAction } = require('@adobe-commerce/aio-toolkit');
```

## API Reference

### GraphQlAction.execute()

Creates GraphQL server endpoints with schema validation and execution.

```typescript
static execute(
  schema?: string,
  resolvers?: (ctx: {
    logger: any;
    headers: { [key: string]: any };
    params: { [key: string]: any };
  }) => Promise<any>,
  name?: string,
  disableIntrospection?: boolean
): (params: { [key: string]: any }) => Promise<RuntimeActionResponseType>
```

**Parameters:**

- `schema` (string, optional): GraphQL schema definition in SDL format (default: empty schema)
- `resolvers` (function, optional): Resolver function that returns resolver object (default: returns empty object)
- `name` (string, optional): Action name suffix for endpoint identification (default: 'main')
- `disableIntrospection` (boolean, optional): Whether to disable introspection queries (default: false)

**Returns:** Function that can be used as an Adobe I/O Runtime action handler

**HTTP Requirements:**

- **Methods**: GET and POST
- **Required Parameters**: `query` (GraphQL query string)
- **Optional Parameters**: `variables` (JSON string or object), `operationName` (string)
- **Response**: GraphQL execution result with data or errors

**Context Object:**
The resolver function receives a context object containing:

- `logger`: Adobe I/O SDK logger instance
- `headers`: HTTP request headers
- `params`: Request parameters including query, variables, and operationName

## Examples

### 1. Basic GraphQL Server

```typescript
const { GraphQlAction } = require('@adobe-commerce/aio-toolkit');

const schema = `
  type Query {
    hello: String
    user(id: ID!): User
  }
  
  type User {
    id: ID!
    name: String!
    email: String!
  }
`;

const resolvers = async ctx => {
  const { logger } = ctx;

  return {
    hello: () => 'Hello, World!',
    user: ({ id }) => {
      logger.debug(`Fetching user: ${id}`);
      return {
        id,
        name: 'John Doe',
        email: 'john@example.com'
      };
    }
  };
};

// Create and export GraphQL endpoint
module.exports.main = GraphQlAction.execute(schema, resolvers, 'api');
```

### 2. Adobe Commerce Integration

```typescript
const { 
  GraphQlAction,
  AdobeCommerceClient,
  BasicAuthConnection 
} = require('@adobe-commerce/aio-toolkit');

const schema = `
  type Query {
    products(limit: Int): [Product]
    product(sku: String!): Product
  }
  
  type Product {
    sku: String!
    name: String!
    price: Float!
    inStock: Boolean!
  }
`;

const resolvers = async ctx => {
  const { logger } = ctx;
  
  const connection = new BasicAuthConnection(
    process.env.COMMERCE_URL,
    process.env.COMMERCE_USER,
    process.env.COMMERCE_PASS
  );
  const client = new AdobeCommerceClient(process.env.COMMERCE_URL, connection);

  return {
    products: async ({ limit = 10 }) => {
      const response = await client.get(`rest/V1/products?searchCriteria[pageSize]=${limit}`);
      return response.success ? response.message.items.map(p => ({
        sku: p.sku,
        name: p.name,
        price: p.price,
        inStock: p.extension_attributes?.stock_item?.is_in_stock || false
      })) : [];
    },
    
    product: async ({ sku }) => {
      const response = await client.get(`rest/V1/products/${sku}`);
      if (!response.success) throw new Error(`Product not found: ${sku}`);
      
      const p = response.message;
      return {
        sku: p.sku,
        name: p.name,
        price: p.price,
        inStock: p.extension_attributes?.stock_item?.is_in_stock || false
      };
    }
  };
};

module.exports.main = GraphQlAction.execute(schema, resolvers, 'commerce-api');
```
### 3. Authentication with AdobeAuth

```typescript
const { 
  GraphQlAction,
  AdobeAuth 
} = require('@adobe-commerce/aio-toolkit');

const schema = `
  type Query {
    profile: UserProfile
    adminData: String
  }
  
  type UserProfile {
    id: ID!
    name: String!
    email: String!
  }
`;

const resolvers = async ctx => {
  const { headers, logger } = ctx;
  
  // Get authentication token
  const authHeader = headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Authentication required');
  }
  
  try {
    const token = await AdobeAuth.getToken(
      process.env.ADOBE_CLIENT_ID,
      process.env.ADOBE_CLIENT_SECRET,
      process.env.ADOBE_TECHNICAL_ACCOUNT_ID,
      process.env.ADOBE_TECHNICAL_ACCOUNT_EMAIL,
      process.env.ADOBE_IMS_ORG_ID,
      ['openid', 'adobeio_api']
    );
    
    return {
      profile: () => ({
        id: '123',
        name: 'John Doe',
        email: 'john@example.com'
      }),
      
      adminData: () => 'Sensitive admin information'
    };
    
  } catch (error) {
    logger.error('Authentication failed:', error);
    throw new Error('Invalid authentication');
  }
};

module.exports.main = GraphQlAction.execute(
  schema, 
  resolvers, 
  'auth-api',
  true // Disable introspection for security
);
```

## Best Practices

### Schema Design
- Use clear, descriptive type and field names
- Add documentation strings for complex types
- Use enums for fixed value sets
- Implement proper input validation

### Security
- **Disable introspection in production**: Set `disableIntrospection: true`
- **Validate all inputs**: Sanitize user-provided data
- **Implement authentication**: Use AdobeAuth or custom auth logic
- **Rate limiting**: Implement query complexity analysis

### Performance
- **Cache frequently accessed data** in resolvers
- **Batch database operations** to avoid N+1 problems  
- **Use DataLoader pattern** for efficient data fetching
- **Monitor resolver execution times** and optimize bottlenecks

### Error Handling
- **Provide meaningful error messages** that don't leak sensitive information
- **Use proper HTTP status codes** through RuntimeActionResponse
- **Log errors appropriately** for debugging and monitoring
- **Implement graceful degradation** for non-critical failures

## Integration with Other Toolkit Components

The GraphQlAction component integrates seamlessly with other toolkit components:

- **[RuntimeAction](./runtime-action.md)**: Built on top of RuntimeAction for HTTP endpoint creation and request handling
- **[AdobeCommerceClient](./adobe-commerce-client.md)**: Can be used in resolvers for e-commerce data fetching
- **[AdobeAuth](./adobe-auth.md)**: Provides authentication for GraphQL endpoints
- **[EventConsumerAction](./event-consumer-action.md)**: Can trigger GraphQL operations through events
- **RestClient**: Access external API operations within GraphQL resolvers

### Related Documentation:

- **[RuntimeAction](./runtime-action.md)** - Foundation for HTTP endpoint creation used by GraphQL
- **[AdobeCommerceClient](./adobe-commerce-client.md)** - For e-commerce data integration in resolvers
- **[AdobeAuth](./adobe-auth.md)** - For authentication in GraphQL resolvers
- **[EventConsumerAction](./event-consumer-action.md)** - For event-driven GraphQL operations

### Common Integration Patterns:

- **GraphQL + RuntimeAction**: HTTP GraphQL endpoints with proper validation
- **GraphQL + AdobeCommerceClient**: E-commerce GraphQL APIs
- **GraphQL + AdobeAuth**: Authenticated GraphQL endpoints
- **GraphQL + EventConsumerAction**: Event-driven GraphQL operations

## Constants Reference

The GraphQlAction component integrates with the toolkit's types module for consistent HTTP handling.

### Key Constants Used in GraphQL:

- **HttpMethod**: `GET`, `POST` - GraphQL endpoints support both GET and POST requests
- **HttpStatus**: `OK` (200), `BAD_REQUEST` (400), `INTERNAL_ERROR` (500) - Used for response status codes

For comprehensive examples and best practices with HTTP constants, refer to the RuntimeAction types module.

The GraphQlAction component provides a complete, production-ready GraphQL server implementation that integrates seamlessly with the Adobe Commerce AIO Toolkit, offering powerful query capabilities with built-in security, validation, and performance features.
