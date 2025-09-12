# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-12-19

### 🎉 Initial Release

This is the first stable release of the **@adobe-commerce/aio-toolkit** - a comprehensive backend toolkit for Adobe App Builder applications. This release provides standardized tools and utilities for backend functionality across all major Adobe App Builder development scenarios.

#### 🏗️ Commerce Components
- **[AdobeAuth](./docs/adobe-auth.md)** `[Added]` - Adobe IMS authentication and token management
  - Static token retrieval with configurable IMS context
  - Support for custom scopes and client credentials
  - Comprehensive error handling for authentication failures
  - TypeScript interfaces for IMS configuration

- **[AdobeCommerceClient](./docs/adobe-commerce-client.md)** `[Added]` - HTTP client for Adobe Commerce API integration
  - Multiple authentication strategies (Basic Auth, OAuth 1.0a, IMS Bearer Token)
  - Built-in request/response logging and error handling
  - Configurable HTTP client with Got.js integration
  - Support for all HTTP methods (GET, POST, PUT, DELETE)
  - Connection pattern for extensible authentication

#### 🔧 Framework Components
- **[EventConsumerAction](./docs/event-consumer-action.md)** `[Added]` - Event-driven processing for Adobe I/O Events
  - Automatic event validation and processing
  - Configurable retry mechanisms and error handling
  - Support for custom event handlers and middleware
  - Built-in logging and monitoring capabilities

- **[FileRepository](./docs/file-repository.md)** `[Added]` - File-based storage with CRUD operations
  - Complete CRUD operations for JSON file management
  - Integration with Adobe I/O Runtime file system
  - Automatic timestamp-based ID generation
  - Error handling with graceful degradation
  - TypeScript interfaces for file records

- **[GraphQlAction](./docs/graphql-action.md)** `[Added]` - GraphQL server implementation
  - Schema validation and type safety
  - Custom resolver support with context injection
  - Error handling and response formatting
  - Integration with Adobe I/O Runtime

- **[OpenWhisk](./docs/openwhisk.md)** `[Added]` - OpenWhisk client for serverless action invocation
  - Direct OpenWhisk action invocation
  - Parameter passing and response handling
  - Error management and timeout handling
  - TypeScript support for action parameters

- **[OpenWhiskAction](./docs/openwhisk-action.md)** `[Added]` - OpenWhisk action wrapper
  - Standardized action structure with logging
  - Request parameter validation
  - Error handling with proper HTTP status codes
  - Extensible base class for custom actions

- **[RuntimeAction](./docs/runtime-action.md)** `[Added]` - HTTP request handling and business logic execution
  - Complete HTTP request/response handling
  - Parameter validation and error management
  - Built-in logging and debugging support
  - Success and error response utilities
  - TypeScript interfaces for all HTTP methods and status codes

#### 🔗 Integration Components
- **[BearerToken](./docs/bearer-token.md)** `[Added]` - Bearer token extraction utility for OpenWhisk actions
  - Extract and validate Bearer tokens from OpenWhisk headers
  - JWT token parsing with expiration validation
  - Support for custom token formats
  - Token information extraction with expiry details

- **[InfiniteLoopBreaker](./docs/infinite-loop-breaker.md)** `[Added]` - Detect and prevent infinite loops in event-driven applications
  - SHA256-based fingerprinting for event deduplication
  - Configurable TTL for stored fingerprints
  - State-based persistence using Adobe I/O State
  - Support for custom key and fingerprint functions
  - Comprehensive error handling and logging

- **[OnboardEvents](./docs/onboard-events.md)** `[Added]` - Complete onboarding orchestration for Adobe I/O Events
  - **Comprehensive Event Onboarding**: End-to-end orchestration of providers, event metadata, and registrations
  - **Provider Management**: Create and manage Adobe I/O Events providers with commerce-specific metadata
  - **Event Metadata Creation**: Automated event metadata creation with sample templates
  - **Registration Management**: Complete registration lifecycle with webhook configuration
  - **Automated Summary Logging**: Rich summary reports with visual indicators (✅ created, ⏭️ existing, ❌ failed)
  - **Error Handling**: Robust error handling with detailed logging and recovery mechanisms
  - **Input Validation**: Comprehensive input parsing and validation
  - **TypeScript Support**: Full type definitions for all interfaces and responses

