# AdobeAuth Documentation

## Overview

The **AdobeAuth** component is a core authentication utility in the Adobe Commerce AIO Toolkit that provides seamless integration with Adobe IMS (Identity Management System). It simplifies the process of obtaining authentication tokens for Adobe services and APIs, making it easy to authenticate your applications with Adobe Commerce and other Adobe services.

## Table of Contents

- [Overview](#overview)
- [Core Components](#core-components)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Configuration](#configuration)
- [Examples](#examples)
- [Integration with RuntimeAction](#integration-with-runtimeaction)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)

## Core Components

### 1. AdobeAuth Class (`src/commerce/adobe-auth/index.ts`)

The main `AdobeAuth` class provides:

- **Static token generation** via the `getToken()` method
- **Adobe IMS integration** using the official `@adobe/aio-lib-ims` library
- **Context management** for secure credential storage
- **Scope-based authentication** supporting multiple permission levels

### 2. Types (`src/commerce/adobe-auth/types.ts`)

TypeScript interfaces for type safety:

- `AdobeIMSConfig` - Configuration structure for Adobe IMS authentication

## Usage

### Basic Authentication

```typescript
import { AdobeAuth } from '@adobe-commerce/aio-toolkit';

// Get authentication token
const token = await AdobeAuth.getToken(
  'your-client-id',
  'your-client-secret', 
  'your-technical-account-id',
  'your-technical-account-email',
  'your-ims-org-id',
  ['AdobeID', 'openid', 'adobeio_api'] // Scopes
);

console.log('Authentication token:', token);
```

### Integration with Commerce Client

```typescript
import { 
  AdobeCommerceClient, 
  ImsConnection 
} from '@adobe-commerce/aio-toolkit';

// Create IMS connection using AdobeAuth internally
const imsConnection = new ImsConnection(
  'client-id',
  'client-secret',
  'technical-account-id',
  'technical-account-email',
  'ims-org-id',
  ['AdobeID', 'openid', 'adobeio_api']
);

// Create Commerce client with IMS authentication
const commerceClient = new AdobeCommerceClient(
  'https://your-commerce-instance.com',
  imsConnection
);

// Make authenticated API calls
const products = await commerceClient.get('/rest/V1/products');
```

### Custom Context Configuration

```typescript
// Use custom context for credential storage
const token = await AdobeAuth.getToken(
  clientId,
  clientSecret,
  technicalAccountId,
  technicalAccountEmail,
  imsOrgId,
  scopes,
  'my-custom-context' // Custom context name
);
```

## API Reference

### AdobeAuth.getToken()

Retrieves an authentication token from Adobe IMS.

```typescript
static async getToken(
  clientId: string,
  clientSecret: string,
  technicalAccountId: string,
  technicalAccountEmail: string,
  imsOrgId: string,
  scopes: string[],
  currentContext?: string
): Promise<string>
```

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `clientId` | `string` | Yes | - | The client ID for the Adobe IMS integration |
| `clientSecret` | `string` | Yes | - | The client secret for the Adobe IMS integration |
| `technicalAccountId` | `string` | Yes | - | The technical account ID for the Adobe IMS integration |
| `technicalAccountEmail` | `string` | Yes | - | The technical account email for the Adobe IMS integration |
| `imsOrgId` | `string` | Yes | - | The IMS organization ID |
| `scopes` | `string[]` | Yes | - | Array of permission scopes to request for the token |
| `currentContext` | `string` | No | `'onboarding-config'` | The context name for storing the configuration |

#### Returns

- `Promise<string>` - A promise that resolves to the authentication token

#### Throws

- Authentication errors if credentials are invalid
- Context errors if unable to set or configure context
- Network errors if unable to reach Adobe IMS

## Configuration

### AdobeIMSConfig Interface

```typescript
interface AdobeIMSConfig {
  client_id: string;
  client_secrets: string[];
  technical_account_id: string;
  technical_account_email: string;
  ims_org_id: string;
  scopes: string[];
}
```

### Required Adobe IMS Setup

Before using AdobeAuth, ensure you have:

1. **Adobe Developer Console Project** with appropriate APIs enabled
2. **Service Account (JWT) Credentials** configured
3. **Required Scopes** assigned to your integration
4. **Technical Account** details from your Adobe Developer Console

### Common Scopes

- `AdobeID` - Basic Adobe ID authentication
- `openid` - OpenID Connect authentication
- `adobeio_api` - Adobe I/O API access
- `read_organizations` - Organization data access
- `additional_info.projectedProductContext` - Product context information

## Examples

### 1. Basic Authentication

```typescript
import { AdobeAuth } from '@adobe-commerce/aio-toolkit';

const token = await AdobeAuth.getToken(
  process.env.ADOBE_CLIENT_ID!,
  process.env.ADOBE_CLIENT_SECRET!,
  process.env.ADOBE_TECHNICAL_ACCOUNT_ID!,
  process.env.ADOBE_TECHNICAL_ACCOUNT_EMAIL!,
  process.env.ADOBE_IMS_ORG_ID!,
  ['AdobeID', 'openid', 'adobeio_api']
);
```

### 2. With Adobe Commerce Client

```typescript
import { 
  AdobeCommerceClient, 
  ImsConnection 
} from '@adobe-commerce/aio-toolkit';

const imsConnection = new ImsConnection(
  'client-id',
  'client-secret', 
  'technical-account-id',
  'technical-account-email',
  'ims-org-id',
  ['AdobeID', 'openid', 'adobeio_api']
);

const commerceClient = new AdobeCommerceClient(
  'https://your-commerce-instance.com',
  imsConnection
);

const products = await commerceClient.get('/rest/V1/products');
```

## Integration with RuntimeAction

Use AdobeAuth within RuntimeAction for authenticated Adobe I/O Runtime actions:

```typescript
import { 
  RuntimeAction, 
  RuntimeActionResponse, 
  HttpMethod, 
  HttpStatus,
  AdobeAuth 
} from '@adobe-commerce/aio-toolkit';

const authenticatedAction = RuntimeAction.execute(
  'adobe-commerce-sync',
  [HttpMethod.POST],
  ['clientId', 'clientSecret', 'technicalAccountId', 'technicalAccountEmail', 'imsOrgId'],
  [],
  async (params, ctx) => {
    const { logger } = ctx;
    
    try {
      const token = await AdobeAuth.getToken(
        params.clientId,
        params.clientSecret,
        params.technicalAccountId,
        params.technicalAccountEmail,
        params.imsOrgId,
        ['AdobeID', 'openid', 'adobeio_api']
      );
      
      logger.info('Successfully authenticated with Adobe IMS');
      
      // Use token for authenticated operations
      const result = await performAuthenticatedOperation(token);
      
      return RuntimeActionResponse.success(result);
      
    } catch (error) {
      logger.error('Authentication failed:', error);
      return RuntimeActionResponse.error(HttpStatus.UNAUTHORIZED, 'Authentication failed');
    }
  }
);

exports.main = authenticatedAction;
```

## Error Handling

```typescript
try {
  const token = await AdobeAuth.getToken(/* parameters */);
} catch (error) {
  if (error.message.includes('Invalid client credentials')) {
    console.error('Invalid client ID or secret');
  } else if (error.message.includes('Invalid JWT')) {
    console.error('Technical account configuration is incorrect');
  } else {
    console.error('Authentication error:', error);
  }
}
```

## Best Practices

1. **Secure Credentials**: Always use environment variables, never hardcode credentials
2. **Token Caching**: Consider caching tokens to avoid unnecessary authentication calls (tokens typically expire in 1 hour)
3. **Required Scopes**: Include minimum required scopes: `['AdobeID', 'openid', 'adobeio_api']`
4. **Error Handling**: Implement proper error handling for authentication failures
5. **Context Names**: Use descriptive context names for different environments (e.g., 'commerce-prod', 'commerce-dev')

## Integration with Other Toolkit Components

AdobeAuth integrates seamlessly with other toolkit components:

- **[RuntimeAction](./runtime-action.md)** - Use within action handlers for authenticated operations
- **[EventConsumerAction](./event-consumer-action.md)** - Use within event handlers for authenticated event processing
- **[GraphQlAction](./graphql-action.md)** - Use within GraphQL resolvers for authenticated operations
- **ImsConnection** - Automatically handles token generation for Adobe Commerce API calls
- **[AdobeCommerceClient](./adobe-commerce-client.md)** - Provides authenticated HTTP client for Commerce APIs
- **[BearerToken](./bearer-token.md)** - Complementary utility for extracting Bearer tokens from request headers
- **[RestClient](./rest-client.md)** - Can be extended with Adobe authentication headers

### Related Documentation:

- **[RuntimeAction](./runtime-action.md)** - For creating authenticated Adobe I/O Runtime actions
- **[EventConsumerAction](./event-consumer-action.md)** - For creating authenticated event processing actions
- **[GraphQlAction](./graphql-action.md)** - For creating authenticated GraphQL endpoints
- **[AdobeCommerceClient](./adobe-commerce-client.md)** - For Commerce API integration with IMS authentication
- **[BearerToken](./bearer-token.md)** - For extracting Bearer tokens from incoming requests for validation
- **[RestClient](./rest-client.md)** - For authenticated HTTP requests to Adobe services