- **[RestClient](./docs/rest-client.md)** `[Added]` - HTTP client for external API integration
  - Support for all HTTP methods (GET, POST, PUT, DELETE)
  - Configurable headers and request/response handling
  - Error handling with status code management
  - JSON and text response parsing
  - TypeScript interfaces for headers and responses

#### 📡 I/O Events Components
- **[EventMetadataManager](./docs/event-metadata.md)** `[Added]` - Manage event metadata for Adobe I/O Events providers
  - Complete CRUD operations for event metadata
  - Sample event template management
  - URL encoding support for event codes
  - Comprehensive error handling and validation
  - TypeScript interfaces for all operations

- **[ProviderManager](./docs/provider.md)** `[Added]` - Manage event providers for Adobe I/O Events
  - Provider creation, retrieval, updating, and deletion
  - Support for provider metadata and documentation URLs
  - Query parameter support for filtering
  - Commerce-specific provider enhancements
  - Complete HAL+JSON response handling

- **[RegistrationManager](./docs/registration.md)** `[Added]` - Manage event registrations and subscriptions
  - Registration lifecycle management
  - Support for webhook, journal, and EventBridge delivery types
  - Event filtering and subscription management
  - Query parameter support for advanced filtering
  - TypeScript interfaces for all registration models

---

## 🛠️ **Development & Quality Assurance**

- **100% Test Coverage**: Comprehensive test suite with 1,135+ test cases covering all components
- **TypeScript Support**: Full TypeScript implementation with strict configuration
- **Automated Quality Checks**: 
  - Pre-commit hooks with Prettier formatting and ESLint
  - Pre-push validation with type checking and full test suite
  - Conventional commit message validation
- **Build System**: Modern build pipeline with tsup supporting ESM/CJS dual output
- **Documentation**: Comprehensive documentation for all components and APIs
- **Development Workflow**: 
  - Watch mode for development
  - Automated validation pipeline
  - Code quality enforcement

---

## 📦 **Package Information**

- **Package Name**: `@adobe-commerce/aio-toolkit`
- **Version**: 1.0.0
- **Node.js Support**: >=18.0.0
- **TypeScript Support**: >=4.9.0
- **License**: Proprietary (Adobe Commerce)
- **Distribution**: Available via GitHub Packages

### Dependencies
- `@adobe/aio-lib-ims`: ^7.0.2
- `@adobe/aio-sdk`: ^5.0.0
- `got`: ^11.8.6
- `graphql`: ^16.11.0
- `node-fetch`: ^2.7.0
- `oauth-1.0a`: ^2.2.6
- `openwhisk`: ^3.21.8

---

## 🎯 **Key Features**

- **🔄 Complete Adobe I/O Events Integration**: End-to-end event management from provider creation to registration
- **🔐 Multi-Authentication Support**: Bearer tokens, OAuth 1.0a, Basic Auth, and Adobe IMS
- **📁 File System Management**: CRUD operations for Adobe I/O Runtime file storage
- **🔄 Event Loop Protection**: Advanced infinite loop detection and prevention
- **🌐 HTTP Client Utilities**: Robust REST and GraphQL client implementations
- **⚡ Serverless Action Support**: OpenWhisk action wrappers and utilities
- **📊 Comprehensive Logging**: Structured logging with detailed summary reports
- **🧪 Production Ready**: 100% test coverage with strict quality standards
- **📚 Full Documentation**: Complete API documentation and usage guides

---

## 🚀 **Getting Started**

```bash
# Install the package
npm install @adobe-commerce/aio-toolkit

# Import components
import { 
  OnboardEvents, 
  AdobeCommerceClient, 
  RestClient,
  BearerToken,
  InfiniteLoopBreaker 
} from '@adobe-commerce/aio-toolkit';
```

This release provides a solid foundation for Adobe App Builder backend development with enterprise-grade tooling, comprehensive documentation, and production-ready components.

For detailed usage instructions and API documentation, please refer to the individual component documentation linked above.
